"use server";
import {
  BROKER_CLIENT_MAPPING,
  USER_COLLECTION,
} from "@/constant/collection-name";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";
import AppError from "@/error/AppError";
import { normalizeAllDates, normalizeDate } from "@/lib/date-parser";
import {
  authenticationAdmin,
  firestoreAdmin,
  storageAdmin,
} from "@/lib/fireabase-admin";
import { logInfo } from "@/lib/logger";
import { sendMail } from "@/lib/nodemailer";
import { ChangePassword, CurrentUser, Role } from "@/schema";
import { noteSchema, NoteSchema } from "@/schema/notes";

import { User, UserActiveStatus, UserWithId } from "@/schema/registration";
import { format } from "date-fns";
import { cookies, headers } from "next/headers";
import { FieldPath } from "firebase-admin/firestore";
import { ApplyFunding } from "@/schema/apply-funding";
import { applyFunding } from "./apply-funding";

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

  return { id: userDoc.id, ...normalizeAllDates(user) } as User;
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
  value,
  isBrokerRegistration,
  brokerName,
  isAdminRegistration,
}: {
  value: User;
  isBrokerRegistration?: boolean;
  brokerName?: string;
  isAdminRegistration?: boolean;
}) => {
  const userRecord = await getUserRecordByEmail(value.email);

  if (userRecord) {
    throw new AppError("Cannot register duplicate email.");
  }

  const db = firestoreAdmin();

  const collectionRef = db.collection(USER_COLLECTION);

  const userData = { ...value };
  delete (userData as { password?: string }).password;

  const docRef = await collectionRef.add(userData);
  const data = (await docRef.get()).data();

  if (userData.employmentPayPerMonth && userData.employmentPayPerMonth > 0) {
    const fundApplication: ApplyFunding = {
      userId: docRef.id,
      employmentPayPerMonth: userData.employmentPayPerMonth,
      payPerMonth: userData.payPerMonth,
      // rentOrMortgage: userData.rentOrMortgage,
      appliedDate: new Date(),
      status: "New",
      addressStreet: userData.addressStreet,
      addressCity: userData.addressCity,
      addressState: userData.addressState,
      addressPostal: userData.addressPostal,
      houseNumber: userData.houseNumber,
      interestedProduct: "Knowledge Community",
      fundingType: "Community",
    };

    await applyFunding({ value: fundApplication });
  }

  const authAdmin = authenticationAdmin();

  await authAdmin.createUser({
    uid: docRef.id,
    email: value.email,
    password: value.password,
    displayName: `${value.firstName} ${value.lastName}`,
    disabled: false,
    emailVerified: false,
  });

  const link = await authAdmin.generateEmailVerificationLink(value.email);

  let requestBody = getVerifyEmailBody(link);
  if (isBrokerRegistration && brokerName) {
    requestBody = getBrokerInvitationToClientBody({
      clientName: `${value.firstName} ${value.lastName}`,
      email: value.email,
      temporaryPassword: value.password,
      loginUrl: process.env.NEXT_PUBLIC_APP_URL!,
      brokerName: brokerName,
      verificationLink: link,
    });
  } else if (isAdminRegistration) {
    requestBody = getAdminInvitationToClientBody({
      clientName: `${value.firstName} ${value.lastName}`,
      email: value.email,
      temporaryPassword: value.password,
      loginUrl: process.env.NEXT_PUBLIC_APP_URL!,
      verificationLink: link,
    });
  }
  await sendMail({
    emailTo: value.email,
    subject: "Verify Email",
    bodyHTML: requestBody,
  });

  const registrationBody = getNewRegistrationBody(value);

  await sendMail({
    emailTo: process.env.NEW_REGISTRATION_EMAIL_NOTIF!,
    subject: `New Registration - ${value.firstName} ${value.lastName}`,
    bodyHTML: registrationBody,
  });

  return {
    id: docRef.id,
    ...normalizeAllDates(data),
  };
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
        <tr>
            <th style="text-align: left; padding: 12px; border-bottom: 1px solid #eeeeee; width: 150px; color: #555555; background-color: #f9f9f9;">
                Birthdate
            </th>
            <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eeeeee; color: #333333;">
                ${format(value.birthdate, "MMM d, yyyy")}
            </td>
        </tr>
        <tr>
            <th style="text-align: left; padding: 12px; border-bottom: 1px solid #eeeeee; width: 150px; color: #555555; background-color: #f9f9f9;">
                Gender
            </th>
            <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eeeeee; color: #333333;">
                ${value.gender}
            </td>
        </tr>
    </table>
</div>
  `;
};

export const getUsers = async (role?: Role): Promise<UserWithId[]> => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_COLLECTION);

  let query: FirebaseFirestore.Query = collectionRef;
  if (role) {
    query = collectionRef.where("role", "==", role);
  }

  const querySnapshot = await query.get();

  if (querySnapshot.empty) {
    console.log("No matching documents.");
    return [];
  }

  const users: UserWithId[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    users.push({ id: doc.id, ...normalizeAllDates(data) } as UserWithId);
  });

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
    | "fraudulentAccountRemovalEnabled" = "letterFeatureEnabled"
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
  status: boolean
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
        };
      })
  );

  return docs.sort(
    (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
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
        true
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
      "Missing required fields: newPassword and confirmPassword."
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
      "An unexpected error occurred while changing the password. Please try again later."
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
