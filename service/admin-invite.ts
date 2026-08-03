"use server";

import { firestoreAdmin } from "@/lib/fireabase-admin";
import { ADMIN_INVITATION, USER_COLLECTION } from "@/constant/collection-name";
import { AdminInvitation } from "@/schema/admin-invite";
import crypto from "crypto";
import { normalizeAllDates } from "@/lib/date-parser";
import AppError from "@/error/AppError";
import { getUserRecordByEmail } from "@/service/user";

/**
 * Creates an admin invitation and stores it in Firestore.
 */
export const createAdminInvitation = async (
  email: string,
  invitedBy: string,
  invitedByName?: string,
): Promise<{ token: string; invitation: AdminInvitation }> => {
  const db = firestoreAdmin();
  const trimmedEmail = email.trim().toLowerCase();

  // Check if an active invitation already exists for this email
  const activeInvitations = await db
    .collection(ADMIN_INVITATION)
    .where("email", "==", trimmedEmail)
    .where("status", "==", "Pending")
    .get();

  if (!activeInvitations.empty) {
    const now = new Date();
    for (const doc of activeInvitations.docs) {
      const data = normalizeAllDates(doc.data()) as AdminInvitation;
      if (data.expiresAt > now) {
        throw new AppError("Active invitation already exists for this email");
      } else {
        await doc.ref.update({ status: "Expired" });
      }
    }
  }

  // Check if user already exists in Firestore
  const existingUserDocs = await db
    .collection(USER_COLLECTION)
    .where("email", "==", trimmedEmail)
    .get();

  if (!existingUserDocs.empty) {
    throw new AppError("User with this email already exists");
  }

  // Check if user already exists in Auth
  const existingAuthUser = await getUserRecordByEmail(trimmedEmail);
  if (existingAuthUser) {
    throw new AppError("User with this email already exists");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const invitation: AdminInvitation = {
    email: trimmedEmail,
    invitedBy,
    invitedByName,
    token,
    status: "Pending",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
  };

  await db.collection(ADMIN_INVITATION).add(invitation);

  return { token, invitation };
};

/**
 * Finds a pending admin invitation by token.
 * If expired, updates its status to "Expired" and returns null.
 */
export const getAdminInvitationByToken = async (
  token: string,
): Promise<(AdminInvitation & { id: string }) | null> => {
  const db = firestoreAdmin();
  const snapshot = await db
    .collection(ADMIN_INVITATION)
    .where("token", "==", token)
    .where("status", "==", "Pending")
    .get();

  if (snapshot.empty) {
    console.log("Invalid token or expired token");
    return null;
  }

  const doc = snapshot.docs[0];
  const data = normalizeAllDates(doc.data()) as AdminInvitation;

  // Check if expired
  if (data.expiresAt < new Date()) {
    await doc.ref.update({ status: "Expired" });
    return null;
  }

  return { ...data, id: doc.id };
};

/**
 * Marks an admin invitation as Accepted.
 */
export const acceptAdminInvitation = async (token: string): Promise<void> => {
  const db = firestoreAdmin();
  const snapshot = await db
    .collection(ADMIN_INVITATION)
    .where("token", "==", token)
    .get();

  if (snapshot.empty) {
    throw new AppError("Invalid invitation token");
  }

  const doc = snapshot.docs[0];
  await doc.ref.update({
    status: "Accepted",
    acceptedAt: new Date(),
  });
};
