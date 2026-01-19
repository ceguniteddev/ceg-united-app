"use server";

import {
  BANK_PRODUCTS_COLLECTION,
  USER_FUNDING_APPLICATION,
  USER_FUNDING_APPLICATION_FUND_MAPPING,
  USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED,
  USER_FUNDING_APPLICATION_FUND_MAPPING_BANK_PRODUCTS,
  BROKER_CLIENT_MAPPING,
  BROKER_COMMISSION,
  USER_COLLECTION,
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
import { createAsanaTaskForLender } from "@/lib/n8n";

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
      (doc) => ({ id: doc.id, ...doc.data() }) as BankFormData,
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
  await collectionRef.set(values);
};

export const recordFundMappingAnalysis = async (
  userId: string,
  referenceNumber: string,
  ids: { id: string }[],
  append: boolean = false,
) => {
  if (!userId) throw new AppError("User ID is required.");
  if (!referenceNumber) throw new AppError("Reference number is required.");
  if (!ids || ids.length === 0) throw new AppError("Analysis is required.");

  logInfo("recordFundMappingAnalysis", { userId, referenceNumber, append });

  const fundingApplication = await getApplyFundingByReferenceNumber({
    referenceNumber,
  });
  if (!fundingApplication)
    throw new AppError("Funding application reference number not found.");

  const userData = await getUserById(userId);
  if (!userData) throw new AppError("User not found.");

  // Get all bank products to validate IDs
  const bankProductsResponse = await getBankProducts();
  if (!bankProductsResponse.success || !bankProductsResponse.data) {
    throw new AppError("Failed to fetch bank products for validation.");
  }

  // Create a Set of valid bank product IDs
  const validBankProductIds = new Set(
    bankProductsResponse.data.map((product) => product.id),
  );

  // Filter ids to only include those that exist in BANK_PRODUCTS_COLLECTION
  const validIds = ids.filter((id) => validBankProductIds.has(id.id));
  // logInfo("recordFundMappingAnalysis - valid IDs", { validIds });

  // Log if some IDs were filtered out
  if (validIds.length < ids.length) {
    const invalidCount = ids.length - validIds.length;
    logInfo("recordFundMappingAnalysis - removed invalid IDs", {
      totalProvided: ids.length,
      validCount: validIds.length,
      invalidCount,
    });
  }

  // If no valid IDs remain, still proceed but with empty array
  if (validIds.length === 0) {
    logInfo("recordFundMappingAnalysis - no valid IDs found", {
      totalProvided: ids.length,
    });
    throw new AppError("No valid bank product IDs provided.");
  }

  const db = firestoreAdmin();
  const collectionRef = db
    .collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING}`,
    )
    .doc(referenceNumber);

  if (append) {
    logInfo("recordFundMappingAnalysis - append mode", { referenceNumber });
    // Get existing document
    const existingDoc = await collectionRef.get();
    let existingBankProducts: { id: string }[] = [];

    if (existingDoc.exists) {
      const data = existingDoc.data();
      existingBankProducts = data?.bank_products || [];
    }

    // Get existing IDs to avoid duplicates
    const existingIds = new Set(existingBankProducts.map((p) => p.id));

    // Filter out duplicates from new valid IDs
    const newIds = validIds.filter((id) => !existingIds.has(id.id));

    // Combine existing and new bank products
    const combinedBankProducts = [...existingBankProducts, ...newIds];

    // logInfo("recordFundMappingAnalysis - saving to database (append)", {
    //   totalProducts: combinedBankProducts.length,
    //   newProducts: newIds.length,
    //   existingProducts: existingBankProducts.length,
    // });

    await collectionRef.set({
      bank_products: combinedBankProducts,
      userId,
      createdAt: existingDoc.exists
        ? existingDoc.data()?.createdAt
        : Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    logInfo("recordFundMappingAnalysis - saved successfully (append)");
  } else {
    // Replace mode (original behavior) - use validIds instead of ids
    logInfo("recordFundMappingAnalysis - replace mode", {
      referenceNumber,
      productsCount: validIds.length,
    });

    const dataToSave = {
      bank_products: validIds,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // logInfo("recordFundMappingAnalysis - data to save", {
    //   collectionPath: `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING}`,
    //   docId: referenceNumber,
    //   dataToSave,
    // });

    try {
      await collectionRef.set(dataToSave);
      logInfo("recordFundMappingAnalysis - saved successfully");
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      throw new AppError(`Failed to save fund mapping: ${error}`);
    }
  }
};

export const recordFundMappingAnalysisOld = async (
  userId: string,
  // referenceNumber: string,
  ids: { id: string }[],
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
    { merge: true },
  );

  const subCol = parentRef.collection(
    USER_FUNDING_APPLICATION_FUND_MAPPING_BANK_PRODUCTS,
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
        { merge: true },
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
    `${USER_FUNDING_APPLICATION_FUND_MAPPING}/${userId}/${USER_FUNDING_APPLICATION_FUND_MAPPING_BANK_PRODUCTS}`,
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
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING}`,
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

export const deleteFundMappingAnalysis = async (
  referenceNumber: string,
  docId: string,
) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING}`,
  );
  await collectionRef.doc(docId).delete();
};

export const removeBankProductFromMapping = async (
  referenceNumber: string,
  bankProductId: string,
) => {
  if (!referenceNumber) throw new AppError("Reference number is required.");
  if (!bankProductId) throw new AppError("Bank product ID is required.");

  const db = firestoreAdmin();
  const docRef = db
    .collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING}`,
    )
    .doc(referenceNumber);

  const doc = await docRef.get();
  if (!doc.exists) {
    throw new AppError("Fund mapping document not found.");
  }

  const data = doc.data();
  const bankProducts = (data?.bank_products || []) as { id: string }[];

  // Filter out the bank product to remove
  const updatedBankProducts = bankProducts.filter(
    (product) => product.id !== bankProductId,
  );

  // Update the document with the filtered array
  await docRef.update({
    bank_products: updatedBankProducts,
    updatedAt: Timestamp.now(),
  });
};

export const getFundMappingAnalysisDetails = async ({
  userId,
  clientApplicationStatus,
  referenceNumber,
  bankProductId,
}: {
  userId?: string;
  clientApplicationStatus?: ClientApplicationStatus[];
  referenceNumber?: string;
  bankProductId?: string;
}) => {
  const db = firestoreAdmin();

  let collectionGroupRef = db
    .collectionGroup(USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED)
    // .where("userId", "==", userId)
    .orderBy("createdAt", "desc");
  if (userId) {
    collectionGroupRef = collectionGroupRef.where("userId", "==", userId);
  }

  if (clientApplicationStatus && clientApplicationStatus.length > 0) {
    collectionGroupRef = collectionGroupRef.where(
      "clientApplicationStatus",
      "in",
      clientApplicationStatus,
    );
  }

  if (referenceNumber) {
    collectionGroupRef = collectionGroupRef.where(
      "referenceNumber",
      "==",
      referenceNumber,
    );
  }

  if (bankProductId) {
    collectionGroupRef = collectionGroupRef.where(
      "bankProductId",
      "==",
      bankProductId,
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
    // Check if this is a manual entry or has a valid bankProductId
    if (bankProductId.isManualEntry || !bankProductId.bankProductId) {
      // For manual entries, construct a valid ApprovedBankFormData object
      result.push({
        id: bankProductId.id,
        bankName: bankProductId.manualBankName || "",
        fundMappingApprovedId: bankProductId.id,
        clientApplicationStatus: bankProductId.clientApplicationStatus,
        adminApprovedStatus: bankProductId.adminApprovedStatus,
        referenceNumber: bankProductId.referenceNumber || "",
        approvedAmount: bankProductId.approvedAmount || 0,
        approvedRemarks: bankProductId.approvedRemarks || "",
        fundedAmount: bankProductId.fundedAmount || 0,
        fundedRemarks: bankProductId.fundedRemarks || "",
        userId: bankProductId.userId,
        underwritingNotes: bankProductId.approvedRemarks || "",
        products: [
          {
            productName: bankProductId.manualProductName || "Manual Entry",
            category: "Manual",
            financingTerm: "",
            doubleDipAllowed: "No",
            creditBureauPulled: [],
            minimumFicoScore: 0,
            maximumFundingAmount: bankProductId.approvedAmount || 0,
            averageApprovalAmount: 0,
            grossFundingPercentage: 0,
            maximumInquiriesAllowed: 0,
            minimumNumberOfAccountsOnCredit: 0,
            minimumCreditAgeRequired: "",
            personalVerifiableIncomeRequired: "No",
            noDocumentationRequired: "No",
            businessBankStatementsRequired: "No",
            profitAndLossStatementRequired: "No",
            balanceSheetRequired: "No",
            businessPlanRequired: "No",
            membershipRequiredBeforeApplicationRequired: "No",
            membershipRequiredUponApprovalRequired: "No",
            accountOpeningBeforeApplicationRequired: "No",
            accountOpeningAfterApprovalRequired: "No",
            businessTaxesRequired: "None",
            personalTaxesRequired: "None",
            immigrationStatusRequirement: "",
            stateAvailability: [],
            applicationMethod: [],
            allowsForwardingViaEmail: "No",
            canBeFinalizedOnline: "No",
            clientNeedsToGoToBranch: "No",
          },
        ],
      } as ApprovedBankFormData);
    } else {
      // For regular entries, fetch from bank products collection
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
          fundedAmount: bankProductId.fundedAmount,
          fundedRemarks: bankProductId.fundedRemarks,
          userId: bankProductId.userId,
        });
      }
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
      `${USER_FUNDING_APPLICATION_FUND_MAPPING}/${userId}/${USER_FUNDING_APPLICATION_FUND_MAPPING_BANK_PRODUCTS}`,
    )
    .orderBy("createdAt", "desc");
  if (adminApprovedStatus) {
    collectionRef = collectionRef.where(
      "adminApprovedStatus",
      "==",
      adminApprovedStatus,
    );
  }
  if (clientApplicationStatus) {
    collectionRef = collectionRef.where(
      "clientApplicationStatus",
      "in",
      clientApplicationStatus,
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
        userId: bankProductId.userId,
      });
    }
  }

  return result;
};

export const approveMappedFund = async ({
  referenceNumber,
  bankProductId,
}: {
  referenceNumber: string;
  bankProductId: string;
}): Promise<CommonResponse> => {
  try {
    if (!referenceNumber) {
      return {
        success: false,
        error: "warning",
        message: "Reference number is required.",
      };
    }
    logInfo("approveMappedFund", { referenceNumber });

    const fundingApplication = await getApplyFundingByReferenceNumber({
      referenceNumber,
    });
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
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
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

export const cancelMappedFund = async ({
  referenceNumber,
  fundMappingApprovedId,
}: {
  referenceNumber: string;
  fundMappingApprovedId: string;
}): Promise<CommonResponse> => {
  try {
    if (!fundMappingApprovedId) {
      return {
        success: false,
        error: "warning",
        message: "Fund mapping approved id is required.",
      };
    }
    if (!referenceNumber) {
      return {
        success: false,
        error: "warning",
        message: "Reference number is required.",
      };
    }
    logInfo("cancelMappedFund", { referenceNumber });

    const fundingApplication = await getApplyFundingByReferenceNumber({
      referenceNumber,
    });
    if (!fundingApplication) {
      return {
        success: false,
        error: "warning",
        message: "Funding application reference number not found.",
      };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "warning", message: "User not found." };
    }

    const db = firestoreAdmin();
    const collectionRef = db.collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
    );
    const docRef = collectionRef.doc(fundMappingApprovedId);
    const snapshot = await docRef.get();
    if (snapshot.exists) {
      await docRef.delete();
      await updateApplicationStatus(referenceNumber, "Processing");
    }

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
  bankProductId: string,
) => {
  if (!referenceNumber) throw new AppError("Reference number is required.");

  logInfo("approveMappedFund", { referenceNumber });

  const fundingApplication = await getApplyFundingByReferenceNumber({
    referenceNumber,
  });
  if (!fundingApplication)
    throw new AppError("Funding application reference number not found.");

  const productData = await getBankProduct(bankProductId);
  if (!productData) throw new AppError("Bank product not found.");

  const currentUser = await getCurrentUser();
  if (!currentUser) throw new AppError("User not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
  );
  await collectionRef.add({
    bankProductId,
    createdAt: Timestamp.now(),
    approvedById: currentUser.uid,
  });

  // TODO send notification email
};

export const getApprovedMappedFunds = async (
  referenceNumber: string,
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
    const referenceData = await getApplyFundingByReferenceNumber({
      referenceNumber,
    });
    if (!referenceData) {
      return {
        success: false,
        message: "Funding application reference number not found.",
        error: "warning",
      };
    }

    const db = firestoreAdmin();
    const collectionRef = db.collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
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
          userId: referenceData.userId!,
        };
      }
      return null; // Return null if a specific bank product isn't found
    });

    const resolvedBankProducts = await Promise.all(bankProductPromises);

    // Filter out any nulls from products that might not have been found
    const result: ApprovedBankFormData[] = resolvedBankProducts.filter(
      (product) => product !== null,
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
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
  );
  const snapshot = await collectionRef.get();
  return snapshot.docs.map(
    (doc) =>
      ({ id: doc.id, ...normalizeAllDates(doc.data()) }) as ApprovedMappedFund,
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
      `${USER_FUNDING_APPLICATION_FUND_MAPPING}/${userId}/${USER_FUNDING_APPLICATION_FUND_MAPPING_BANK_PRODUCTS}`,
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

    await fetch(`${process.env.n8n_HOST}/${await createAsanaTaskForLender()}`, {
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

    if (!fundMappingApprovedId) {
      return {
        success: false,
        error: "warning",
        message: "Fund mapping approved id is required.",
      };
    }

    const db = firestoreAdmin();
    const collectionRef = db.collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
    );

    const docRef = collectionRef.doc(fundMappingApprovedId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return {
        success: false,
        error: "warning",
        message: "Fund mapping approved not found.",
      };
    }

    const docData = doc.data();

    const userData = await getUserById(docData?.userId);
    if (!userData) {
      return {
        success: false,
        error: "warning",
        message: "User not found.",
      };
    }

    await collectionRef
      .doc(fundMappingApprovedId)
      .set({ clientApplicationStatus: "Sent to Lender" }, { merge: true });

    await fetch(`${process.env.n8n_HOST}/${await createAsanaTaskForLender()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
      },
      body: JSON.stringify({
        userId: docData?.userId,
        bankProductId: docData?.bankProductId,
        referenceNumber: referenceNumber,
      }),
    });

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
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
    );

    await collectionRef.doc(fundMappingApprovedId).set(
      {
        clientApplicationStatus: "Approved",
        approvedAmount,
        approvedRemarks,
      },
      { merge: true },
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

export const fundedAppliedBankProduct = async ({
  referenceNumber,
  fundMappingApprovedId,
  fundedAmount,
  fundedRemarks,
  userId,
  bankName,
}: {
  referenceNumber: string;
  fundMappingApprovedId: string;
  fundedAmount: number;
  fundedRemarks?: string;
  userId: string;
  bankName: string;
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
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
    );

    // Update funding status
    await collectionRef.doc(fundMappingApprovedId).set(
      {
        clientApplicationStatus: "Funded",
        fundedAmount,
        fundedRemarks,
      },
      { merge: true },
    );

    // Calculate and create commission record for broker
    try {
      // Find broker-client mapping
      const brokerMappingSnapshot = await db
        .collection(BROKER_CLIENT_MAPPING)
        .where("clientId", "==", userId)
        .limit(1)
        .get();

      if (!brokerMappingSnapshot.empty) {
        const mapping = brokerMappingSnapshot.docs[0].data();
        const brokerId = mapping.brokerId;

        // Get broker's commission rate
        const brokerDoc = await db
          .collection(USER_COLLECTION)
          .doc(brokerId)
          .get();

        if (brokerDoc.exists) {
          const brokerData = brokerDoc.data();
          const commissionRate = brokerData?.commissionRate ?? 10; // Default 10% if not set

          // Calculate commission
          const commissionAmount = (fundedAmount * commissionRate) / 100;

          // Get client name
          const clientDoc = await db
            .collection(USER_COLLECTION)
            .doc(userId)
            .get();
          const clientName = clientDoc.exists
            ? `${clientDoc.data()?.firstName || ""} ${
                clientDoc.data()?.lastName || ""
              }`.trim()
            : "Unknown Client";

          // Create commission record
          await db.collection(BROKER_COMMISSION).add({
            brokerId,
            clientId: userId,
            clientName,
            fundingApplicationId: referenceNumber,
            fundMappingApprovedId,
            bankName,
            fundedAmount,
            commissionRate,
            commissionAmount,
            status: "Pending",
            createdAt: new Date(),
          });

          console.log(
            `Commission created: ${commissionAmount} (${commissionRate}% of ${fundedAmount}) for broker ${brokerId}`,
          );
        }
      }
    } catch (commissionError) {
      // Log commission error but don't fail the funding operation
      console.error("Error creating commission record:", commissionError);
    }

    // 4. Return a successful response
    return { success: true };
  } catch (error: any) {
    // 5. Catch any unexpected errors and return a generic error response
    console.error("Unexpected error in fundedAppliedBankProduct:", error);
    return {
      success: false,
      error: "error",
      message:
        "An unexpected error occurred while funding the application for the bank product.",
    };
  }
};

export const declineAppliedBankProduct = async ({
  referenceNumber,
  // bankProductId,
  // userId,
  fundMappingApprovedId,
  declineReason,
}: {
  referenceNumber: string;
  // bankProductId: string;
  // userId: string;
  fundMappingApprovedId: string;
  declineReason: string;
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

    if (!declineReason) {
      return {
        success: false,
        error: "warning",
        message: "Decline reason is required.",
      };
    }

    const db = firestoreAdmin();
    const collectionRef = db.collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
    );

    await collectionRef.doc(fundMappingApprovedId).set(
      {
        clientApplicationStatus: "Declined",
        approvedAmount: 0,
        approvedRemarks: "",
        declineReason,
      },
      { merge: true },
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

export const manuallyAddFundedBankProduct = async ({
  userId,
  bankProductId,
  fundedAmount,
  fundedRemarks,
  bankName,
  productName,
}: {
  userId: string;
  bankProductId?: string;
  fundedAmount: number;
  fundedRemarks?: string;
  bankName: string;
  productName?: string;
}): Promise<CommonResponse> => {
  try {
    if (!userId) {
      return {
        success: false,
        error: "warning",
        message: "User ID is required.",
      };
    }

    if (!fundedAmount || fundedAmount <= 0) {
      return {
        success: false,
        error: "warning",
        message: "Funded amount must be greater than 0.",
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

    // Only validate bank product if ID is provided
    if (bankProductId) {
      const bankProduct = await getBankProduct(bankProductId);
      if (!bankProduct) {
        return {
          success: false,
          error: "warning",
          message: "Bank product not found.",
        };
      }
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "warning",
        message: "Current user not found.",
      };
    }

    const db = firestoreAdmin();

    // Create a manual funded entry in a dedicated collection
    const manualFundedRef = db.collection(
      `${USER_FUNDING_APPLICATION}/${userId}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
    );

    await manualFundedRef.add({
      bankProductId: bankProductId || "",
      userId,
      clientApplicationStatus: "Funded",
      fundedAmount,
      fundedRemarks: fundedRemarks || "",
      fundedAt: Timestamp.now(),
      fundedById: currentUser.uid,
      isManualEntry: true,
      manualBankName: bankName, // Store manually entered bank name
      manualProductName: productName || "", // Store manually entered product name
      referenceNumber: "", // No reference number for manual entries
      createdAt: Timestamp.now(),
    });

    // Create commission record for broker if client has one
    const brokerMappingSnapshot = await db
      .collection(BROKER_CLIENT_MAPPING)
      .where("clientId", "==", userId)
      .where("status", "==", "Active")
      .limit(1)
      .get();

    if (!brokerMappingSnapshot.empty) {
      const brokerMapping = brokerMappingSnapshot.docs[0].data();
      const brokerId = brokerMapping.brokerId;

      // Fetch broker to get commission rate
      const brokerDoc = await db
        .collection(USER_COLLECTION)
        .doc(brokerId)
        .get();
      if (brokerDoc.exists) {
        const brokerData = brokerDoc.data();
        const commissionRate = brokerData?.commissionRate || 10;
        const commissionAmount = (fundedAmount * commissionRate) / 100;

        await db.collection(BROKER_COMMISSION).add({
          brokerId,
          clientId: userId,
          clientName: `${userData.firstName || ""} ${
            userData.lastName || ""
          }`.trim(),
          fundingApplicationId: "", // No funding application for manual entries
          fundMappingApprovedId: "", // Will be updated if needed
          bankName: bankName,
          fundedAmount,
          commissionRate,
          commissionAmount,
          status: "Pending",
          createdAt: Timestamp.now(),
          notes: `Manual entry - ${fundedRemarks || "No remarks"}`,
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Unexpected error in manuallyAddFundedBankProduct:", error);
    return {
      success: false,
      error: "error",
      message: "An unexpected error occurred while adding funded bank product.",
    };
  }
};
