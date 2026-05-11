"use server";

import { BANK_MANAGEMENT_COLLECTION } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { BankManagement } from "@/schema/bank-management";

export const createBank = async (data: BankManagement) => {
  const db = firestoreAdmin();
  // Ensure we don't save 'id' as a field if it's undefined or empty in data
  const { id, ...saveData } = data;
  const ref = await db.collection(BANK_MANAGEMENT_COLLECTION).add(saveData);
  return { id: ref.id, ...saveData };
};

export const getBanks = async () => {
  const db = firestoreAdmin();
  const snapshot = await db
    .collection(BANK_MANAGEMENT_COLLECTION)
    .orderBy("bankName", "asc")
    .get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as BankManagement[];
};

export const getBankById = async (
  id: string,
): Promise<BankManagement | null> => {
  const db = firestoreAdmin();
  const doc = await db.collection(BANK_MANAGEMENT_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as BankManagement;
};

export const updateBank = async (id: string, data: Partial<BankManagement>) => {
  const db = firestoreAdmin();
  // Don't update the ID field itself
  const { id: _, ...updateData } = data;
  await db.collection(BANK_MANAGEMENT_COLLECTION).doc(id).update(updateData);
};

export const deleteBank = async (id: string) => {
  const db = firestoreAdmin();
  await db.collection(BANK_MANAGEMENT_COLLECTION).doc(id).delete();
};
