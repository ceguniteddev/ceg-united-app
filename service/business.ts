"use server";

import { BUSINESS_DETAIL_COLLECTION } from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { Business, businessRecordSchema } from "@/schema";
import { Timestamp } from "firebase-admin/firestore";

export const recordBusiness = async (values: Business) => {
  const result = businessRecordSchema.safeParse(values);
  if (!result.success) {
    throw new AppError(result.error.message);
  }

  const db = firestoreAdmin();
  const collectionRef = db.collection(BUSINESS_DETAIL_COLLECTION);
  await collectionRef.add({ ...result.data, createdAt: Timestamp.now() });

  // await fetch(`${process.env.n8n_HOST}/crs-report`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
  //   },
  //   body: JSON.stringify({
  //     businessId: docRef.id,
  //     userId: values.userId,
  //     type: "business",
  //   }),
  // });
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

  // await fetch(`${process.env.n8n_HOST}/crs-report`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
  //   },
  //   body: JSON.stringify({
  //     businessId: id,
  //     userId: values.userId,
  //     type: "business",
  //   }),
  // });
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
    (doc) => ({ id: doc.id, ...normalizeAllDates(doc.data()) } as Business)
  );
};

export const deleteBusiness = async (id: string) => {
  if (!id) {
    throw new AppError("ID is required.");
  }
  const db = firestoreAdmin();
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
