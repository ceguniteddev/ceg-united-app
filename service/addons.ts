"use server";

import { firestoreAdmin } from "@/lib/fireabase-admin";
import { USER_COLLECTION } from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { logInfo } from "@/lib/logger";

export type AddonTier = "credit_module_pro";

export interface UserAddon {
  id: string;
  addonId: AddonTier;
  amount: number;
  status: string;
  checkoutId?: string | null;
  createdAt: string | null;
  canceledAt?: string | null;
}

export const activateUserAddon = async ({
  userId,
  addonId,
  amount,
  checkoutId,
  planId,
  receiptId,
}: {
  userId: string;
  addonId: AddonTier;
  amount: number;
  checkoutId?: string;
  planId?: string;
  receiptId?: string;
}) => {
  logInfo("Activating user addon", { userId, addonId, amount });
  if (!userId) throw new AppError("User ID is required.");

  const db = firestoreAdmin();

  // Create addon record
  await db.collection(`${USER_COLLECTION}/${userId}/addons`).add({
    addonId,
    amount,
    planId: planId || null,
    receiptId: receiptId || null,
    checkoutId: checkoutId || null,
    createdAt: new Date(),
    status: "active",
  });

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
