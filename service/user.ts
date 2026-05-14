"use server";
import {
  BROKER_CLIENT_MAPPING,
  CLIENT_INVITATION,
  USER_COLLECTION,
  USER_FUNDING_APPLICATION,
  USER_FUNDING_APPLICATION_CONGRATS,
} from "@/constant/collection-name";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";
import AppError from "@/error/AppError";
import { normalizeAllDates, normalizeDate } from "@/lib/date-parser";
import {
  authenticationAdmin,
  firestoreAdmin,
  storageAdmin,
} from "@/lib/fireabase-admin";
import { logError, logInfo } from "@/lib/logger";
import { sendTriggerEmail } from "@/service/trigger-email";
import { EmailJobs } from "@/schema/trigger-email";
import { ChangePassword, CurrentUser, Role, Business } from "@/schema";
import { noteSchema, NoteSchema } from "@/schema/notes";

import { User, UserActiveStatus, UserWithId } from "@/schema/registration";
import { format } from "date-fns";
import { cookies, headers } from "next/headers";
import { FieldPath } from "firebase-admin/firestore";
import { ApplyFunding } from "@/schema/apply-funding";
import { applyFunding } from "./apply-funding";
import { recordBusiness } from "./business";
import * as crypto from "node:crypto";
import {
  sendClientFundingApplicationAuditAnalysis,
  sendClientFundingApplicationCongratsMessage,
} from "./crs";
import { RegistrationType } from "@/schema/users";
import { generateEmailVerificationToken } from "./email-verification";
import { createAsanaTaskForLender } from "@/lib/n8n";

export const getUserRecordByEmail = async (email: string) => {
  const authentication = authenticationAdmin();
  let userRecord = null;

  try {
    userRecord = await authentication.getUserByEmail(email);
  } catch (error) {
    // console.error(error);
  }

  return userRecord;
};

/**
 * @deprecated use getUserById
 */
export const getUser = async (email: string): Promise<User | null> => {
  const userRecord = await getUserRecordByEmail(email);

  if (!userRecord) return null;

  const db = firestoreAdmin();

  const collectionRef = db.collection(USER_COLLECTION);
  const querySnapshot = await collectionRef.where("email", "==", email).get();
  if (querySnapshot.empty) return null;

  const userDoc = querySnapshot.docs[0];
  const user = userDoc.data();

  const userData = { id: userDoc.id, ...normalizeAllDates(user) } as User;

  if (!userData.registrationDate) {
    userData.registrationDate = new Date(userRecord.metadata.creationTime);
    await collectionRef
      .doc(userDoc.id)
      .update({ registrationDate: userData.registrationDate });
  }

  const may15Cutoff = new Date("2026-05-15T00:00:00Z");
  if (
    userData.isOnboarded === undefined ||
    (userData.isOnboarded === false &&
      userData.registrationDate &&
      new Date(userData.registrationDate).getTime() < may15Cutoff.getTime())
  ) {
    userData.isOnboarded = true;
    await collectionRef.doc(userDoc.id).update({ isOnboarded: true });
  }

  return userData;
};

export const getUserById = async (id: string): Promise<UserWithId | null> => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(USER_COLLECTION);
  const docRef = collectionRef.doc(id);
  const docSnapshot = await docRef.get();

  if (!docSnapshot.exists) return null;

  const userDoc = docSnapshot;
  const user = userDoc.data();
  const userData = { id: userDoc.id, ...normalizeAllDates(user) } as UserWithId;

  if (!userData.registrationDate) {
    try {
      const authUser = await authenticationAdmin().getUser(id);
      userData.registrationDate = new Date(authUser.metadata.creationTime);
      await docRef.update({ registrationDate: userData.registrationDate });
    } catch (err) {
      console.error("Failed to fetch user creation time from auth:", err);
    }
  }

  const may15Cutoff = new Date("2026-05-15T00:00:00Z");
  if (
    userData.isOnboarded === undefined ||
    (userData.isOnboarded === false &&
      userData.registrationDate &&
      new Date(userData.registrationDate).getTime() < may15Cutoff.getTime())
  ) {
    userData.isOnboarded = true;
    await docRef.update({ isOnboarded: true });
  }

  // If this is a client, fetch broker information
  if (userData.role === "Client") {
    const mappingSnapshot = await db
      .collection(BROKER_CLIENT_MAPPING)
      .where("clientId", "==", id)
      .where("status", "==", "Active")
      .limit(1)
      .get();

    if (!mappingSnapshot.empty) {
      const mappingData = mappingSnapshot.docs[0].data();
      const brokerId = mappingData.brokerId;

      // Fetch broker details
      const brokerDoc = await db
        .collection(USER_COLLECTION)
        .doc(brokerId)
        .get();
      if (brokerDoc.exists) {
        const brokerData = brokerDoc.data();
        const brokerName = `${brokerData?.firstName || ""} ${
          brokerData?.lastName || ""
        }`.trim();

        return {
          ...userData,
          brokerId,
          brokerName: brokerName || "",
        } as UserWithId;
      }
    }

    // No broker mapping found
    return {
      ...userData,
      brokerName: "",
    } as UserWithId;
  }

  return userData;
};

export const registerUser = async ({
  user,
  registrationType,
  brokerName,
  brokerId,
  fundingData,
  isBrokerInvite = false,
}: {
  user: User;
  registrationType: RegistrationType;
  brokerName?: string;
  brokerId?: string;
  fundingData?: ApplyFunding;
  isBrokerInvite?: boolean;
}) => {
  const userRecord = await getUserRecordByEmail(user.email);

  if (userRecord) {
    throw new AppError("Cannot register duplicate email.");
  }

  const db = firestoreAdmin();

  const collectionRef = db.collection(USER_COLLECTION);

  const userData: User = {
    ...user,
    registrationDate: new Date(),
    activeStatus: "Active",
    isOnboarded: false,
    denefitsSignedUp: false,
  };
  delete (userData as { password?: string }).password;

  const docRef = await collectionRef.add(userData);
  const userId = docRef.id;
  const data = (await docRef.get()).data();

  // Create business record first if business data exists
  let businessId: string | undefined;
  let referenceNumber: string | undefined;
  if (fundingData?.businessName && fundingData.businessName.trim().length > 0) {
    const businessData: Business = {
      userId: userId,
      businessName: fundingData.businessName,
      businessStreetAddress: fundingData.businessStreetAddress ?? "",
      businessStreetHouseNumber: fundingData.businessStreetHouseNumber,
      businessCityAddress: fundingData.businessCityAddress ?? "",
      businessStateAddress: fundingData.businessStateAddress ?? "",
      businessPostalAddress: fundingData.businessPostalAddress ?? "",
      employerIdentificationNumber:
        fundingData.employerIdentificationNumber ?? "",
      businessPhoneNumber: fundingData.businessPhoneNumber ?? "",
      businessEmail: fundingData.businessEmail ?? "",
      businessWebsite: fundingData.businessWebsite,
      socialMedia: fundingData.socialMedia,
    };

    // Record business and get the ID
    const businessDocRef = await recordBusiness(businessData);
    businessId = businessDocRef;
  }

  // Create funding application if fundingData is provided
  if (fundingData) {
    const fundApplication: ApplyFunding = {
      ...fundingData,
      userId: userId,
      businessId: businessId, // Set the businessId from created business
      appliedDate: fundingData.appliedDate || new Date(),
      status: fundingData.status || "New",
      analysisStatus: fundingData.analysisStatus || "In Progress",
    };

    const result = await applyFunding({
      value: fundApplication,
      registrationType,
    });

    referenceNumber = result.referenceNumber;
    logInfo("Funding application created", { referenceNumber });

    // Store referenceNumber for later use in email verification
    if (
      user.role === "Client" &&
      referenceNumber &&
      registrationType === "Self"
    ) {
      // We'll pass referenceNumber to the verification token
      // Analysis will be triggered AFTER email verification
      fundingData.referenceNumber = referenceNumber;
    }

    if (
      user.role === "Client" &&
      referenceNumber &&
      registrationType !== "Self"
    ) {
      // For non-self registrations (Broker/Admin), trigger analysis immediately
      // Send Client Congrats Message
      await sendClientFundingApplicationCongratsMessage({
        userId: userId,
        referenceNumber,
      });

      // Send Client Audit Analysis
      await sendClientFundingApplicationAuditAnalysis({
        userId: userId,
        referenceNumber,
      });
    }
  }

  const authAdmin = authenticationAdmin();

  await authAdmin.createUser({
    uid: userId,
    email: user.email,
    password: user.password,
    displayName: `${user.firstName} ${user.lastName}`,
    disabled: false,
    emailVerified: false,
  });

  // Link client to broker if brokerId is provided
  if (brokerId && user.role === "Client") {
    await updateClientBrokerMapping({
      clientId: userId,
      brokerId,
      brokerName: brokerName || "",
      clientName: `${user.firstName} ${user.lastName}`,
      clientEmail: user.email,
    });
  }

  logInfo("Generating token...", {
    userId: userId,
    email: user.email,
    referenceNumber: referenceNumber,
    registrationType,
  });

  // Generate custom verification token
  const verificationToken = await generateEmailVerificationToken({
    userId: userId,
    email: user.email,
    referenceNumber: referenceNumber,
    registrationType,
  });

  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email/${verificationToken}`;
  // logInfo("Generated email verification link:", { verificationLink });

  let requestBody = "";
  if (registrationType === "Broker" && brokerName) {
    requestBody = getBrokerInvitationToClientBody({
      clientName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      temporaryPassword: user.password!,
      loginUrl: process.env.NEXT_PUBLIC_APP_URL!,
      brokerName: brokerName,
      verificationLink: verificationLink,
    });
  } else if (registrationType === "Admin") {
    requestBody = getAdminInvitationToClientBody({
      clientName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      temporaryPassword: user.password!,
      loginUrl: process.env.NEXT_PUBLIC_APP_URL!,
      verificationLink: verificationLink,
    });
  } else {
    requestBody = getVerifyEmailBody(verificationLink);
  }

  await sendTriggerEmail({
    to: user.email,
    message: {
      subject: "Verify Email",
      html: requestBody,
    },
    job: EmailJobs.EMAIL_VERIFICATION,
  });

  const registrationBody = getNewRegistrationBody(user);

  await sendTriggerEmail({
    to: process.env.NEW_REGISTRATION_EMAIL_NOTIF!,
    message: {
      subject: `New Registration - ${user.firstName} ${user.lastName}`,
      html: registrationBody,
    },
    job: EmailJobs.NEW_REGISTRATION,
  });

  if (user.role === "Client" && referenceNumber) {
    await createAsanaTaskForNewRegistration({
      userId: userId,
      referenceNumber: referenceNumber,
    });
  }

  return {
    id: docRef.id,
    ...normalizeAllDates(data),
  };
};

const createAsanaTaskForNewRegistration = async ({
  userId,
  referenceNumber,
}: {
  userId: string;
  referenceNumber?: string;
}) => {
  await fetch(`${process.env.n8n_HOST}/${await createAsanaTaskForLender()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
    },
    body: JSON.stringify({
      userId: userId,
      referenceNumber: referenceNumber,
    }),
  });
};

const getVerifyEmailBody = (link: string) => {
  return `<p style="font-family:Arial,Helvetica,sans-serif; font-size:16px; color:#111827; margin:0 0 12px;">
  Please confirm your email address to finish setting up your account.
</p>

<p style="margin:0;">
  <a href="${link}" target="_blank" rel="noopener noreferrer"
     style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; font-weight:600; font-size:16px; padding:12px 18px; border-radius:8px;">
    Verify Email
  </a>
</p>
<p style="font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#6b7280; margin:16px 0 0;">
  If the button doesn't work, paste this URL into your browser: <br />
  <a href="${link}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;">${link}</a>
</p>

<p style="font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#6b7280; margin:12px 0 0;">Thanks, <br />CEG United LLC team</p>`;
};

const getBrokerInvitationToClientBody = ({
  clientName,
  brokerName,
  email,
  temporaryPassword,
  loginUrl,
  verificationLink,
}: {
  clientName: string;
  brokerName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  verificationLink: string;
}) => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; padding: 25px;">
    <h2 style="margin-top: 0; color: #333333; border-bottom: 2px solid #eeeeee; padding-bottom: 10px;">
        Welcome to CEG United LLC
    </h2>
    
    <p style="color: #555555; font-size: 16px; line-height: 1.5em; margin: 0 0 16px 0;">
        Hello ${clientName},
    </p>
    
    <p style="color: #555555; font-size: 16px; line-height: 1.5em; margin: 0 0 16px 0;">
        Your broker, <strong>${brokerName}</strong>, has created an account for you on the CEG United LLC platform. 
        You can now access our financial services and funding application tools.
    </p>
    
    <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px;">Your Login Credentials</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">
                    <strong>Email:</strong>
                </td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-family: 'Courier New', monospace;">
                    ${email}
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                    <strong>Temporary Password:</strong>
                </td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-family: 'Courier New', monospace; background-color: #fef3c7; padding: 4px 8px; border-radius: 4px;">
                    ${temporaryPassword}
                </td>
            </tr>
        </table>
    </div>
    
    <p style="color: #dc2626; font-size: 14px; line-height: 1.5em; margin: 16px 0; padding: 12px; background-color: #fef2f2; border-radius: 6px;">
        ⚠️ <strong>Important:</strong> Please verify your email and change your password immediately after logging in for security purposes.
    </p>
    
    <div style="margin: 24px 0; text-align: center;">
        <a href="${verificationLink}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block; background:#10b981; color:#ffffff; text-decoration:none; font-weight:600; font-size:16px; padding:12px 24px; border-radius:8px; margin-right: 12px;">
            Verify Email
        </a>
        <a href="${loginUrl}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; font-weight:600; font-size:16px; padding:12px 24px; border-radius:8px;">
            Login to Your Account
        </a>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 20px;">
        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px;">Next Steps:</h3>
        <ol style="color: #555555; font-size: 14px; line-height: 1.8em; padding-left: 20px; margin: 0;">
            <li>Click the "Verify Email" button above to confirm your email address</li>
            <li>Click "Login to Your Account" or visit the platform</li>
            <li>Sign in with your email and temporary password</li>
            <li>Change your password in account settings</li>
            <li>Complete your profile information</li>
            <li>Start exploring funding opportunities</li>
        </ol>
    </div>
    
    <p style="color: #6b7280; font-size: 13px; line-height: 1.6em; margin: 24px 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        If you have any questions or need assistance, please contact your broker <strong>${brokerName}</strong> 
        or reach out to our support team at <a href="mailto:contact@cegunited.com" style="color: #2563eb;">contact@cegunited.com</a>.
    </p>
    
    <p style="font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#6b7280; margin:16px 0 0;">
        Best regards,<br />
        <strong>CEG United LLC Team</strong>
    </p>
  </div>
  `;
};

const getAdminInvitationToClientBody = ({
  clientName,
  email,
  temporaryPassword,
  loginUrl,
  verificationLink,
}: {
  clientName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  verificationLink: string;
}) => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; padding: 25px;">
    <h2 style="margin-top: 0; color: #333333; border-bottom: 2px solid #eeeeee; padding-bottom: 10px;">
        Welcome to CEG United LLC
    </h2>
    
    <p style="color: #555555; font-size: 16px; line-height: 1.5em; margin: 0 0 16px 0;">
        Hello ${clientName},
    </p>
    
    <p style="color: #555555; font-size: 16px; line-height: 1.5em; margin: 0 0 16px 0;">
        An administrator has created an account for you on the CEG United LLC platform. 
        You can now access our financial services and funding application tools.
    </p>
    
    <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px;">Your Login Credentials</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">
                    <strong>Email:</strong>
                </td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-family: 'Courier New', monospace;">
                    ${email}
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                    <strong>Temporary Password:</strong>
                </td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-family: 'Courier New', monospace; background-color: #fef3c7; padding: 4px 8px; border-radius: 4px;">
                    ${temporaryPassword}
                </td>
            </tr>
        </table>
    </div>
    
    <p style="color: #dc2626; font-size: 14px; line-height: 1.5em; margin: 16px 0; padding: 12px; background-color: #fef2f2; border-radius: 6px;">
        ⚠️ <strong>Important:</strong> Please verify your email and change your password immediately after logging in for security purposes.
    </p>
    
    <div style="margin: 24px 0; text-align: center;">
        <a href="${verificationLink}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block; background:#10b981; color:#ffffff; text-decoration:none; font-weight:600; font-size:16px; padding:12px 24px; border-radius:8px; margin-right: 12px;">
            Verify Email
        </a>
        <a href="${loginUrl}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; font-weight:600; font-size:16px; padding:12px 24px; border-radius:8px;">
            Login to Your Account
        </a>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 20px;">
        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px;">Next Steps:</h3>
        <ol style="color: #555555; font-size: 14px; line-height: 1.8em; padding-left: 20px; margin: 0;">
            <li>Click the "Verify Email" button above to confirm your email address</li>
            <li>Click "Login to Your Account" or visit the platform</li>
            <li>Sign in with your email and temporary password</li>
            <li>Change your password in account settings</li>
            <li>Complete your profile information</li>
            <li>Start exploring funding opportunities</li>
        </ol>
    </div>
    
    <p style="color: #6b7280; font-size: 13px; line-height: 1.6em; margin: 24px 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        If you have any questions or need assistance, please reach out to our support team at <a href="mailto:contact@cegunited.com" style="color: #2563eb;">contact@cegunited.com</a>.
    </p>
    
    <p style="font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#6b7280; margin:16px 0 0;">
        Best regards,<br />
        <strong>CEG United LLC Team</strong>
    </p>
  </div>
  `;
};

const getNewRegistrationBody = (value: User) => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; padding: 25px;">
    <h2 style="margin-top: 0; color: #333333; border-bottom: 2px solid #eeeeee; padding-bottom: 10px;">
        New User Registration
    </h2>
    <p style="color: #555555; font-size: 16px; line-height: 1.5em; margin: 0 0 20px 0;">
        A new user has registered on the platform. Here are their details:
    </p>
    
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <th style="text-align: left; padding: 12px; border-bottom: 1px solid #eeeeee; width: 150px; color: #555555; background-color: #f9f9f9;">
                Full Name
            </th>
            <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eeeeee; color: #333333;">
                ${value.firstName} ${value.lastName}
            </td>
        </tr>
        <tr>
            <th style="text-align: left; padding: 12px; border-bottom: 1px solid #eeeeee; width: 150px; color: #555555; background-color: #f9f9f9;">
                Email Address
            </th>
            <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eeeeee; color: #333333;">
                ${value.email}
            </td>
        </tr>
        <tr>
            <th style="text-align: left; padding: 12px; border-bottom: 1px solid #eeeeee; width: 150px; color: #555555; background-color: #f9f9f9;">
                Phone Number
            </th>
            <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eeeeee; color: #333333;">
                ${value.phoneNumber}
            </td>
        </tr>
        
        
    </table>
</div>
  `;
};

export const getUsers = async ({
  role,
  email,
  isActive,
}: {
  role?: Role;
  email?: string;
  isActive?: boolean;
}): Promise<UserWithId[]> => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_COLLECTION);

  let query: FirebaseFirestore.Query = collectionRef;
  if (role) {
    query = query.where("role", "==", role);
  }
  if (email) {
    query = query.where("email", "==", email);
  }
  if (isActive) {
    query = query.where("activeStatus", "==", "Active");
  }

  const querySnapshot = await query.get();

  if (querySnapshot.empty) {
    console.log("No matching documents.");
    return [];
  }

  const users: UserWithId[] = [];
  const missingDateIds: string[] = [];
  const missingOnboardedIds: string[] = [];
  const may15Cutoff = new Date("2026-05-15T00:00:00Z");

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const user = { id: doc.id, ...normalizeAllDates(data) } as UserWithId;
    if (!user.registrationDate) {
      missingDateIds.push(doc.id);
    }

    // Check if missing OR if false and before cutoff
    if (
      user.isOnboarded === undefined ||
      (user.isOnboarded === false &&
        user.registrationDate &&
        new Date(user.registrationDate).getTime() < may15Cutoff.getTime())
    ) {
      missingOnboardedIds.push(doc.id);
      user.isOnboarded = true;
    }
    users.push(user);
  });

  if (missingDateIds.length > 0 || missingOnboardedIds.length > 0) {
    try {
      const batchWrites = db.batch();

      if (missingDateIds.length > 0) {
        const identifiers = missingDateIds.map((uid) => ({ uid }));
        for (let i = 0; i < identifiers.length; i += 100) {
          const batch = identifiers.slice(i, i + 100);
          const authUsers = await authenticationAdmin().getUsers(batch);
          authUsers.users.forEach((authUser) => {
            const userIndex = users.findIndex((u) => u.id === authUser.uid);
            if (userIndex !== -1) {
              const creationDate = new Date(authUser.metadata.creationTime);
              users[userIndex].registrationDate = creationDate;

              const docRef = collectionRef.doc(authUser.uid);
              batchWrites.update(docRef, { registrationDate: creationDate });

              if (
                users[userIndex].isOnboarded === false &&
                creationDate.getTime() < may15Cutoff.getTime()
              ) {
                users[userIndex].isOnboarded = true;
                batchWrites.update(docRef, { isOnboarded: true });
              }
            }
          });
        }
      }

      if (missingOnboardedIds.length > 0) {
        missingOnboardedIds.forEach((uid) => {
          const docRef = collectionRef.doc(uid);
          batchWrites.update(docRef, { isOnboarded: true });
        });
      }

      await batchWrites.commit();
    } catch (err) {
      console.error("Failed to update missing properties for users:", err);
    }
  }

  // If getting clients, fetch broker mappings
  if (role === "Client") {
    const clientIds = users.map((u) => u.id);
    const brokerMappings = new Map<
      string,
      { brokerId: string; brokerName: string }
    >();

    // Fetch broker mappings in batches
    for (let i = 0; i < clientIds.length; i += 10) {
      const batch = clientIds.slice(i, i + 10);
      const mappingsSnapshot = await db
        .collection(BROKER_CLIENT_MAPPING)
        .where("clientId", "in", batch)
        .where("status", "==", "Active")
        .get();

      for (const doc of mappingsSnapshot.docs) {
        const data = doc.data();
        brokerMappings.set(data.clientId, {
          brokerId: data.brokerId,
          brokerName: "", // Will be filled below
        });
      }
    }

    // console.log("brokerMappings before fetching names", brokerMappings);

    // Fetch broker names if we have any mappings
    if (brokerMappings.size > 0) {
      const brokerIds = [
        ...new Set([...brokerMappings.values()].map((m) => m.brokerId)),
      ];

      for (let i = 0; i < brokerIds.length; i += 10) {
        const batch = brokerIds.slice(i, i + 10);
        const brokersSnapshot = await db
          .collection(USER_COLLECTION)
          .where(FieldPath.documentId(), "in", batch)
          .get();

        brokersSnapshot.docs.forEach((doc) => {
          const brokerData = doc.data();
          const brokerName = `${brokerData.firstName || ""} ${
            brokerData.lastName || ""
          }`.trim();

          // Update all mappings for this broker
          brokerMappings.forEach((mapping, clientId) => {
            if (mapping.brokerId === doc.id) {
              mapping.brokerName = brokerName;
            }
          });
        });
      }
    }
    // console.log("brokerMappings after fetching names", brokerMappings);
    // Add broker info to users

    const dataResult = users.map((user) => {
      const brokerInfo = brokerMappings.get(user.id);
      return {
        ...user,
        brokerId: brokerInfo?.brokerId,
        brokerName: brokerInfo?.brokerName || "",
      } as UserWithId;
    });

    return dataResult;
  }

  return users;
};

export const updateUserStatus = async ({
  id,
  status,
}: {
  id: string;
  status: UserActiveStatus;
}) => {
  logInfo("Updating user status", { id, status });
  if (!id) throw new AppError("User ID is required.");

  if (!status) throw new AppError("Status is required.");

  const userData = await getUserById(id);
  if (!userData) throw new AppError("User not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_COLLECTION);
  const docRef = collectionRef.doc(id);
  await docRef.update({ activeStatus: status });
};

export const updateUserPremiumStatus = async ({
  id,
  isPremium,
}: {
  id: string;
  isPremium: boolean;
}) => {
  logInfo("Updating user premium status", { id, isPremium });
  if (!id) throw new AppError("User ID is required.");

  const userData = await getUserById(id);
  if (!userData) throw new AppError("User not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_COLLECTION);
  const docRef = collectionRef.doc(id);
  await docRef.update({ isPremiumClient: isPremium });
};

export const updateUserProfile = async ({
  userId,
  data,
}: {
  userId: string;
  data: Partial<User>;
}) => {
  logInfo("Updating user profile", { userId });
  if (!userId) throw new AppError("User ID is required.");

  const userData = await getUserById(userId);
  if (!userData) throw new AppError("User not found.");

  // Remove fields that shouldn't be updated via this endpoint
  const { password, email, role, ...updateData } = data;

  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_COLLECTION);
  const docRef = collectionRef.doc(userId);
  await docRef.update(updateData);
};

export const toggleLetterFeature = async (
  userId: string,
  enabled: boolean,
  featureKey:
    | "letterFeatureEnabled"
    | "latePaymentRemovalEnabled"
    | "unauthorizedInquiryRemovalEnabled"
    | "verifiedAccountDisputeEnabled"
    | "noResponseFollowUpEnabled"
    | "reinsertedAccountDisputeEnabled"
    | "accountErrorCorrectionEnabled"
    | "collectionAccountRemovalEnabled"
    | "fraudulentAccountRemovalEnabled" = "letterFeatureEnabled",
): Promise<void> => {
  logInfo(`Toggling letter feature for user`, { userId, enabled, featureKey });
  if (!userId) throw new AppError("User ID is required.");

  const userData = await getUserById(userId);
  if (!userData) throw new AppError("User not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_COLLECTION);
  const docRef = collectionRef.doc(userId);
  await docRef.update({ [featureKey]: enabled });
};

export const addUserNotes = async ({
  userId,
  notes,
}: {
  userId: string;
  notes: string[];
}) => {
  if (!userId) throw new AppError("User ID is required.");
  if (!notes) throw new AppError("Notes is required.");

  const userData = await getUserById(userId);
  if (!userData) throw new AppError("User not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(`${USER_COLLECTION}/${userId}/notes`);
  const docRef = collectionRef.doc(userId);
  await docRef.set({ notes });
};

export const getUserNotes = async (userId: string): Promise<string[]> => {
  if (!userId) throw new AppError("User ID is required.");
  const userData = await getUserById(userId);
  if (!userData) throw new AppError("User not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(`${USER_COLLECTION}/${userId}/notes`);
  const docRef = collectionRef.doc(userId);
  const querySnapshot = await docRef.get();
  return querySnapshot.exists
    ? (querySnapshot.data()?.notes as string[]) || []
    : [];
};

export const updateUserOnboardingStatus = async (
  id: string,
  status: boolean,
) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_COLLECTION);
  const docRef = collectionRef.doc(id);
  await docRef.update({ isOnboarded: status });
};

export const getUserDocuments = async ({
  userId,
}: {
  userId: string;
}): Promise<UserDoc[]> => {
  const prefix = `documents/${userId}/`;
  const bucket = storageAdmin();

  const [files] = await bucket.getFiles({ prefix });
  if (!files.length) return [];

  const expiresAt = Date.now() + 60 * 60 * 1000;

  const docs = await Promise.all(
    files
      .filter((f) => !f.name.endsWith("/"))
      .map(async (file) => {
        const [meta] = await file.getMetadata();
        const [signedUrl] = await file.getSignedUrl({
          action: "read",
          expires: expiresAt,
        });

        const [downloadUrl] = await file.getSignedUrl({
          action: "read",
          expires: expiresAt,
          responseDisposition: `attachment; filename="${file.name
            .split("/")
            .pop()!}"`,
        });

        return {
          name: file.name.split("/").pop()!,
          path: file.name,
          contentType: meta.contentType,
          size: Number(meta.size ?? 0),
          updated: meta.updated ?? "",
          signedUrl,
          downloadUrl,
          metadata: meta.metadata || {}, // Include custom metadata
        };
      }),
  );

  return docs.sort(
    (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime(),
  );
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  // 1) Try Authorization: Bearer <idToken>
  const h = await headers();
  const authHeader = h.get("Authorization");
  let idToken: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    idToken = authHeader.slice(7);
  }

  // 2) Try session cookies
  const cookieStore = await cookies();
  const sessionCookie =
    cookieStore.get("session")?.value ??
    cookieStore.get("__session")?.value ??
    cookieStore.get(FIREBASE_TOKEN_NAME)?.value ??
    null;
  // console.log("sessionCookie", sessionCookie);
  if (sessionCookie) {
    try {
      const decoded = await authenticationAdmin().verifySessionCookie(
        sessionCookie,
        true,
      );

      const userData = await getUserById(decoded.uid);

      return {
        uid: decoded.uid,
        email: decoded.email ?? null,
        name: decoded.name ?? null,
        picture: decoded.picture ?? null,
        role: userData?.role ?? "Client",
        admin: !!(decoded as any).admin,
        token: decoded,
      };
    } catch {
      // fall through to idToken flow
    }
  }

  if (!idToken) return null;

  try {
    const decoded = await authenticationAdmin().verifyIdToken(idToken, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
      role: (decoded as any).role ?? null,
      admin: !!(decoded as any).admin,
      token: decoded,
    };
  } catch {
    return null;
  }
}

const validatePasswordStrength = (password: string) => {
  const requirements = [
    { regex: /.{8,}/, message: "be at least 8 characters" },
    { regex: /[A-Z]/, message: "contain an uppercase letter" },
    { regex: /[a-z]/, message: "contain a lowercase letter" },
    { regex: /[0-9]/, message: "contain a number" },
    { regex: /[^A-Za-z0-9]/, message: "contain a special character" },
  ];

  const missing = requirements
    .filter((req) => !req.regex.test(password))
    .map((req) => req.message);

  if (missing.length > 0) {
    // This is the standard way to throw errors back to the client
    // from a Callable Function.
    throw new AppError(`Password is too weak. It must: ${missing.join(", ")}.`);
  }
};

export const changePassword = async (data: ChangePassword) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new AppError("User not authenticated.");
  }

  const { newPassword, confirmPassword, currentPassword } = data;
  const uid = user.uid;

  // 2. Input Validation: Ensure required data is present.
  if (!newPassword || !confirmPassword) {
    throw new AppError(
      "Missing required fields: newPassword and confirmPassword.",
    );
  }

  if (typeof newPassword !== "string" || typeof confirmPassword !== "string") {
    throw new AppError("Passwords must be strings.");
  }

  // 3. Business Logic: Perform password checks.
  if (newPassword !== confirmPassword) {
    throw new AppError("Passwords do not match.");
  }

  // 4. Password Strength Validation
  validatePasswordStrength(newPassword);

  // 5. Core Action: Update the user's password using the Admin SDK.
  try {
    await authenticationAdmin().updateUser(uid, {
      password: newPassword,
    });

    console.info(`Successfully updated password for user: ${uid}`);
    return { success: true, message: "Password updated successfully." };
  } catch (error) {
    console.error(`Error updating password for user ${uid}:`, error);

    // Don't leak detailed implementation errors to the client.
    throw new AppError(
      "An unexpected error occurred while changing the password. Please try again later.",
    );
  }
};

const NOTE_SUBCOLLECTION = "internalNotes";
const NOTE_DOC_ID = "main";

export const getUserNote = async (userId: string): Promise<NoteSchema> => {
  if (!userId) {
    throw new AppError("User ID is required.");
  }

  const db = firestoreAdmin();
  const docRef = db
    .collection(USER_COLLECTION)
    .doc(userId)
    .collection(NOTE_SUBCOLLECTION)
    .doc(NOTE_DOC_ID);

  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    // Return a default empty state
    return { description: "", comments: [] };
  }

  const data = docSnap.data();

  // Convert Firestore Timestamps back to JS Date objects for the client
  const commentsWithDates = (data?.comments || []).map((comment: any) => ({
    ...comment,
    createdAt: comment.createdAt.toDate(),
  }));

  return {
    description: data?.description || "",
    comments: commentsWithDates,
  };
};

/**
 * Creates or overwrites the entire note document for a given user.
 */
export const updateUserNote = async ({
  userId,
  note,
}: {
  userId: string;
  note: NoteSchema;
}) => {
  if (!userId) {
    throw new AppError("User ID is required.");
  }

  // Validate incoming data against the shared schema
  const validationResult = noteSchema.safeParse(note);
  if (!validationResult.success) {
    throw new AppError(validationResult.error.message);
  }
  const validatedNote = validationResult.data;

  const db = firestoreAdmin();
  const docRef = db
    .collection(USER_COLLECTION)
    .doc(userId)
    .collection(NOTE_SUBCOLLECTION)
    .doc(NOTE_DOC_ID);

  // The Admin SDK automatically converts JS Date objects to Timestamps
  await docRef.set(validatedNote);

  console.log(`Note updated for user: ${userId}`);
};

export const getCongratsMessages = async ({ userId }: { userId: string }) => {
  logInfo("user::getCongrats", { userId });

  const data = await getUserById(userId);
  if (!data) throw new AppError("Funding application not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collectionGroup(USER_FUNDING_APPLICATION_CONGRATS);

  const snapshot = await collectionRef
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();
  if (snapshot.empty) {
    console.log("No matching documents.");
    return null;
  }
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...normalizeAllDates(doc.data()),
  }));
};

export const markCongratsAsRead = async ({
  userId,
  docId,
}: {
  userId: string;
  docId: string;
}) => {
  logInfo("Marking congrats message as read", { userId, docId });

  if (!userId) throw new AppError("User ID is required.");
  if (!docId) throw new AppError("Document ID is required.");

  const db = firestoreAdmin();
  const congratsCollection = db.collectionGroup(
    USER_FUNDING_APPLICATION_CONGRATS,
  );

  const snapshot = await congratsCollection
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();
  if (snapshot.empty) {
    console.log("No matching documents.");
    return null;
  }

  logInfo("Found congrats messages", {
    userId,
    totalMessages: snapshot.size,
  });

  const docToUpdate = snapshot.docs.find((doc) => doc.id === docId);

  if (!docToUpdate) {
    throw new AppError("Congrats message not found.");
  }

  await docToUpdate.ref.update({ isRead: true });

  logInfo("Successfully marked congrats message as read", { userId, docId });
};

export const deleteUser = async (userId: string) => {
  logInfo(`Deleting user with id: ${userId}`);
  const db = firestoreAdmin();
  const bucket = storageAdmin();
  try {
    // Delete funding applications associated with the user
    logInfo(`Deleting funding applications for user: ${userId}`);
    const fundingApplicationsQuery = db
      .collection(USER_FUNDING_APPLICATION)
      .where("userId", "==", userId);
    const fundingApplicationsSnapshot = await fundingApplicationsQuery.get();

    if (!fundingApplicationsSnapshot.empty) {
      const batch = db.batch();
      fundingApplicationsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      logInfo(
        `Deleted ${fundingApplicationsSnapshot.size} funding applications.`,
      );
    } else {
      logInfo(`No funding applications found for user: ${userId}`);
    }
    // Delete user's files from storage
    const prefix = `documents/${userId}/`;
    await bucket.deleteFiles({ prefix });
    logInfo(`Deleted files from storage for user: ${userId}`);

    // Delete broker-client mappings
    const brokerClientMappingsQuery = db
      .collection(BROKER_CLIENT_MAPPING)
      .where("clientId", "==", userId);
    const brokerClientMappingsSnapshot = await brokerClientMappingsQuery.get();

    if (!brokerClientMappingsSnapshot.empty) {
      const batch = db.batch();
      brokerClientMappingsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      logInfo(
        `Deleted ${brokerClientMappingsSnapshot.size} broker-client mappings for user: ${userId}`,
      );
    } else {
      logInfo(`No broker-client mappings found for user: ${userId}`);
    }

    const userDocRef = db.collection(USER_COLLECTION).doc(userId);
    await userDocRef.delete();
    logInfo("User deleted from Firestore");

    try {
      await authenticationAdmin().deleteUser(userId);
      logInfo("User deleted from Firebase Auth");
    } catch (authError: any) {
      logError(new Error("Error deleting user from Firebase Auth"), authError);
    }
    return {
      message: "User and all associated data deleted successfully.",
    };
  } catch (error: any) {
    logError(new Error(`Error deleting user with id: ${userId}`), error);
    throw new AppError("Failed to delete user.");
  }
};

export const updateClientBrokerMapping = async ({
  clientId,
  brokerId,
  brokerName,
  clientName,
  clientEmail,
}: {
  clientId: string;
  brokerId: string | null;
  brokerName: string;
  clientName?: string;
  clientEmail?: string;
}) => {
  logInfo("Updating client broker mapping", { clientId, brokerId, brokerName });

  if (!clientId) throw new AppError("Client ID is required");

  const db = firestoreAdmin();

  // First, deactivate any existing active mappings for this client
  const existingMappings = await db
    .collection(BROKER_CLIENT_MAPPING)
    .where("clientId", "==", clientId)
    .where("status", "==", "Active")
    .get();

  const batch = db.batch();

  // Deactivate all existing mappings
  existingMappings.docs.forEach((doc) => {
    batch.update(doc.ref, { status: "Inactive", updatedAt: new Date() });
  });

  // If brokerId is provided, create new mapping
  if (brokerId) {
    const newMappingRef = db.collection(BROKER_CLIENT_MAPPING).doc();
    batch.set(newMappingRef, {
      clientId,
      brokerId,
      brokerName,
      status: "Active",
      createdAt: new Date(),
      updatedAt: new Date(),
      clientName: clientName || "",
      clientEmail: clientEmail || "",
    });
    logInfo("Creating new broker-client mapping", { clientId, brokerId });
  } else {
    logInfo("Removing broker assignment from client", { clientId });
  }

  await batch.commit();
  logInfo("Broker mapping updated successfully", { clientId, brokerId });
};

export const generateClientInvitation = async ({
  email,
  brokerId,
  brokerName,
}: {
  email: string;
  brokerId: string;
  brokerName: string;
}) => {
  logInfo("Generating client invitation", { email, brokerId, brokerName });

  // Check if user already exists
  const existingUser = await getUserRecordByEmail(email);
  if (existingUser) {
    throw new AppError("A user with this email already exists.");
  }

  const db = firestoreAdmin();
  const invitationsRef = db.collection(CLIENT_INVITATION);

  // Check for existing active invitation
  const existingInvitations = await invitationsRef
    .where("email", "==", email)
    .where("status", "==", "Pending")
    .get();

  if (!existingInvitations.empty) {
    throw new AppError("An invitation has already been sent to this email.");
  }

  // Generate invitation token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  // Create invitation record
  const invitationData = {
    email,
    brokerId,
    brokerName,
    token,
    status: "Pending",
    createdAt: new Date(),
    expiresAt,
  };

  await invitationsRef.add(invitationData);

  // logInfo("Client invitation created successfully", { email, token });

  return {
    token,
    email,
    brokerName,
  };
};

export const verifyClientInvitationToken = async (token: string) => {
  const db = firestoreAdmin();
  const snapshot = await db
    .collection(CLIENT_INVITATION)
    .where("token", "==", token)
    .where("status", "==", "Pending")
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new AppError("Invalid or expired invitation token.");
  }

  const doc = snapshot.docs[0];
  const data = normalizeAllDates(doc.data());

  if (new Date() > new Date(data.expiresAt)) {
    throw new AppError("Invitation token has expired.");
  }

  return {
    id: doc.id,
    ...data,
  };
};

export const consumeClientInvitationToken = async (tokenId: string) => {
  const db = firestoreAdmin();
  await db.collection(CLIENT_INVITATION).doc(tokenId).update({
    status: "Accepted",
    acceptedAt: new Date(),
  });
};
