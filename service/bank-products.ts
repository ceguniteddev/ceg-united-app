"use server";

import {
  BANK_PRODUCTS_COLLECTION,
  USER_FUNDING_APPLICATION,
  USER_FUNDING_APPLICATION_FUND_MAPPING,
  USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED,
} from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { logInfo } from "@/lib/logger";
import { BankFormData } from "@/schema/bank-products";
import { getApplyFundingByReferenceNumber, updateApplicationStatus } from "./apply-funding";
import { getCurrentUser, getUserById } from "./user";
import { Timestamp } from "firebase-admin/firestore";
import { normalizeAllDates } from "@/lib/date-parser";

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
  ids: { id: string }[]
) => {
  if (!userId) throw new AppError("User ID is required.");
  if (!referenceNumber) throw new AppError("Reference number is required.");
  if (!ids || ids.length === 0) throw new AppError("Analysis is required.");

  logInfo("recordFundMappingAnalysis", { userId, referenceNumber });

  const fundingApplication = await getApplyFundingByReferenceNumber(referenceNumber);
  if (!fundingApplication) throw new AppError("Funding application reference number not found.");

  const userData = await getUserById(userId);
  if (!userData) throw new AppError("User not found.");

  const db = firestoreAdmin();
  const collectionRef = db
    .collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING}`
    )
    .doc(referenceNumber);
  await collectionRef.set({
    bank_products: ids,
    userId,
    createdAt: Timestamp.now(),
  });
};

export const getFundMappingAnalysis = async (referenceNumber: string) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING}`
  );
  const doc = await collectionRef.get();
  const bankProductIds = doc.docs.map((doc) => ({
    bank_products: doc.data().bank_products,
  }));
  if (!bankProductIds) return null;

  const result: BankFormData[] = [];
  for (const bankProductId of bankProductIds) {
    for (const id of bankProductId.bank_products) {
      const bankProduct = await getBankProduct(id.id);
      if (bankProduct) {
        result.push(bankProduct);
      }
    }
  }
  return result;
};

// export const approveMappedFund = async (referenceNumber: string, bankProductId: string) => {
//   if (!referenceNumber) throw new AppError("Reference number is required.");

//   logInfo("approveMappedFund", { referenceNumber });

//   const fundingApplication = await getApplyFundingByReferenceNumber(referenceNumber);
//   if (!fundingApplication) throw new AppError("Funding application reference number not found.");

//   const productData = await getBankProduct(bankProductId);
//   if (!productData) throw new AppError("Bank product not found.");

//   const currentUser = await getCurrentUser();
//   if (!currentUser) throw new AppError("User not found.");

//   // check if already approved
//   const approvedFunds = await getApprovedMappedFunds(referenceNumber);
//   if (approvedFunds?.find((f) => f.id === bankProductId))
//     throw new AppError("This bank product is already approved.");

//   const db = firestoreAdmin();
//   const collectionRef = db.collection(
//     `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`
//   );
//   await collectionRef.add({
//     bankProductId,
//     createdAt: Timestamp.now(),
//     approvedById: currentUser.uid,
//     clientApplicationStatus: "Not Applied",
//   });

//   await updateApplicationStatus(referenceNumber, "Pre-Approved");

//   // TODO send notification email
// };

export const approveMappedFund = async (
  referenceNumber: string,
  bankProductId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!referenceNumber) {
      return { success: false, error: "Reference number is required." };
    }
    logInfo("approveMappedFund", { referenceNumber });

    const fundingApplication = await getApplyFundingByReferenceNumber(referenceNumber);
    if (!fundingApplication) {
      return { success: false, error: "Funding application reference number not found." };
    }

    const productData = await getBankProduct(bankProductId);
    if (!productData) {
      return { success: false, error: "Bank product not found." };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "User not found." };
    }

    // check if already approved
    const approvedFunds = await getApprovedMappedFunds(referenceNumber);
    if (approvedFunds?.find((f) => f.id === bankProductId)) {
      return { success: false, error: "This bank product is already approved." };
    }

    const db = firestoreAdmin();
    const collectionRef = db.collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`
    );
    await collectionRef.add({
      bankProductId,
      createdAt: Timestamp.now(),
      approvedById: currentUser.uid,
      clientApplicationStatus: "Not Applied",
    });

    await updateApplicationStatus(referenceNumber, "Pre-Approved");

    return { success: true };
  } catch (error: any) {
    console.error("Error in approveMappedFund:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
};

export const getApprovedMappedFunds = async (referenceNumber: string) => {
  if (!referenceNumber) throw new AppError("Reference number is required.");
  const referenceData = await getApplyFundingByReferenceNumber(referenceNumber);
  if (!referenceData) throw new AppError("Funding application reference number not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`
  );
  const snapshot = await collectionRef.get();

  const bankProductIds = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      bankProductId: data.bankProductId,
      clientApplicationStatus: data.clientApplicationStatus,
    };
  });

  if (!bankProductIds) return null;

  const result: BankFormData[] = [];
  for (const bankProductId of bankProductIds) {
    const bankProduct = await getBankProduct(bankProductId.bankProductId);
    if (bankProduct) {
      result.push({
        ...bankProduct,
        clientApplicationStatus: bankProductId.clientApplicationStatus,
      });
    }
  }
  return result;
};

export const applyBankProduct = async (referenceNumber: string, bankProductId: string) => {
  if (!referenceNumber) throw new AppError("Reference number is required.");

  if (!bankProductId) throw new AppError("Bank product id is required.");
  const bankProduct = await getBankProduct(bankProductId);
  if (!bankProduct) throw new AppError("Bank product not found.");

  // only apply if bankProduct is approved for this funding application
  const approvedMappedFunds = await getApprovedMappedFunds(referenceNumber);
  if (!approvedMappedFunds) throw new AppError("Approved bank products not found.");

  const foundBankProduct = approvedMappedFunds.find((item) => item.id === bankProductId);
  if (!foundBankProduct) throw new AppError("This bank product is not approved.");

  logInfo("applyBankProduct", { referenceNumber, bankProductId });
};
