"use server";

import {
  BANK_PRODUCTS_COLLECTION,
  USER_FUNDING_APPLICATION,
  USER_FUNDING_APPLICATION_FUND_MAPPING,
  USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED,
  USER_FUNDING_APPLICATION_FUND_MAPPING_BANK_PRODUCTS,
} from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { logInfo } from "@/lib/logger";
import { BankFormData, ClientApplicationStatus } from "@/schema/bank-products";
import { getCurrentUser, getUserById } from "./user";
import { Timestamp } from "firebase-admin/firestore";

import { normalizeAllDates } from "@/lib/date-parser";
import { getApplyFundingByReferenceNumber } from "./apply-funding";

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

    const result = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as BankFormData)
    );

    console.log("getBankProducts", result.length);

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
  // referenceNumber: string,
  ids: { id: string }[]
) => {
  if (!userId) throw new AppError("User ID is required.");
  if (!ids || ids.length === 0)
    throw new AppError("Bank products is required.");

  logInfo("recordFundMappingAnalysis", { userId });

  const userData = await getUserById(userId);
  if (!userData) throw new AppError("User not found.");

  const db = firestoreAdmin();
  const parentRef = db
    .collection(USER_FUNDING_APPLICATION_FUND_MAPPING)
    .doc(userId);
  await parentRef.set(
    {
      userId,
      status: "New",
      createdAt: Timestamp.now(),
    },
    { merge: true }
  );

  const subCol = parentRef.collection(
    USER_FUNDING_APPLICATION_FUND_MAPPING_BANK_PRODUCTS
  );

  const CHUNK = 500;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    const batch = db.batch();

    for (const { id } of slice) {
      const docRef = subCol.doc(id);
      batch.set(
        docRef,
        {
          createdAt: Timestamp.now(),
          adminApprovedStatus: "Pending",
          clientApplicationStatus: "Not Applied",
        },
        { merge: true }
      );
    }

    await batch.commit();
  }
};

export const updateClientApplicationStatus = async ({
  userId,
  bankProductId,
  status,
}: {
  userId: string;
  bankProductId: string;
  status: ClientApplicationStatus;
}) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION_FUND_MAPPING}/${userId}/${USER_FUNDING_APPLICATION_FUND_MAPPING_BANK_PRODUCTS}`
  );

  const docRef = collectionRef.doc(bankProductId);
  const doc = await docRef.get();
  if (!doc.exists) throw new AppError("Bank product not found.");

  await docRef.update({ clientApplicationStatus: status });
};

// export const getFundMappingAnalysis = async () => {
//   const db = firestoreAdmin();
//   const collectionRef = db.collection(USER_FUNDING_APPLICATION_FUND_MAPPING);
//   const doc = await collectionRef.get();

//   const userIds = doc.docs.map((doc) => ({
//     id: doc.id,
//     ...normalizeAllDates(doc.data()),
//   }));

//   return userIds;
// };
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

export const getFundMappingAnalysisDetails = async ({
  userId,
  adminApprovedStatus,
  clientApplicationStatus,
}: {
  userId: string;
  adminApprovedStatus?: AdminApprovedStatus;
  clientApplicationStatus?: ClientApplicationStatus[];
}) => {
  const db = firestoreAdmin();
  let collectionRef = db
    .collection(
      `${USER_FUNDING_APPLICATION_FUND_MAPPING}/${userId}/${USER_FUNDING_APPLICATION_FUND_MAPPING_BANK_PRODUCTS}`
    )
    .orderBy("createdAt", "desc");
  if (adminApprovedStatus) {
    collectionRef = collectionRef.where(
      "adminApprovedStatus",
      "==",
      adminApprovedStatus
    );
  }
  if (clientApplicationStatus) {
    collectionRef = collectionRef.where(
      "clientApplicationStatus",
      "in",
      clientApplicationStatus
    );
  }

  const doc = await collectionRef.get();

  const bankProductIds = doc.docs.map((d) => {
    return {
      id: d.id,
      ...normalizeAllDates(d.data()),
    };
  });
  if (!bankProductIds) return null;

  const result: BankFormData[] = [];
  for (const bankProductId of bankProductIds) {
    const bankProduct = await getBankProduct(bankProductId.id);
    if (bankProduct) {
      result.push({
        ...bankProduct,
        clientApplicationStatus: bankProductId.clientApplicationStatus,
        adminApprovedStatus: bankProductId.adminApprovedStatus,
      });
    }
  }

  return result;
};

export const approveMappedFundOld = async ({
  userId,
  bankProductId,
}: {
  userId: string;
  bankProductId: string;
}): Promise<CommonResponse> => {
  try {
    if (!userId) {
      return {
        success: false,
        error: "warning",
        message: "User ID is required.",
      };
    }
    logInfo("approveMappedFund", { userId, bankProductId });

    const userData = await getUserById(userId);
    if (!userData) {
      return {
        success: false,
        error: "warning",
        message: "User not found.",
      };
    }

    const productData = await getBankProduct(bankProductId);
    if (!productData) {
      return {
        success: false,
        error: "warning",
        message: "Bank product not found.",
      };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "warning", message: "User not found." };
    }

    const db = firestoreAdmin();
    const subCollectionRef = db.collection(
      `${USER_FUNDING_APPLICATION_FUND_MAPPING}/${userId}/${USER_FUNDING_APPLICATION_FUND_MAPPING_BANK_PRODUCTS}`
    );

    let docRef = subCollectionRef.doc(bankProductId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return {
        success: false,
        error: "warning",
        message: "Bank product not found.",
      };
    }

    await docRef.set({ adminApprovedStatus: "Approved" }, { merge: true });

    const collectionRef = db.collection(
      `${USER_FUNDING_APPLICATION_FUND_MAPPING}`
    );
    docRef = collectionRef.doc(userId);
    await docRef.set({ status: "Pre-Approved" }, { merge: true });

    // TODO send email to Client

    return { success: true };
  } catch (error: any) {
    console.error("Error in approveMappedFund:", error);
    return {
      success: false,
      error: "error",
      message: "An unexpected error occurred.",
    };
  }
};

export const approveMappedFund = async (
  referenceNumber: string,
  bankProductId: string
) => {
  if (!referenceNumber) throw new AppError("Reference number is required.");

  logInfo("approveMappedFund", { referenceNumber });

  const fundingApplication = await getApplyFundingByReferenceNumber(
    referenceNumber
  );
  if (!fundingApplication)
    throw new AppError("Funding application reference number not found.");

  const productData = await getBankProduct(bankProductId);
  if (!productData) throw new AppError("Bank product not found.");

  const currentUser = await getCurrentUser();
  if (!currentUser) throw new AppError("User not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`
  );
  await collectionRef.add({
    bankProductId,
    createdAt: Timestamp.now(),
    approvedById: currentUser.uid,
  });

  // TODO send notification email
};

export const getApprovedMappedFundsOld = async ({
  userId,
}: {
  userId: string;
}): Promise<GetBankFormDataResponse> => {
  try {
    // 1. Return an error object for invalid input instead of throwing
    if (!userId) {
      return {
        success: false,
        message: "User ID is required.",
        error: "warning",
      };
    }
    const userData = await getUserById(userId);
    if (!userData) {
      return {
        success: false,
        error: "warning",
        message: "User not found.",
      };
    }

    const db = firestoreAdmin();
    const collectionRef = db.collection(
      `${USER_FUNDING_APPLICATION}/${userId}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`
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

export const getApprovedMappedFunds = async (referenceNumber: string) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`
  );
  const snapshot = await collectionRef.get();
  return snapshot.docs.map(
    (doc) =>
      ({ id: doc.id, ...normalizeAllDates(doc.data()) } as ApprovedMappedFund)
  );
};

export const applyBankProduct = async ({
  userId,
  bankProductId,
}: {
  userId: string;
  bankProductId: string;
}): Promise<CommonResponse> => {
  try {
    // 1. Return structured errors for invalid inputs
    if (!userId) {
      return {
        success: false,
        error: "warning",
        message: "User id is required.",
      };
    }
    if (!bankProductId) {
      return {
        success: false,
        error: "warning",
        message: "Bank product id is required.",
      };
    }

    const userData = await getUserById(userId);
    if (!userData) {
      return {
        success: false,
        error: "warning",
        message: "User not found.",
      };
    }

    // This assumes getBankProduct might still throw or return null on failure.
    // If it's also refactored, its response should be checked similarly to getApprovedMappedFunds.
    const bankProduct = await getBankProduct(bankProductId);
    if (!bankProduct) {
      return {
        success: false,
        error: "warning",
        message: "Bank product not found.",
      };
    }

    // 2. Correctly handle the response from getApprovedMappedFunds
    // const approvedFundsResponse = await getApprovedMappedFunds(referenceNumber);

    // Check if the call to get the funds failed
    // if (!approvedFundsResponse.success) {
    // Propagate the error message from the nested function call
    //   return { success: false, error: approvedFundsResponse.error };
    // }

    // 3. Perform business logic validation using the returned data
    // const approvedFunds = approvedFundsResponse.data;
    // const foundBankProduct = approvedFunds?.find((item) => item.id === bankProductId);

    const db = firestoreAdmin();
    const fundMappingBankProductsRef = db.collection(
      `${USER_FUNDING_APPLICATION_FUND_MAPPING}/${userId}/${USER_FUNDING_APPLICATION_FUND_MAPPING_BANK_PRODUCTS}`
    );

    const docRef = fundMappingBankProductsRef.doc(bankProductId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return {
        success: false,
        error: "warning",
        message: "Bank product not found.",
      };
    }

    const docData = doc.data();
    const adminApprovedStatus =
      docData?.adminApprovedStatus as AdminApprovedStatus;
    const clientApplicationStatus = docData?.clientApplicationStatus;

    if (adminApprovedStatus !== "Approved") {
      return {
        success: false,
        error: "warning",
        message: "This bank product is not approved for this application.",
      };
    } else if (clientApplicationStatus !== "Not Applied") {
      return {
        success: false,
        error: "warning",
        message: "This bank product is already applied for this application.",
      };
    }

    // On success, perform the intended action
    logInfo("applyBankProduct", { userId, bankProductId });

    await docRef.set({ clientApplicationStatus: "Pending" }, { merge: true });

    await fetch(`${process.env.n8n_HOST}/client-apply-bank-product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
      },
      body: JSON.stringify({
        userId: userId,
        bankProductId: bankProductId,
      }),
    });

    // 4. Return a successful response
    return { success: true };
  } catch (error: any) {
    // 5. Catch any unexpected errors and return a generic error response
    console.error("Unexpected error in applyBankProduct:", error);
    return {
      success: false,
      error: "error",
      message:
        "An unexpected error occurred while applying for the bank product.",
    };
  }
};
