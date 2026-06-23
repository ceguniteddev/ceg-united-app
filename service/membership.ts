"use server";

import { firestoreAdmin } from "@/lib/fireabase-admin";
import { USER_COLLECTION } from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { logInfo } from "@/lib/logger";
import { fundAnalysis, generateCRSReport } from "@/service/crs";
import { getApplyFunding } from "./apply-funding";
import { Query } from "firebase-admin/firestore";
import { MembershipTier, UserMembership } from "@/schema/users";

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

export const adminSetUserMembership = async ({
  userId,
  tier,
  status,
  updatedBy,
}: {
  userId: string;
  tier: MembershipTier;
  status: string;
  updatedBy: string;
}) => {
  logInfo("Admin setting user membership", { userId, tier, status, updatedBy });
  if (!userId) throw new AppError("User ID is required.");

  const db = firestoreAdmin();
  const membershipRef = db.collection(
    `${USER_COLLECTION}/${userId}/membership`,
  );

  // get latest membership
  const snapshot = await membershipRef
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    await doc.ref.update({
      tier,
      status,
      updatedBy,
      updatedAt: new Date(),
    });
  } else {
    await membershipRef.add({
      tier,
      amount: 0,
      status,
      updatedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return { success: true };
};

export const getAllMemberships = async ({
  isActive,
}: {
  isActive?: boolean;
}): Promise<UserMembership[]> => {
  logInfo("Fetching all user memberships");
  const db = firestoreAdmin();

  // We use a collection group query to fetch all membership documents
  // Since we only want the active ones, we could filter by status or sort
  // But a simple collection group might require an index, so let's just fetch them and filter
  let referenceDoc: Query = db.collectionGroup("membership");

  if (isActive === true) {
    referenceDoc = referenceDoc.where("status", "==", "active");
  }

  const snapshot = await referenceDoc.get();

  const memberships: UserMembership[] = [];
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    // determine userId from path: USER_COLLECTION/{userId}/membership/{docId}
    const pathSegments = doc.ref.path.split("/");
    const userId = pathSegments[pathSegments.length - 3];

    memberships.push({
      id: doc.id,
      userId,
      tier: data.tier || "unknown",
      amount: data.amount || 0,
      status: data.status || "active",
      checkoutId: data.checkoutId || null,
      createdAt: data.createdAt?.toDate().toISOString() || null,
      canceledAt: data.canceledAt?.toDate().toISOString() || null,
      updatedBy: data.updatedBy || null,
      updatedAt: data.updatedAt?.toDate().toISOString() || null,
    } as UserMembership & { userId: string });
  });

  // Group by userId and get the latest one for each user
  const latestMemberships = new Map<
    string,
    UserMembership & { userId: string }
  >();

  (memberships as (UserMembership & { userId: string })[]).forEach((m) => {
    const existing = latestMemberships.get(m.userId);
    if (!existing) {
      latestMemberships.set(m.userId, m);
    } else {
      // Compare dates (fallback to string comparison if both exist)
      if (
        m.createdAt &&
        existing.createdAt &&
        m.createdAt > existing.createdAt
      ) {
        latestMemberships.set(m.userId, m);
      }
    }
  });

  return Array.from(latestMemberships.values());
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
    updatedBy: data.updatedBy || null,
    updatedAt: data.updatedAt?.toDate().toISOString() || null,
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
