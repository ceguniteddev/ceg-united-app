"use server";
import { USER_COLLECTION } from "@/constant/collection-name";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";
import AppError from "@/error/AppError";
import { normalizeAllDates, normalizeDate } from "@/lib/date-parser";
import { authenticationAdmin, firestoreAdmin, storageAdmin } from "@/lib/fireabase-admin";
import { logInfo } from "@/lib/logger";
import { sendMail } from "@/lib/nodemailer";
import { ChangePassword, CurrentUser, Role } from "@/schema";

import {
  User,
  UserActiveStatus,
  UserActiveStatusEnum,
  UserPlaid,
  UserWithId,
} from "@/schema/registration";
import { generateCRSReport } from "@/service/crs";
import { cookies, headers } from "next/headers";

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

export const getUserById = async (id: string): Promise<User | null> => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(USER_COLLECTION);
  const docRef = collectionRef.doc(id);
  const docSnapshot = await docRef.get();

  if (!docSnapshot.exists) return null;

  const userDoc = docSnapshot;
  const user = userDoc.data();

  return { id: userDoc.id, ...normalizeAllDates(user) } as User;
};

export const registerUser = async (value: User) => {
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

  const requestBody = getVerifyEmailBody(link);

  await sendMail({ emailTo: value.email, subject: "Verify Email", bodyHTML: requestBody });

  await generateCRSReport(docRef.id);

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

export const addUserNotes = async ({ userId, notes }: { userId: string; notes: string[] }) => {
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
  return querySnapshot.exists ? (querySnapshot.data()?.notes as string[]) || [] : [];
};

export const updateUserOnboardingStatus = async (id: string, status: boolean) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_COLLECTION);
  const docRef = collectionRef.doc(id);
  await docRef.update({ isOnboarded: status });
};

export const getUserDocuments = async ({ userId }: { userId: string }): Promise<UserDoc[]> => {
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

        return {
          name: file.name.split("/").pop()!,
          path: file.name,
          contentType: meta.contentType,
          size: Number(meta.size ?? 0),
          updated: meta.updated ?? "",
          signedUrl,
        };
      })
  );

  return docs;
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
      const decoded = await authenticationAdmin().verifySessionCookie(sessionCookie, true);
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

  const missing = requirements.filter((req) => !req.regex.test(password)).map((req) => req.message);

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
    throw new AppError("Missing required fields: newPassword and confirmPassword.");
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
