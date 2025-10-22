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
import {
  ApprovedBankFormData,
  BankFormData,
  ClientApplicationStatus,
} from "@/schema/bank-products";
import { getCurrentUser, getUserById } from "./user";
import { Timestamp } from "firebase-admin/firestore";

import { normalizeAllDates } from "@/lib/date-parser";
import {
  getApplyFundingByReferenceNumber,
  updateApplicationStatus,
} from "./apply-funding";

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

    // console.log("getBankProducts", result.length);

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

  const fundingApplication = await getApplyFundingByReferenceNumber(
    referenceNumber
  );
  if (!fundingApplication)
    throw new AppError("Funding application reference number not found.");

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

export const recordFundMappingAnalysisOld = async (
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
  // console.log(referenceNumber);
  const doc = await collectionRef.get();
  const bankProductIds = doc.docs.map((doc) => ({
    bank_products: doc.data().bank_products,
  }));
  // console.log("bankProductIds", JSON.stringify(bankProductIds));
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
  referenceNumber,
  bankProductId,
}: {
  userId: string;
  adminApprovedStatus?: AdminApprovedStatus;
  clientApplicationStatus?: ClientApplicationStatus[];
  referenceNumber?: string;
  bankProductId?: string;
}) => {
  const db = firestoreAdmin();

  let collectionGroupRef = db
    .collectionGroup(USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED)
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc");

  if (clientApplicationStatus) {
    collectionGroupRef = collectionGroupRef.where(
      "clientApplicationStatus",
      "in",
      clientApplicationStatus
    );
  }

  if (referenceNumber) {
    collectionGroupRef = collectionGroupRef.where(
      "referenceNumber",
      "==",
      referenceNumber
    );
  }

  if (bankProductId) {
    collectionGroupRef = collectionGroupRef.where(
      "bankProductId",
      "==",
      bankProductId
    );
  }

  const doc = await collectionGroupRef.get();

  const bankProductIds = doc.docs.map((d) => {
    return {
      id: d.id,
      ...normalizeAllDates(d.data()),
    };
  });

  if (!bankProductIds) return null;

  const result: ApprovedBankFormData[] = [];
  for (const bankProductId of bankProductIds) {
    const bankProduct = await getBankProduct(bankProductId.bankProductId);
    if (bankProduct) {
      result.push({
        ...bankProduct,
        fundMappingApprovedId: bankProductId.id,
        clientApplicationStatus: bankProductId.clientApplicationStatus,
        adminApprovedStatus: bankProductId.adminApprovedStatus,
        referenceNumber: bankProductId.referenceNumber,
        approvedAmount: bankProductId.approvedAmount,
        approvedRemarks: bankProductId.approvedRemarks,
      });
    }
  }

  return result;
};

export const getFundMappingAnalysisDetailsOld = async ({
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

  const result: ApprovedBankFormData[] = [];
  for (const bankProductId of bankProductIds) {
    const bankProduct = await getBankProduct(bankProductId.id);
    if (bankProduct) {
      result.push({
        ...bankProduct,
        fundMappingApprovedId: bankProductId.id,
        clientApplicationStatus: bankProductId.clientApplicationStatus,
        adminApprovedStatus: bankProductId.adminApprovedStatus,
        referenceNumber: bankProductId.referenceNumber,
      });
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
      return {
        success: false,
        error: "warning",
        message: "Reference number is required.",
      };
    }
    logInfo("approveMappedFund", { referenceNumber });

    const fundingApplication = await getApplyFundingByReferenceNumber(
      referenceNumber
    );
    if (!fundingApplication) {
      return {
        success: false,
        error: "warning",
        message: "Funding application reference number not found.",
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
      userId: fundingApplication.userId,
      referenceNumber,
    });

    await updateApplicationStatus(referenceNumber, "Pre-Approved");

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

export const approveMappedFundOld = async (
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

export const getApprovedMappedFunds = async (
  referenceNumber: string
): Promise<GetBankFormDataResponse> => {
  try {
    // 1. Return an error object for invalid input instead of throwing
    if (!referenceNumber) {
      return {
        success: false,
        message: "Reference number is required.",
        error: "warning",
      };
    }
    const referenceData = await getApplyFundingByReferenceNumber(
      referenceNumber
    );
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
        id: doc.id,
        bankProductId: data.bankProductId as string,
        clientApplicationStatus: data.clientApplicationStatus,
        referenceNumber: data.referenceNumber as string,
        approvedAmount: data.approvedAmount as number,
        approvedRemarks: data.approvedRemarks as string,
      };
    });

    // 2. Fetch all bank products in parallel for better performance
    const bankProductPromises = bankProductInfo.map(async (info) => {
      const bankProduct = await getBankProduct(info.bankProductId);
      if (bankProduct) {
        return {
          ...bankProduct,
          clientApplicationStatus: info.clientApplicationStatus,
          fundMappingApprovedId: info.id,
          referenceNumber: info.referenceNumber,
          approvedAmount: info.approvedAmount,
          approvedRemarks: info.approvedRemarks,
        };
      }
      return null; // Return null if a specific bank product isn't found
    });

    const resolvedBankProducts = await Promise.all(bankProductPromises);

    // Filter out any nulls from products that might not have been found
    const result: ApprovedBankFormData[] = resolvedBankProducts.filter(
      (product) => product !== null
    );

    // 3. Return a successful response object with the data
    return { success: true, data: result };
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

export const getApprovedMappedFundsOld = async (referenceNumber: string) => {
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

export const applyApprovedMappedFund = async ({
  referenceNumber,
  fundMappingApprovedId,
}: {
  referenceNumber: string;
  fundMappingApprovedId: string;
}): Promise<CommonResponse> => {
  try {
    // 1. Return structured errors for invalid inputs
    if (!referenceNumber) {
      return {
        success: false,
        error: "warning",
        message: "Reference number is required.",
      };
    }
    // if (!bankProductId) {
    //   return {
    //     success: false,
    //     error: "warning",
    //     message: "Bank product id is required.",
    //   };
    // }
    // if (!userId) {
    //   return {
    //     success: false,
    //     error: "warning",
    //     message: "User id is required.",
    //   };
    // }
    if (!fundMappingApprovedId) {
      return {
        success: false,
        error: "warning",
        message: "Fund mapping approved id is required.",
      };
    }

    const db = firestoreAdmin();
    const collectionRef = db.collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`
    );

    await collectionRef
      .doc(fundMappingApprovedId)
      .set({ clientApplicationStatus: "Pending" }, { merge: true });

    // 4. Return a successful response
    return { success: true };
  } catch (error: any) {
    // 5. Catch any unexpected errors and return a generic error response
    console.error("Unexpected error in applyApprovedMappedFund:", error);
    return {
      success: false,
      error: "error",
      message:
        "An unexpected error occurred while applying for the bank product.",
    };
  }
};

export const approveAppliedBankProduct = async ({
  referenceNumber,
  fundMappingApprovedId,
  approvedAmount,
  approvedRemarks,
}: {
  referenceNumber: string;
  fundMappingApprovedId: string;
  approvedAmount: number;
  approvedRemarks?: string;
}): Promise<CommonResponse> => {
  try {
    // 1. Return structured errors for invalid inputs
    if (!referenceNumber) {
      return {
        success: false,
        error: "warning",
        message: "Reference number is required.",
      };
    }

    if (!fundMappingApprovedId) {
      return {
        success: false,
        error: "warning",
        message: "Fund mapping approved id is required.",
      };
    }

    const db = firestoreAdmin();
    const collectionRef = db.collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`
    );

    await collectionRef.doc(fundMappingApprovedId).set(
      {
        clientApplicationStatus: "Approved",
        approvedAmount,
        approvedRemarks,
      },
      { merge: true }
    );

    // 4. Return a successful response
    return { success: true };
  } catch (error: any) {
    // 5. Catch any unexpected errors and return a generic error response
    console.error("Unexpected error in approveAppliedBankProduct:", error);
    return {
      success: false,
      error: "error",
      message:
        "An unexpected error occurred while approving the application for the bank product.",
    };
  }
};

export const declineAppliedBankProduct = async ({
  referenceNumber,
  // bankProductId,
  // userId,
  fundMappingApprovedId,
}: {
  referenceNumber: string;
  // bankProductId: string;
  // userId: string;
  fundMappingApprovedId: string;
}): Promise<CommonResponse> => {
  try {
    // 1. Return structured errors for invalid inputs
    if (!referenceNumber) {
      return {
        success: false,
        error: "warning",
        message: "Reference number is required.",
      };
    }

    if (!fundMappingApprovedId) {
      return {
        success: false,
        error: "warning",
        message: "Fund mapping approved id is required.",
      };
    }

    const db = firestoreAdmin();
    const collectionRef = db.collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`
    );

    await collectionRef.doc(fundMappingApprovedId).set(
      {
        clientApplicationStatus: "Declined",
        approvedAmount: 0,
        approvedRemarks: "",
      },
      { merge: true }
    );

    // 4. Return a successful response
    return { success: true };
  } catch (error: any) {
    // 5. Catch any unexpected errors and return a generic error response
    console.error("Unexpected error in approveAppliedBankProduct:", error);
    return {
      success: false,
      error: "error",
      message:
        "An unexpected error occurred while approving the application for the bank product.",
    };
  }
};
