import { firestoreAdmin } from "@/lib/fireabase-admin";
import { BROKERAGE_COLLECTION } from "@/constant/collection-name";
import { Brokerage } from "@/schema/brokerage";
import { Timestamp } from "firebase-admin/firestore";
import AppError from "@/error/AppError";
import { normalizeAllDates } from "@/lib/date-parser";

export const getBrokerages = async (): Promise<Brokerage[]> => {
  const db = firestoreAdmin();
  const snapshot = await db.collection(BROKERAGE_COLLECTION).get();

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...normalizeAllDates(doc.data()),
    } as Brokerage;
  });
};

export const getBrokerageById = async (
  id: string,
): Promise<Brokerage | null> => {
  const db = firestoreAdmin();
  const doc = await db.collection(BROKERAGE_COLLECTION).doc(id).get();

  if (!doc.exists) return null;

  return {
    id: doc.id,
    ...normalizeAllDates(doc.data()),
  } as Brokerage;
};

export const createBrokerage = async (
  data: Omit<Brokerage, "id">,
): Promise<string> => {
  const db = firestoreAdmin();

  const docRef = await db.collection(BROKERAGE_COLLECTION).add({
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
};

export const updateBrokerage = async (
  id: string,
  data: Partial<Brokerage>,
): Promise<void> => {
  const db = firestoreAdmin();
  const docRef = db.collection(BROKERAGE_COLLECTION).doc(id);

  const doc = await docRef.get();
  if (!doc.exists) {
    throw new AppError("Brokerage not found");
  }

  // Remove id if passed in data
  const { id: _id, createdAt, ...updateData } = data as any;

  await docRef.update({
    ...updateData,
    updatedAt: Timestamp.now(),
  });
};

export const deleteBrokerage = async (id: string): Promise<void> => {
  const db = firestoreAdmin();
  const docRef = db.collection(BROKERAGE_COLLECTION).doc(id);

  const doc = await docRef.get();
  if (!doc.exists) {
    throw new AppError("Brokerage not found");
  }

  await docRef.delete();
};
