"use server";

import {
  BANK_PRODUCTS_COLLECTION,
  USER_FUNDING_APPLICATION,
  USER_FUNDING_APPLICATION_FUND_MAPPING,
} from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { logInfo } from "@/lib/logger";
import { BankFormData } from "@/schema/bank-products";
import { getApplyFundingByReferenceNumber } from "./apply-funding";
import { getUserById } from "./user";
import { Timestamp } from "firebase-admin/firestore";

export const recordBankProduct = async (value: BankFormData) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(BANK_PRODUCTS_COLLECTION);
  await collectionRef.add(value);
};

export const getBankProducts = async () => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(BANK_PRODUCTS_COLLECTION);
  const snapshot = await collectionRef.orderBy("bankName", "asc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BankFormData));
};

export const getBankProduct = async (id: string) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(BANK_PRODUCTS_COLLECTION).doc(id);
  const doc = await collectionRef.get();
  return { id: doc.id, ...doc.data() } as BankFormData;
};

export const deleteBankProduct = async (id: string) => {
  console.log("deleteBankProduct", id);

  const data = getBankProduct(id);
  if (!data) {
    throw new Error("Bank product not found.");
  }

  const db = firestoreAdmin();
  const collectionRef = db.collection(BANK_PRODUCTS_COLLECTION).doc(id);
  await collectionRef.delete();
};

export const updateBankProduct = async (id: string, values: BankFormData) => {
  const data = getBankProduct(id);
  if (!data) {
    throw new Error("Bank product not found.");
  }

  const db = firestoreAdmin();
  const collectionRef = db.collection(BANK_PRODUCTS_COLLECTION).doc(id);
  await collectionRef.update(values);
};

export const recordFundMappingAnalysis = async (
  userId: string,
  referenceNumber: string,
  analysis: string
) => {
  if (!userId) throw new AppError("User ID is required.");
  if (!referenceNumber) throw new AppError("Reference number is required.");
  if (!analysis) throw new AppError("Analysis is required.");

  logInfo("recordFundMappingAnalysis", { userId, referenceNumber });

  const fundingApplication = await getApplyFundingByReferenceNumber(referenceNumber);
  if (!fundingApplication) throw new AppError("Funding application reference number not found.");

  const userData = await getUserById(userId);
  if (!userData) throw new AppError("User not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING}`
  );
  await collectionRef.add({ analysis, userId, createdAt: Timestamp.now() });
};
