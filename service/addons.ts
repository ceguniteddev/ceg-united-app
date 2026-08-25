"use server";

import { firestoreAdmin } from "@/lib/fireabase-admin";
import { USER_COLLECTION } from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { logInfo } from "@/lib/logger";
import { triggerActivationCRSWorkflow } from "@/service/membership";

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
}

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

export const getUserAddons = async (userId: string): Promise<UserAddon[]> => {
  logInfo("Fetching user addons", { userId });
  if (!userId) throw new AppError("User ID is required.");

  const db = firestoreAdmin();
  const snapshot = await db
    .collection(`${USER_COLLECTION}/${userId}/addons`)
    .where("status", "==", "active")
    .get();

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      addonId: data.addonId || "unknown",
      amount: data.amount || 0,
      status: data.status || "active",
      checkoutId: data.checkoutId || null,
      createdAt: data.createdAt?.toDate().toISOString() || null,
      canceledAt: data.canceledAt?.toDate().toISOString() || null,
      updatedBy: data.updatedBy || null,
      updatedAt: data.updatedAt?.toDate().toISOString() || null,
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
    return !snapshot.empty;
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
