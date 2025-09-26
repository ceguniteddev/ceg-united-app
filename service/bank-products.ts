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

export const recordBankProduct = async (value: BankFormData) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(BANK_PRODUCTS_COLLECTION);
  await collectionRef.add(value);
};

export const getBankProducts = async (): Promise<GetBankFormDataResponse> => {
  try {
    const db = firestoreAdmin();
    const collectionRef = db.collection(BANK_PRODUCTS_COLLECTION);
    const snapshot = await collectionRef.orderBy("bankName", "asc").get();

    if (snapshot.empty) {
      return {
        success: true,
        data: [],
      };
    }

    const result = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BankFormData));

    return { success: true, data: result };
  } catch (error) {
    console.error("Unexpected error in getBankProducts:", error);
    return {
      success: false,
      error: "error",
      message: "An unexpected error occurred while fetching approved funds.",
    };
  }
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

export const approveMappedFund = async (
  referenceNumber: string,
  bankProductId: string
): Promise<CommonResponse> => {
  try {
    if (!referenceNumber) {
      return { success: false, error: "warning", message: "Reference number is required." };
    }
    logInfo("approveMappedFund", { referenceNumber });

    const fundingApplication = await getApplyFundingByReferenceNumber(referenceNumber);
    if (!fundingApplication) {
      return {
        success: false,
        error: "warning",
        message: "Funding application reference number not found.",
      };
    }

    const productData = await getBankProduct(bankProductId);
    if (!productData) {
      return { success: false, error: "warning", message: "Bank product not found." };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "warning", message: "User not found." };
    }

    // check if already approved
    const approvedFunds = await getApprovedMappedFunds(referenceNumber);
    if (approvedFunds?.data?.find((f) => f.id === bankProductId)) {
      return {
        success: false,
        error: "warning",
        message: "This bank product is already approved.",
      };
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

    // TODO send email to Client

    return { success: true };
  } catch (error: any) {
    console.error("Error in approveMappedFund:", error);
    return { success: false, error: "error", message: "An unexpected error occurred." };
  }
};

export const getApprovedMappedFunds = async (
  referenceNumber: string
): Promise<GetBankFormDataResponse> => {
  try {
    // 1. Return an error object for invalid input instead of throwing
    if (!referenceNumber) {
      return { success: false, message: "Reference number is required.", error: "warning" };
    }
    const referenceData = await getApplyFundingByReferenceNumber(referenceNumber);
    if (!referenceData) {
      return {
        success: false,
        message: "Funding application reference number not found.",
        error: "warning",
      };
    }

    const db = firestoreAdmin();
    const collectionRef = db.collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`
    );
    const snapshot = await collectionRef.get();

    // Handle case where no approved funds exist
    if (snapshot.empty) {
      return { success: true, data: [] };
    }

    const bankProductInfo = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        bankProductId: data.bankProductId as string,
        clientApplicationStatus: data.clientApplicationStatus as string,
      };
    });

    // 2. Fetch all bank products in parallel for better performance
    const bankProductPromises = bankProductInfo.map(async (info) => {
      const bankProduct = await getBankProduct(info.bankProductId);
      if (bankProduct) {
        return {
          ...bankProduct,
          clientApplicationStatus: info.clientApplicationStatus,
        };
      }
      return null; // Return null if a specific bank product isn't found
    });

    const resolvedBankProducts = await Promise.all(bankProductPromises);

    // Filter out any nulls from products that might not have been found
    const result = resolvedBankProducts.filter((product) => product !== null);

    // 3. Return a successful response object with the data
    return { success: true, data: result as BankFormData[] };
  } catch (error: any) {
    // 4. Catch any unexpected errors and return a generic error response
    console.error("Unexpected error in getApprovedMappedFunds:", error);
    return {
      success: false,
      message: "An unexpected error occurred while fetching approved funds.",
      error: "error",
    };
  }
};

export const applyBankProduct = async (
  referenceNumber: string,
  bankProductId: string
): Promise<CommonResponse> => {
  try {
    // 1. Return structured errors for invalid inputs
    if (!referenceNumber) {
      return { success: false, error: "warning", message: "Reference number is required." };
    }
    if (!bankProductId) {
      return { success: false, error: "warning", message: "Bank product id is required." };
    }

    // This assumes getBankProduct might still throw or return null on failure.
    // If it's also refactored, its response should be checked similarly to getApprovedMappedFunds.
    const bankProduct = await getBankProduct(bankProductId);
    if (!bankProduct) {
      return { success: false, error: "warning", message: "Bank product not found." };
    }

    // 2. Correctly handle the response from getApprovedMappedFunds
    const approvedFundsResponse = await getApprovedMappedFunds(referenceNumber);

    // Check if the call to get the funds failed
    if (!approvedFundsResponse.success) {
      // Propagate the error message from the nested function call
      return { success: false, error: approvedFundsResponse.error };
    }

    // 3. Perform business logic validation using the returned data
    const approvedFunds = approvedFundsResponse.data;
    const foundBankProduct = approvedFunds?.find((item) => item.id === bankProductId);

    if (!foundBankProduct) {
      return {
        success: false,
        error: "warning",
        message: "This bank product is not approved for this application.",
      };
    } else if (foundBankProduct.clientApplicationStatus !== "Not Applied") {
      return {
        success: false,
        error: "warning",
        message: "This bank product is already applied for this application.",
      };
    }

    // On success, perform the intended action
    logInfo("applyBankProduct", { referenceNumber, bankProductId });

    const db = firestoreAdmin();
    const collectionRef = db.collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`
    );

    const snapshot = await collectionRef.where("bankProductId", "==", bankProductId).limit(1).get();

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;

      await docRef.update({
        clientApplicationStatus: "Pending",
      });
    }

    // 4. Return a successful response
    return { success: true };
  } catch (error: any) {
    // 5. Catch any unexpected errors and return a generic error response
    console.error("Unexpected error in applyBankProduct:", error);
    return {
      success: false,
      error: "error",
      message: "An unexpected error occurred while applying for the bank product.",
    };
  }
};
