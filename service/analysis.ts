"use server";
import { logInfo } from "@/lib/logger";
import { getApplyFundingByReferenceNumber } from "./apply-funding";
import AppError from "@/error/AppError";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import {
  USER_FUNDING_APPLICATION,
  USER_FUNDING_APPLICATION_ANALYSIS,
} from "@/constant/collection-name";
import { getUserById } from "./user";
import { Timestamp } from "firebase-admin/firestore";
import { normalizeAllDates } from "@/lib/date-parser";

export const getAnalysis = async (referenceNumber: string) => {
  logInfo("getAnalysis", { referenceNumber });

  const data = await getApplyFundingByReferenceNumber({ referenceNumber });
  if (!data) throw new AppError("Funding application not found.");

  const db = firestoreAdmin();
  const appRef = db.collection(USER_FUNDING_APPLICATION).doc(referenceNumber);

  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_ANALYSIS}`
  );
  const snapshot = await collectionRef.orderBy("createdAt", "desc").get();
  if (snapshot.empty) {
    console.log("No matching documents.");
    return null;
  }
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...normalizeAllDates(doc.data()),
  }));
};

export const recordAnalysis = async (userId: string, referenceNumber: string, analysis: string) => {
  if (!userId) throw new AppError("User ID is required.");
  if (!referenceNumber) throw new AppError("Reference number is required.");
  if (!analysis) throw new AppError("Analysis is required.");

  logInfo("recordAnalysis", { userId, referenceNumber });

  const fundingApplication = await getApplyFundingByReferenceNumber({ referenceNumber });
  if (!fundingApplication) throw new AppError("Funding application reference number not found.");

  const userData = await getUserById(userId);
  if (!userData) throw new AppError("User not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_ANALYSIS}`
  );
  await collectionRef.add({ analysis, userId, createdAt: Timestamp.now() });
};

export const updateAnalysis = async (referenceNumber: string, docId: string, analysis: string) => {
  console.log("updateAnalysis", { referenceNumber, docId });
  if (!docId) throw new AppError("Document ID is required.");
  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_ANALYSIS}`
  );
  await collectionRef.doc(docId).update({ analysis });
};
