"use server";

import { firestoreAdmin } from "@/lib/fireabase-admin";
import { USER_COLLECTION } from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { logInfo } from "@/lib/logger";
import { fundAnalysis, generateCRSReport } from "@/service/crs";
import { getApplyFunding } from "./apply-funding";

export type MembershipTier = "tier_starter" | "tier_pro" | "tier_executive";

export interface UserMembership {
  id: string;
  tier: MembershipTier;
  amount: number;
  status: string;
  checkoutId?: string | null;
  createdAt: string | null;
  canceledAt?: string | null;
}

export const activateUserMembership = async ({
  userId,
  tier,
  amount,
  checkoutId,
  planId,
  receiptId,
}: {
  userId: string;
  tier: string;
  amount: number;
  checkoutId?: string;
  planId?: string;
  receiptId?: string;
}) => {
  logInfo("Activating user membership", { userId, tier, amount });
  if (!userId) throw new AppError("User ID is required.");

  const db = firestoreAdmin();

  // Update user to premium
  await db.collection(USER_COLLECTION).doc(userId).update({
    isPremiumClient: true,
  });

  // Create membership record
  await db.collection(`${USER_COLLECTION}/${userId}/membership`).add({
    tier,
    amount,
    planId: planId || null,
    receiptId: receiptId || null,
    checkoutId: checkoutId || null,
    createdAt: new Date(),
    status: "active",
  });

  let referenceNumber = "";
  const appliedFundings = await getApplyFunding(userId);
  if (appliedFundings && appliedFundings.length > 0) {
    referenceNumber = appliedFundings[0].referenceNumber!;
  }

  if (!referenceNumber) {
    throw new AppError("Missing reference number");
  }

  // Automatically trigger CRS report generation and then Funding Analysis upon activation
  try {
    logInfo("Triggering CRS report on membership activation", {
      userId,
      referenceNumber,
    });
    await generateCRSReport({
      userId,
      referenceNumber,
      bureaus: { equifax: true, experian: true, transunion: true },
      bypassPremiumCheck: true,
    });

    // We trigger the funding analysis here immediately after the CRS report succeeds,
    // because the analysis usually requires the newly pulled credit report data.
    logInfo("Triggering Funding Analysis on membership activation", {
      userId,
      referenceNumber,
    });
    await fundAnalysis({
      referenceNumber,
      userId,
    });
  } catch (error) {
    console.error(
      "Failed to generate CRS report or Funding Analysis on membership activation:",
      error,
    );
    // We don't throw the error here so that the membership activation itself still succeeds
  }

  return { success: true };
};

export const getUserMembership = async (
  userId: string,
): Promise<UserMembership | null> => {
  logInfo("Fetching user membership", { userId });
  if (!userId) throw new AppError("User ID is required.");

  const db = firestoreAdmin();
  const snapshot = await db
    .collection(`${USER_COLLECTION}/${userId}/membership`)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();

  // Convert Firestore Timestamp to string for the client component
  return {
    id: doc.id,
    tier: data.tier || "unknown",
    amount: data.amount || 0,
    status: data.status || "active",
    checkoutId: data.checkoutId || null,
    createdAt: data.createdAt?.toDate().toISOString() || null,
    canceledAt: data.canceledAt?.toDate().toISOString() || null,
  };
};

export const cancelUserMembership = async (
  userId: string,
  membershipId: string,
) => {
  if (!userId) throw new AppError("User ID is required");
  if (!membershipId) throw new AppError("Membership ID is required");

  const db = firestoreAdmin();

  // Update the membership status to canceled
  await db
    .collection(`${USER_COLLECTION}/${userId}/membership`)
    .doc(membershipId)
    .update({
      status: "canceled",
      canceledAt: new Date(),
    });

  // Revert user premium status if needed, but typically they keep access until end of billing cycle.
  // For now, let's keep it simple and just update the document status.

  return { success: true };
};
