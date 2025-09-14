"use server";
import {
  CRS_REPORT_BUSINESS_PROFILE,
  CRS_REPORT_BUSINESS_SCORE,
  CRS_REPORT_DATA,
} from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin } from "@/lib/fireabase-admin";

export const recordCRSReport = async (userId: string, report: any) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_DATA);
  return await collectionRef.add({ userId, report, createdAt: new Date() });
};

export const recordCRSBusinessProfile = async (userId: string, businessId: string, report: any) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_BUSINESS_PROFILE);
  return await collectionRef.add({ userId, businessId, report, createdAt: new Date() });
};

export const recordCRSBusinessScore = async (userId: string, businessId: string, report: any) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_BUSINESS_SCORE);
  return await collectionRef.add({ userId, businessId, report, createdAt: new Date() });
};

export const getCRSReport = async (userId: string) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_DATA).where("userId", "==", userId);
  const snapshot = await collectionRef.orderBy("createdAt", "desc").get();
  if (snapshot.empty) return null;

  return snapshot.docs.map((doc) => ({ id: doc.id, ...normalizeAllDates(doc.data()) }));
};

export const getCRSBusinessProfile = async (userId: string, businessId: string) => {
  const db = firestoreAdmin();

  const collectionRef = db
    .collection(CRS_REPORT_BUSINESS_PROFILE)
    .where("userId", "==", userId)
    .where("businessId", "==", businessId);
  const snapshot = await collectionRef.orderBy("createdAt", "desc").get();
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = normalizeAllDates(doc.data());

  return { id: doc.id, ...data };
};

export const getCRSBusinessScore = async (userId: string, businessId: string) => {
  const db = firestoreAdmin();

  const collectionRef = db
    .collection(CRS_REPORT_BUSINESS_SCORE)
    .where("userId", "==", userId)
    .where("businessId", "==", businessId);
  const snapshot = await collectionRef.orderBy("createdAt", "desc").get();
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = normalizeAllDates(doc.data());

  return { id: doc.id, ...data };
};

export const generateCRSReport = async (userId: string) => {
  await fetch(`${process.env.n8n_HOST}/crs-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
    },
    body: JSON.stringify({
      userId,
      type: "personal",
    }),
  });
};
