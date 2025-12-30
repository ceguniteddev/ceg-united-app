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
import {
  deleteFundMappingAnalysis,
  getFundMappingAnalysis,
} from "./bank-products";
import { fundAnalysis } from "./crs";
import { deleteFundingAnalysis, sendClientAnalysisN8N } from "@/lib/n8n";

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

export const recordAnalysis = async (
  userId: string,
  referenceNumber: string,
  analysis: string
) => {
  if (!userId) throw new AppError("User ID is required.");
  if (!referenceNumber) throw new AppError("Reference number is required.");
  if (!analysis) throw new AppError("Analysis is required.");

  logInfo("recordAnalysis", { userId, referenceNumber });

  const fundingApplication = await getApplyFundingByReferenceNumber({
    referenceNumber,
  });
  if (!fundingApplication)
    throw new AppError("Funding application reference number not found.");

  const userData = await getUserById(userId);
  if (!userData) throw new AppError("User not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_ANALYSIS}`
  );
  await collectionRef.add({ analysis, userId, createdAt: Timestamp.now() });
};

export const updateAnalysis = async (
  referenceNumber: string,
  docId: string,
  analysis: string
) => {
  console.log("updateAnalysis", { referenceNumber, docId });
  if (!docId) throw new AppError("Document ID is required.");
  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_ANALYSIS}`
  );
  await collectionRef.doc(docId).update({ analysis });
};

export const deleteAnalysis = async (
  referenceNumber: string,
  docId: string
) => {
  console.log("deleteAnalysis", { referenceNumber, docId });
  if (!docId) throw new AppError("Document ID is required.");
  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_ANALYSIS}`
  );
  await collectionRef.doc(docId).delete();
};

export const refreshAnalysis = async (referenceNumber: string) => {
  console.log("refreshAnalysis", { referenceNumber });

  // 1. Fetch initial application data
  const data = await getApplyFundingByReferenceNumber({ referenceNumber });
  if (!data) {
    throw new AppError("Funding application not found.");
  }

  // 2. Fetch existing analysis and mapped products
  const analysisData = await getAnalysis(referenceNumber);
  const mappedProducts = await getFundMappingAnalysis(referenceNumber);

  // 3. Concurrently delete existing analysis and mapped products
  const deletionPromises: Promise<any>[] = [];

  if (analysisData && analysisData.length > 0) {
    console.log(`Found ${analysisData.length} analysis items to delete.`);
    analysisData.forEach((item) => {
      deletionPromises.push(deleteAnalysis(referenceNumber, item.id));
    });
  }

  if (mappedProducts && mappedProducts.length > 0) {
    console.log(`Found ${mappedProducts.length} mapped products to delete.`);
    // Note: The comment "what about approved mapped bank products?" in the original code
    // suggests a potential business logic issue. You might want to filter out
    // approved products before deleting them.
    mappedProducts.forEach((item) => {
      deletionPromises.push(
        deleteFundMappingAnalysis(referenceNumber, item.id!)
      );
    });
  }

  // Wait for all deletion operations to complete
  if (deletionPromises.length > 0) {
    await Promise.all(deletionPromises);
    console.log("All existing analysis and mappings have been deleted.");
  }

  await fetch(`${process.env.n8n_HOST}/${await deleteFundingAnalysis()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
    },
    body: JSON.stringify({
      referenceNumber,
      userId: data.userId,
    }),
  });

  // 4. Trigger a new analysis
  // Note: The comment "call n8n webhook" suggests this might be the place
  // to trigger it after the refresh is complete.
  await fundAnalysis({ referenceNumber, userId: data.userId! });

  console.log("Successfully refreshed analysis.");
};

export const sendClientAnalysisData = async (referenceNumber: string) => {
  console.log("sendClientAnalysisData", { referenceNumber });

  // 1. Fetch initial application data
  const data = await getApplyFundingByReferenceNumber({ referenceNumber });
  if (!data) {
    throw new AppError("Funding application not found.");
  }

  const userData = await getUserById(data.userId!);
  if (!userData) throw new AppError("User not found.");

  const n8nWebhookURL = await sendClientAnalysisN8N();

  await fetch(`${process.env.n8n_HOST}/${n8nWebhookURL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
    },
    body: JSON.stringify({
      referenceNumber,
      userId: data.userId,
      email: userData.email,
      clientName: `${userData.firstName} ${userData.lastName}`,
    }),
  });
};
