"use server";
import {
  SYSTEM_CONFIG_COLLECTION,
  USER_TRADELINE_COLLECTION,
} from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";

const CONFIG_DOC_ID = "settings";

export const getMarkupPercentage = async (): Promise<number> => {
  const db = firestoreAdmin();
  const doc = await db
    .collection(SYSTEM_CONFIG_COLLECTION)
    .doc(CONFIG_DOC_ID)
    .get();
  return doc.exists ? (doc.data()?.markupPercentage ?? 0) : 0;
};

export const setMarkupPercentage = async (
  markupPercentage: number,
): Promise<void> => {
  const db = firestoreAdmin();
  await db
    .collection(SYSTEM_CONFIG_COLLECTION)
    .doc(CONFIG_DOC_ID)
    .set({ markupPercentage }, { merge: true });
};

export const purchaseTradeline = async (
  userId: string,
  tradelineData: Record<string, any>,
): Promise<void> => {
  const db = firestoreAdmin();
  await db.collection(USER_TRADELINE_COLLECTION).add({
    userId,
    ...tradelineData,
    createdAt: new Date().toISOString(),
  });
};
