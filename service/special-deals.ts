"use server";

import { firestoreAdmin } from "@/lib/fireabase-admin";
import { SPECIAL_DEALS_COLLECTION } from "@/constant/collection-name";
import type { SpecialDeal } from "@/schema/special-deals";

export const createSpecialDeal = async (
  data: Omit<SpecialDeal, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const db = firestoreAdmin();
  const docRef = await db.collection(SPECIAL_DEALS_COLLECTION).add({
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const getAllSpecialDeals = async (): Promise<SpecialDeal[]> => {
  const db = firestoreAdmin();
  const snapshot = await db
    .collection(SPECIAL_DEALS_COLLECTION)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SpecialDeal[];
};

export const getActiveSpecialDeals = async (): Promise<SpecialDeal[]> => {
  const db = firestoreAdmin();
  const now = new Date().toISOString();

  const snapshot = await db
    .collection(SPECIAL_DEALS_COLLECTION)
    .where("isActive", "==", true)
    .where("expiresAt", ">=", now)
    .orderBy("expiresAt", "asc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SpecialDeal[];
};

export const getSpecialDealById = async (
  id: string,
): Promise<SpecialDeal | null> => {
  const db = firestoreAdmin();
  const doc = await db.collection(SPECIAL_DEALS_COLLECTION).doc(id).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  } as SpecialDeal;
};

export const updateSpecialDeal = async (
  id: string,
  data: Partial<Omit<SpecialDeal, "id" | "createdAt" | "updatedAt">>,
): Promise<void> => {
  const db = firestoreAdmin();
  await db
    .collection(SPECIAL_DEALS_COLLECTION)
    .doc(id)
    .update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
};

export const deleteSpecialDeal = async (id: string): Promise<void> => {
  const db = firestoreAdmin();
  await db.collection(SPECIAL_DEALS_COLLECTION).doc(id).delete();
};

export const toggleSpecialDealActive = async (
  id: string,
  isActive: boolean,
): Promise<void> => {
  const db = firestoreAdmin();
  await db.collection(SPECIAL_DEALS_COLLECTION).doc(id).update({
    isActive,
    updatedAt: new Date().toISOString(),
  });
};
