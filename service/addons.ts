"use server";

import { firestoreAdmin } from "@/lib/fireabase-admin";
import { USER_COLLECTION } from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { logInfo } from "@/lib/logger";
import { triggerActivationCRSWorkflow } from "@/service/membership";
import type {
  MembershipEntitlementStatus,
  MembershipProviderStatus,
} from "@/schema/users";

export type AddonTier = "credit_module_pro";

export interface UserAddon {
  id: string;
  addonId: AddonTier;
  amount: number;
  status: string;
  checkoutId?: string | null;
  createdAt: string | null;
  canceledAt?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
  provider?: "dodo" | null;
  providerStatus?: MembershipProviderStatus | null;
  entitlementStatus?: MembershipEntitlementStatus | null;
  subscriptionId?: string | null;
  customerId?: string | null;
  productId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  nextBillingDate?: string | null;
  cancelAtNextBillingDate?: boolean;
  paymentFailureStartedAt?: string | null;
  retryAccessUntil?: string | null;
  nextReminderAt?: string | null;
  lastReminderAt?: string | null;
  reminderCount?: number;
  finalNoticeSentAt?: string | null;
  legacyBillingModel?: boolean;
}

const RETRY_WINDOW_DAYS = Number(process.env.DODO_RETRY_WINDOW_DAYS || 13);

const dateValue = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isoValue = (value: any) => dateValue(value)?.toISOString() || null;

export const synchronizeDodoAddon = async ({
  userId,
  addonId,
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
  addonId: AddonTier;
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
  const addonRef = db.doc(`${USER_COLLECTION}/${userId}/addons/${addonId}`);
  const now = new Date();
  let newlyActive = false;

  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(addonRef);
    const existing = current.data() || {};
    const incomingEventAt = dateValue(eventCreatedAt) || now;
    const previousEventAt = dateValue(existing.providerEventAt);
    if (previousEventAt && incomingEventAt < previousEventAt) return;

    let entitlementStatus: MembershipEntitlementStatus = "free";
    if (providerStatus === "active") entitlementStatus = "paid";
    if (providerStatus === "on_hold" || providerStatus === "paused") {
      entitlementStatus = "grace";
    }
    if (providerStatus === "cancelled" && cancelAtNextBillingDate) {
      const accessEnd = dateValue(expiresAt || nextBillingDate);
      entitlementStatus = accessEnd && accessEnd > now ? "paid" : "free";
    }
    newlyActive =
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
      ? new Date(now.getTime() + RETRY_WINDOW_DAYS * 86_400_000)
      : dateValue(existing.retryAccessUntil);
    const recoveryFields =
      entitlementStatus === "grace"
        ? {
            paymentFailureStartedAt: failureStartedAt || now,
            retryAccessUntil:
              retryAccessUntil ||
              new Date(now.getTime() + RETRY_WINDOW_DAYS * 86_400_000),
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
      addonRef,
      {
        addonId,
        amount,
        provider: "dodo",
        providerStatus,
        entitlementStatus,
        status: entitlementStatus === "free" ? "inactive" : "active",
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

  if (newlyActive && addonId === "credit_module_pro") {
    await triggerActivationCRSWorkflow({ userId, source: "addon" });
  }
  return { success: true };
};

export const activateUserAddon = async ({
  userId,
  addonId,
  amount,
  checkoutId,
  planId,
  receiptId,
  triggerCRSWorkflow = false,
}: {
  userId: string;
  addonId: AddonTier;
  amount: number;
  checkoutId?: string;
  planId?: string;
  receiptId?: string;
  triggerCRSWorkflow?: boolean;
}) => {
  logInfo("Activating user addon", { userId, addonId, amount });
  if (!userId) throw new AppError("User ID is required.");

  const db = firestoreAdmin();
  const addonsRef = db.collection(`${USER_COLLECTION}/${userId}/addons`);
  const targetDocRef = addonsRef.doc(addonId);
  const activeQuery = addonsRef
    .where("addonId", "==", addonId)
    .where("status", "==", "active")
    .limit(1);

  let alreadyActive = false;

  await db.runTransaction(async (transaction) => {
    const [targetDoc, activeSnapshot] = await Promise.all([
      transaction.get(targetDocRef),
      transaction.get(activeQuery),
    ]);

    const existingDoc = targetDoc.exists ? targetDoc : activeSnapshot.docs[0];

    if (existingDoc && existingDoc.exists) {
      alreadyActive = true;
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

    transaction.set(targetDocRef, {
      addonId,
      amount,
      planId: planId || null,
      receiptId: receiptId || null,
      checkoutId: checkoutId || null,
      createdAt: new Date(),
      status: "active",
    });
  });

  if (alreadyActive) {
    return { success: true, alreadyActive: true };
  }

  if (triggerCRSWorkflow && addonId === "credit_module_pro") {
    await triggerActivationCRSWorkflow({ userId, source: "addon" });
  }

  return { success: true };
};

export const getUserAddons = async (
  userId: string,
  options?: { includeInactive?: boolean },
): Promise<UserAddon[]> => {
  logInfo("Fetching user addons", { userId });
  if (!userId) throw new AppError("User ID is required.");

  const db = firestoreAdmin();
  let query: FirebaseFirestore.Query = db.collection(
    `${USER_COLLECTION}/${userId}/addons`,
  );
  if (!options?.includeInactive) query = query.where("status", "==", "active");
  const snapshot = await query.get();

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const retryDeadline = dateValue(data.retryAccessUntil);
    const graceExpired =
      data.entitlementStatus === "grace" &&
      (!retryDeadline || retryDeadline.getTime() <= Date.now());
    return {
      id: doc.id,
      addonId: data.addonId || "unknown",
      amount: data.amount || 0,
      status: graceExpired ? "inactive" : data.status || "active",
      checkoutId: data.checkoutId || null,
      createdAt: isoValue(data.createdAt),
      canceledAt: isoValue(data.canceledAt),
      updatedBy: data.updatedBy || null,
      updatedAt: isoValue(data.updatedAt),
      provider: data.provider || null,
      providerStatus: data.providerStatus || null,
      entitlementStatus: graceExpired ? "free" : data.entitlementStatus || null,
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
  });
};

export const hasActiveAddon = async (
  userId: string,
  addonId: AddonTier,
): Promise<boolean> => {
  if (!userId || !addonId) return false;
  try {
    const db = firestoreAdmin();
    const snapshot = await db
      .collection(`${USER_COLLECTION}/${userId}/addons`)
      .where("addonId", "==", addonId)
      .where("status", "==", "active")
      .limit(1)
      .get();
    return snapshot.docs.some((doc) => {
      const data = doc.data();
      if (data.entitlementStatus !== "grace") return true;
      const retryDeadline = dateValue(data.retryAccessUntil);
      return Boolean(retryDeadline && retryDeadline.getTime() > Date.now());
    });
  } catch {
    return false;
  }
};

export const toggleUserAddon = async ({
  userId,
  addonId,
  active,
  amount,
  updatedBy,
}: {
  userId: string;
  addonId: AddonTier;
  active: boolean;
  amount?: number;
  updatedBy: string;
}) => {
  logInfo("Admin toggling user addon", { userId, addonId, active, updatedBy });
  if (!userId) throw new AppError("User ID is required.");
  if (!addonId) throw new AppError("Addon ID is required.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(`${USER_COLLECTION}/${userId}/addons`);

  // Query existing addons of this type
  const snapshot = await collectionRef.where("addonId", "==", addonId).get();

  if (active) {
    const activeDoc = snapshot.docs.find(
      (doc) => doc.data().status === "active",
    );
    if (activeDoc) return { success: true }; // Already active

    // Create a new active addon record
    await collectionRef.add({
      addonId,
      amount: amount ?? 0,
      createdAt: new Date(),
      status: "active",
      updatedBy,
    });
  } else {
    // Deactivate/Cancel all active instances of this addon
    const activeDocs = snapshot.docs.filter(
      (doc) => doc.data().status === "active",
    );
    if (activeDocs.length > 0) {
      const batch = db.batch();
      activeDocs.forEach((doc) => {
        batch.update(doc.ref, {
          status: "canceled",
          canceledAt: new Date(),
          updatedBy,
        });
      });
      await batch.commit();
    }
  }

  return { success: true };
};
