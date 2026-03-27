"use server";
import { USER_CART_COLLECTION } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import type { CartItem } from "@/types/tradelines";

/**
 * Get user's cart from Firestore
 */
export const getUserCart = async (userId: string): Promise<CartItem[]> => {
  const db = firestoreAdmin();
  const doc = await db.collection(USER_CART_COLLECTION).doc(userId).get();

  if (!doc.exists) {
    return [];
  }

  const data = doc.data();
  return data?.items || [];
};

/**
 * Update user's cart in Firestore
 */
export const updateUserCart = async (
  userId: string,
  items: CartItem[],
): Promise<void> => {
  const db = firestoreAdmin();
  await db.collection(USER_CART_COLLECTION).doc(userId).set(
    {
      items,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
};

/**
 * Clear user's cart in Firestore
 */
export const clearUserCart = async (userId: string): Promise<void> => {
  const db = firestoreAdmin();
  await db.collection(USER_CART_COLLECTION).doc(userId).delete();
};
