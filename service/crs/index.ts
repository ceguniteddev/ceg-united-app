"use server";
import {
  CRS_REPORT_BUSINESS_PROFILE,
  CRS_REPORT_BUSINESS_SCORE,
  CRS_REPORT_DATA,
} from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { Business } from "@/schema";
import { getBusiness } from "@/service/business";
import { getUserById } from "@/service/user";
import { CRSReportType } from "@/types/crs";

export const recordCRSReport = async (userId: string, crsType: CRSReportType, report: any) => {
  if (!userId) throw new Error("User ID is required.");

  const userData = await getUserById(userId);
  if (!userData) throw new Error("User not found.");

  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_DATA);
  const docRef = collectionRef.doc(userId);

  await docRef.set({ userId, createdAt: new Date(), updatedAt: new Date() }, { merge: true });

  const subCollectionRef = db.collection(`${CRS_REPORT_DATA}/${userId}/${crsType}`);
  const subDocRef = subCollectionRef.doc(crsType);
  await subDocRef.set({ userId, report, createdAt: new Date() }, { merge: true });
};

export const recordCRSBusinessProfile = async (userId: string, businessId: string, report: any) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_BUSINESS_PROFILE);
  const docRef = collectionRef.doc(businessId);
  await docRef.set({ userId, businessId, report, createdAt: new Date() }, { merge: true });
};

export const recordCRSBusinessScore = async (userId: string, businessId: string, report: any) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_BUSINESS_SCORE);
  const docRef = collectionRef.doc(businessId);
  await docRef.set({ userId, businessId, report, createdAt: new Date() }, { merge: true });
};

export const getCRSReport = async (userId: string) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_DATA);
  const docRef = collectionRef.doc(userId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) return null;

  const subcols = await docRef.listCollections();

  const nested = await Promise.all(
    subcols.map(async (colRef) => {
      const qs = await colRef.get();
      return qs.docs.map((doc) => ({
        type: colRef.id,
        id: doc.id,
        ...normalizeAllDates(doc.data() || {}),
      }));
    })
  );

  return nested.flat();
};

export const deleteCRSReport = async (reportId: string) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_DATA);
  await collectionRef.doc(reportId).delete();
};

export const getCRSBusinessProfile = async (businessId: string) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_BUSINESS_PROFILE);
  const docRef = collectionRef.doc(businessId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) return null;

  const doc = snapshot.data();
  const data = normalizeAllDates(doc);

  return { id: businessId, ...data };
};

export const getCRSBusinessScore = async (businessId: string) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_BUSINESS_SCORE);
  const docRef = collectionRef.doc(businessId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) return null;

  const doc = snapshot.data();
  const data = normalizeAllDates(doc);

  return { id: businessId, ...data };
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

export const refreshCRSData = async (userId: string) => {
  await generateCRSReport(userId);

  const businessDetails: Business[] = await getBusiness(userId);
  await Promise.all(
    businessDetails.map(async (business) => {
      await fetch(`${process.env.n8n_HOST}/crs-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
        },
        body: JSON.stringify({
          businessId: business.id ?? "",
          userId: userId,
          type: "business",
        }),
      });
    })
  );
};
