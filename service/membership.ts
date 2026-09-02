"use server";

import { firestoreAdmin } from "@/lib/fireabase-admin";
import { USER_COLLECTION } from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { logInfo } from "@/lib/logger";
import { fundAnalysis, generateCRSReport } from "@/service/crs";
import { getApplyFunding } from "./apply-funding";
import { Query } from "firebase-admin/firestore";
import {
  MembershipEntitlementStatus,
  MembershipProviderStatus,
  MembershipTier,
  UserMembership,
} from "@/schema/users";
import membershipCache from "@/lib/membership-cache";
import { hasPaidMembershipAccess } from "@/lib/membership-entitlement";

const RETRY_WINDOW_DAYS = Number(process.env.DODO_RETRY_WINDOW_DAYS || 13);

const dateValue = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isoValue = (value: any) => dateValue(value)?.toISOString() || null;

export const synchronizeDodoMembership = async ({
  userId,
  tier,
  providerStatus,
  subscriptionId,
  customerId,
  productId,
  amount,
  previousBillingDate,
  nextBillingDate,
  expiresAt,
  cancelAtNextBillingDate = false,
  eventCreatedAt,
  lastWebhookEventId,
}: {
  userId: string;
  tier: MembershipTier;
  providerStatus: MembershipProviderStatus;
  subscriptionId: string;
  customerId?: string | null;
  productId?: string | null;
  amount: number;
  previousBillingDate?: string | null;
  nextBillingDate?: string | null;
  expiresAt?: string | null;
  cancelAtNextBillingDate?: boolean;
  eventCreatedAt?: string | null;
  lastWebhookEventId?: string;
}) => {
  if (!userId) throw new AppError("User ID is required.");

  const db = firestoreAdmin();
  const currentRef = db.doc(`${USER_COLLECTION}/${userId}/membership/current`);
  const now = new Date();
  let newlyPaid = false;

  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(currentRef);
    const existing = current.data() || {};
    const incomingEventAt = dateValue(eventCreatedAt) || now;
    const previousEventAt = dateValue(existing.providerEventAt);

    if (
      previousEventAt &&
      incomingEventAt.getTime() < previousEventAt.getTime()
    ) {
      return;
    }

    let entitlementStatus: MembershipEntitlementStatus = "free";
    if (providerStatus === "active") entitlementStatus = "paid";
    if (providerStatus === "on_hold" || providerStatus === "paused") {
      entitlementStatus = "grace";
    }
    if (providerStatus === "cancelled" && cancelAtNextBillingDate) {
      const accessEnd = dateValue(expiresAt || nextBillingDate);
      entitlementStatus = accessEnd && accessEnd > now ? "paid" : "free";
    }
    newlyPaid =
      entitlementStatus === "paid" &&
      existing.entitlementStatus !== "paid" &&
      existing.entitlementStatus !== "grace" &&
      existing.status !== "active";

    const enteringRecovery =
      entitlementStatus === "grace" && existing.entitlementStatus !== "grace";
    const failureStartedAt = enteringRecovery
      ? now
      : dateValue(existing.paymentFailureStartedAt);
    const retryAccessUntil = enteringRecovery
      ? new Date(now.getTime() + RETRY_WINDOW_DAYS * 24 * 60 * 60 * 1000)
      : dateValue(existing.retryAccessUntil);

    const recoveryFields =
      entitlementStatus === "grace"
        ? {
            paymentFailureStartedAt: failureStartedAt || now,
            retryAccessUntil:
              retryAccessUntil ||
              new Date(now.getTime() + RETRY_WINDOW_DAYS * 24 * 60 * 60 * 1000),
            nextReminderAt: enteringRecovery
              ? now
              : dateValue(existing.nextReminderAt) || now,
            reminderCount: enteringRecovery ? 0 : existing.reminderCount || 0,
            finalNoticeSentAt: null,
          }
        : {
            paymentFailureStartedAt: null,
            retryAccessUntil: null,
            nextReminderAt: null,
            lastReminderAt: null,
            reminderCount: 0,
          };

    transaction.set(
      currentRef,
      {
        provider: "dodo",
        providerStatus,
        entitlementStatus,
        status: entitlementStatus === "free" ? "inactive" : "active",
        tier,
        ...(tier === "platform_access"
          ? {
              accessModel: "platform_course",
              billingPlan: "platform_access",
            }
          : {}),
        amount,
        subscriptionId,
        customerId: customerId || existing.customerId || null,
        productId: productId || existing.productId || null,
        planId: productId || existing.planId || null,
        currentPeriodStart: dateValue(previousBillingDate),
        currentPeriodEnd: dateValue(expiresAt || nextBillingDate),
        nextBillingDate: dateValue(nextBillingDate),
        cancelAtNextBillingDate,
        providerEventAt: incomingEventAt,
        lastWebhookEventId: lastWebhookEventId || null,
        legacyBillingModel: false,
        createdAt: dateValue(existing.createdAt) || now,
        updatedAt: now,
        ...recoveryFields,
      },
      { merge: true },
    );
  });

  membershipCache.invalidate(userId);
  if (newlyPaid) {
    await triggerActivationCRSWorkflow({ userId, source: "membership" });
  }
  return { success: true };
};

export const triggerActivationCRSWorkflow = async ({
  userId,
  source = "membership",
}: {
  userId: string;
  source?: "membership" | "addon";
}) => {
  try {
    logInfo(`Triggering CRS report on ${source} activation`, {
      userId,
      source,
    });
    await generateCRSReport({
      userId,
      bureaus: { equifax: true, experian: true, transunion: true },
      bypassPremiumCheck: true,
    });

    const appliedFundings = await getApplyFunding(userId);
    const fundingApplication = appliedFundings?.find(
      (application) =>
        application.applicationSource !== "financial_education_access" &&
        Boolean(application.referenceNumber),
    );
    const referenceNumber = fundingApplication?.referenceNumber;

    if (referenceNumber) {
      // We trigger the funding analysis here immediately after the CRS report succeeds,
      // because the analysis usually requires the newly pulled credit report data.
      logInfo(`Triggering Funding Analysis on ${source} activation`, {
        userId,
        referenceNumber,
        source,
      });

      await fundAnalysis({
        referenceNumber,
        userId,
      });
    }
  } catch (error) {
    console.error(
      `Failed to generate CRS report or Funding Analysis on ${source} activation:`,
      error,
    );
  }
};

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
  const membershipRef = db.collection(
    `${USER_COLLECTION}/${userId}/membership`,
  );
  const latestMembershipQuery = membershipRef
    .orderBy("createdAt", "desc")
    .limit(1);
  const currentRef = membershipRef.doc("current");
  let alreadyActive = false;

  await db.runTransaction(async (transaction) => {
    const [currentDoc, latestMembership] = await Promise.all([
      transaction.get(currentRef),
      transaction.get(latestMembershipQuery),
    ]);
    const existingDoc = currentDoc.exists
      ? currentDoc
      : latestMembership.docs[0];
    const existingData = existingDoc?.data();
    alreadyActive =
      existingData?.status === "active" && existingData?.tier === tier;

    if (alreadyActive && existingDoc) {
      transaction.set(
        existingDoc.ref,
        {
          amount,
          ...(planId ? { planId } : {}),
          ...(receiptId ? { receiptId } : {}),
          ...(checkoutId ? { checkoutId } : {}),
          updatedAt: new Date(),
        },
        { merge: true },
      );
      return;
    }

    transaction.set(currentRef, {
      tier,
      amount,
      planId: planId || null,
      receiptId: receiptId || null,
      checkoutId: checkoutId || null,
      createdAt: new Date(),
      status: "active",
    });
  });

  membershipCache.invalidate(userId);
  if (alreadyActive) return { success: true, alreadyActive: true };

  // Automatically trigger CRS report generation and then Funding Analysis upon activation
  await triggerActivationCRSWorkflow({ userId, source: "membership" });

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
  membershipCache.invalidate(userId);
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
  options?: { bypassCache?: boolean },
): Promise<UserMembership | null> => {
  if (!userId) throw new AppError("User ID is required.");

  logInfo("Resolving user membership", {
    userId,
    bypassCache: options?.bypassCache === true,
  });
  logInfo("Fetching user membership", { userId, options });
  const db = firestoreAdmin();
  const snapshot = await db
    .collection(`${USER_COLLECTION}/${userId}/membership`)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    logInfo("No Firestore membership found", { userId });
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  // Convert Firestore Timestamp to string for the client component
  const rawResult: UserMembership = {
    id: doc.id,
    tier: data.tier || "unknown",
    amount: data.amount || 0,
    status: data.status || "active",
    checkoutId: data.checkoutId || null,
    createdAt: isoValue(data.createdAt),
    canceledAt: data.canceledAt?.toDate().toISOString() || null,
    updatedBy: data.updatedBy || null,
    updatedAt: isoValue(data.updatedAt),
    provider: data.provider || null,
    providerStatus: data.providerStatus || null,
    entitlementStatus: data.entitlementStatus || null,
    subscriptionId: data.subscriptionId || null,
    customerId: data.customerId || null,
    productId: data.productId || data.planId || null,
    currentPeriodStart: isoValue(data.currentPeriodStart),
    currentPeriodEnd: isoValue(data.currentPeriodEnd),
    nextBillingDate: isoValue(data.nextBillingDate),
    cancelAtNextBillingDate: Boolean(data.cancelAtNextBillingDate),
    paymentFailureStartedAt: isoValue(data.paymentFailureStartedAt),
    retryAccessUntil: isoValue(data.retryAccessUntil),
    nextReminderAt: isoValue(data.nextReminderAt),
    lastReminderAt: isoValue(data.lastReminderAt),
    reminderCount: data.reminderCount || 0,
    finalNoticeSentAt: isoValue(data.finalNoticeSentAt),
    legacyBillingModel: Boolean(data.legacyBillingModel),
  };
  const access = hasPaidMembershipAccess(rawResult);
  const result: UserMembership = {
    ...rawResult,
    status: access
      ? "active"
      : rawResult.entitlementStatus
        ? "inactive"
        : rawResult.status,
    entitlementStatus:
      rawResult.entitlementStatus === "grace" && !access
        ? "free"
        : rawResult.entitlementStatus,
    effectivePlan: access ? rawResult.tier : "free",
  };

  logInfo("Resolved Firestore membership", {
    userId,
    membershipId: result.id,
    status: result.status,
    tier: result.tier,
    bypassCache: options?.bypassCache === true,
  });
  return result;
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
  // For now, let-s keep it simple and just update the document status.

  membershipCache.invalidate(userId);
  return { success: true };
};
