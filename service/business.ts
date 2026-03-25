"use server";

import {
  BUSINESS_DETAIL_COLLECTION,
  USER_FUNDING_APPLICATION,
} from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { Business, businessRecordSchema } from "@/schema";
import { Timestamp } from "firebase-admin/firestore";

export const recordBusiness = async (values: Business): Promise<string> => {
  const result = businessRecordSchema.safeParse(values);

  if (!result.success) {
    throw new AppError(result.error.message);
  }

  const db = firestoreAdmin();
  const collectionRef = db.collection(BUSINESS_DETAIL_COLLECTION);
  const docRef = await collectionRef.add({
    ...result.data,
    createdAt: Timestamp.now(),
  });

  // Return the document ID
  return docRef.id;
};

export const updateBusiness = async (id: string, values: Business) => {
  if (!id) {
    throw new AppError("ID is required.");
  }
  const result = businessRecordSchema.safeParse(values);
  if (!result.success) {
    throw new AppError(result.error.message);
  }
  const db = firestoreAdmin();
  const collectionRef = db.collection(BUSINESS_DETAIL_COLLECTION).doc(id);
  await collectionRef.update({ ...result.data, updatedAt: Timestamp.now() });
};

export const getBusiness = async (userId: string) => {
  if (!userId) {
    throw new AppError("User ID is required.");
  }
  const db = firestoreAdmin();
  const collectionRef = db
    .collection(BUSINESS_DETAIL_COLLECTION)
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc");
  const querySnapshot = await collectionRef.get();
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...normalizeAllDates(doc.data()) }) as Business,
  );
};

export const deleteBusiness = async (id: string) => {
  if (!id) {
    throw new AppError("ID is required.");
  }

  const db = firestoreAdmin();

  // Check if business is used in any funding applications
  const fundingAppsSnapshot = await db
    .collection(USER_FUNDING_APPLICATION)
    .where("businessId", "==", id)
    .limit(1)
    .get();

  if (!fundingAppsSnapshot.empty) {
    throw new AppError(
      "Cannot delete business. This business is associated with one or more funding applications.",
    );
  }

  const collectionRef = db.collection(BUSINESS_DETAIL_COLLECTION).doc(id);
  await collectionRef.delete();
};

export const getBusinessById = async (id: string) => {
  if (!id) {
    throw new AppError("ID is required.");
  }
  const db = firestoreAdmin();
  const collectionRef = db.collection(BUSINESS_DETAIL_COLLECTION).doc(id);
  const doc = await collectionRef.get();
  return { id: doc.id, ...normalizeAllDates(doc.data()) } as Business;
};
