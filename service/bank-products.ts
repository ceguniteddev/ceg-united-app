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
  PSF_INVOICES_COLLECTION,
} from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { logInfo } from "@/lib/logger";
import {
  ApprovedBankFormData,
  BankFormData,
  BankProductCriteria,
  ClientApplicationStatus,
  ClientApplicationMethod,
} from "@/schema/bank-products";
import { getCurrentUser, getUserById } from "./user";
import { getBanks } from "./bank-management";
import { Timestamp } from "firebase-admin/firestore";
import { headers } from "next/headers";

import { normalizeAllDates } from "@/lib/date-parser";
import {
  getApplyFundingByReferenceNumber,
  updateApplicationStatus,
} from "./apply-funding";
import { ApplyFunding } from "@/schema/apply-funding";
// import { createAsanaTaskForLender } from "@/lib/n8n";
import NotFoundError from "@/error/NotFoundError";
import { createAsanaCustomerServiceTask } from "./n8n";
import { getCRSReport, getCRSBusinessProfile } from "@/service/crs";
import { saveFeeAgreementToPDF } from "@/service/fee-agreement-pdf";

// Cache for bank websites (5 minute TTL)
let banksCache: Awaited<ReturnType<typeof getBanks>> | null = null;
let banksCacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Helper function to get bank website URL by bank name
 * Uses cached bank data with 5-minute TTL for performance
 */
async function getBankWebsite(bankName: string): Promise<string | undefined> {
  const now = Date.now();

  // Refresh cache if expired or not yet loaded
  if (!banksCache || now - banksCacheTime > CACHE_TTL) {
    banksCache = await getBanks();
    banksCacheTime = now;
  }

  // Case-insensitive lookup
  const bank = banksCache.find(
    (b) => b.bankName.toLowerCase() === bankName.toLowerCase(),
  );

  return bank?.website;
}

/**
 * Calculate approval odds (0-100%) based on how well client meets bank requirements
 * Factors in:
 * - Credit score strength (30%)
 * - Income/revenue strength (25%)
 * - Credit history quality (25%)
 * - Requirement matching (20%)
 */
async function calculateApprovalOdds(
  userId: string,
  clientData: ApplyFunding,
  productCriteria: BankProductCriteria,
): Promise<number> {
  let totalScore = 0;

  // === 1. CREDIT SCORE STRENGTH (0-30 points) ===
  const minFico = productCriteria.minimumFicoScore || 0;
  const clientFico = await estimateClientCreditScore(userId, clientData);
  // console.log(
  //   `[Approval Odds] Client FICO: ${clientFico}, Minimum Required: ${minFico}`,
  // );
  if (minFico > 0 && clientFico > 0) {
    if (clientFico >= minFico + 100) {
      totalScore += 30; // Excellent - 100+ above minimum
    } else if (clientFico >= minFico + 50) {
      totalScore += 25; // Strong - 50-99 above minimum
    } else if (clientFico >= minFico + 20) {
      totalScore += 20; // Good - 20-49 above minimum
    } else if (clientFico >= minFico) {
      totalScore += 15; // Meets minimum
    } else if (clientFico >= minFico - 20) {
      totalScore += 10; // Close - within 20 points
    } else {
      totalScore += 5; // Below minimum
    }
  } else {
    totalScore += 20; // No requirement or no data - average score
  }

  // === 2. INCOME/REVENUE STRENGTH (0-25 points) ===
  const clientRevenue =
    clientData.annualBusinessRevenue ||
    clientData.businessGrossProjectedRevenue1 ||
    (clientData.employmentPayPerMonth || 0) * 12 ||
    0;

  // Score based on absolute revenue levels
  if (clientRevenue >= 500000) {
    totalScore += 25; // $500K+ annual revenue
  } else if (clientRevenue >= 250000) {
    totalScore += 22; // $250K-$500K
  } else if (clientRevenue >= 100000) {
    totalScore += 18; // $100K-$250K
  } else if (clientRevenue >= 50000) {
    totalScore += 15; // $50K-$100K
  } else if (clientRevenue >= 25000) {
    totalScore += 10; // $25K-$50K
  } else if (clientRevenue > 0) {
    totalScore += 5; // Some revenue reported
  } else {
    totalScore += 12; // No data - neutral score
  }

  // === 3. CREDIT HISTORY STRENGTH (0-25 points) ===
  let historyScore = 0;

  // Time in business - absolute scoring
  if (clientData.dateOfIncorporation) {
    const businessAgeMonths =
      (Date.now() - new Date(clientData.dateOfIncorporation).getTime()) /
      (1000 * 60 * 60 * 24 * 30);

    if (businessAgeMonths >= 36) {
      historyScore += 12; // 3+ years in business
    } else if (businessAgeMonths >= 24) {
      historyScore += 10; // 2-3 years
    } else if (businessAgeMonths >= 12) {
      historyScore += 7; // 1-2 years
    } else if (businessAgeMonths >= 6) {
      historyScore += 5; // 6-12 months
    } else {
      historyScore += 3; // Less than 6 months
    }
  } else {
    historyScore += 8; // No data, average score
  }

  // Employment stability
  if (clientData.employmentDateOfHire) {
    const employmentMonths =
      (Date.now() - new Date(clientData.employmentDateOfHire).getTime()) /
      (1000 * 60 * 60 * 24 * 30);

    if (employmentMonths >= 36)
      historyScore += 8; // 3+ years
    else if (employmentMonths >= 24)
      historyScore += 7; // 2-3 years
    else if (employmentMonths >= 12)
      historyScore += 5; // 1-2 years
    else historyScore += 3; // Less than 1 year
  } else {
    historyScore += 5; // No data, average score
  }

  // Address stability
  if (clientData.moveInCurrentAddress) {
    const addressMonths =
      (Date.now() - new Date(clientData.moveInCurrentAddress).getTime()) /
      (1000 * 60 * 60 * 24 * 30);

    if (addressMonths >= 24)
      historyScore += 5; // 2+ years at address
    else if (addressMonths >= 12)
      historyScore += 4; // 1-2 years
    else historyScore += 2; // Less than 1 year
  } else {
    historyScore += 3; // No data, average score
  }

  totalScore += Math.min(historyScore, 25);

  // === 4. REQUIREMENT MATCHING (0-20 points) ===
  let requirementsMet = 0;
  let totalRequirements = 0;

  // State availability
  if (
    productCriteria.stateAvailability &&
    productCriteria.stateAvailability.length > 0
  ) {
    totalRequirements++;
    if (
      clientData.addressState &&
      productCriteria.stateAvailability.includes(clientData.addressState)
    ) {
      requirementsMet++;
    }
  }

  // Business documents
  if (productCriteria.businessBankStatementsRequired === "Yes") {
    totalRequirements++;
    if (
      clientData.annualBusinessRevenue ||
      clientData.businessGrossProjectedRevenue1
    ) {
      requirementsMet++;
    }
  }

  // Personal taxes
  if (
    productCriteria.personalTaxesRequired &&
    productCriteria.personalTaxesRequired !== "None"
  ) {
    totalRequirements++;
    if (clientData.personalTaxes1 || clientData.personalTaxesStatus) {
      requirementsMet++;
    }
  }

  // Business taxes
  if (
    productCriteria.businessTaxesRequired &&
    productCriteria.businessTaxesRequired !== "None"
  ) {
    totalRequirements++;
    if (
      clientData.businessFiledWithIRS1 ||
      clientData.businessProjectedProfit1
    ) {
      requirementsMet++;
    }
  }

  // Verifiable income
  if (productCriteria.personalVerifiableIncomeRequired === "Yes") {
    totalRequirements++;
    if (
      clientData.employmentPayPerMonth ||
      clientData.annualBusinessRevenue ||
      clientData.howDoYouGetPaid
    ) {
      requirementsMet++;
    }
  }

  // Calculate requirement matching score
  if (totalRequirements > 0) {
    const matchPercentage = requirementsMet / totalRequirements;
    totalScore += Math.round(matchPercentage * 20);
  } else {
    totalScore += 15; // No specific requirements, give average score
  }

  return Math.min(Math.round(totalScore), 98);
}

/**
 * Get client credit score from CRS reports or estimate if not available
 * Fetches actual credit scores from Experian, Equifax, and TransUnion reports
 * Falls back to estimation if no credit reports exist
 */
async function estimateClientCreditScore(
  userId: string,
  clientData: ApplyFunding,
): Promise<number> {
  try {
    // Fetch actual credit reports - gets LATEST from EACH bureau (Equifax, Experian, TransUnion)
    // Note: Users can select which bureaus to generate, so we may have 1, 2, or 3 bureau reports
    const crsReports = await getCRSReport(userId, true); // isLatest = true per bureau

    if (crsReports && crsReports.length > 0) {
      // Extract credit scores from all available bureaus
      const bureauScores: { bureau: string; score: number }[] = [];

      for (const report of crsReports) {
        const bureauName = report.type || report.id; // Bureau name (equifax/experian/transunion)
        const scoreValue = report.report?.scores?.[0]?.scoreValue;

        if (scoreValue) {
          const numericScore = Number(scoreValue);
          if (!isNaN(numericScore) && numericScore > 0) {
            bureauScores.push({ bureau: bureauName, score: numericScore });
          }
        }
      }

      // If we have actual credit scores from any bureau, calculate median
      if (bureauScores.length > 0) {
        // Log which bureaus provided scores for debugging
        // console.log(
        //   `[Credit Score] Found ${bureauScores.length} bureau(s):`,
        //   bureauScores.map((b) => `${b.bureau}=${b.score}`).join(", "),
        // );

        // Sort scores and calculate median (most stable measure)
        const scores = bureauScores.map((b) => b.score).sort((a, b) => a - b);
        const median =
          scores.length % 2 === 0
            ? Math.round(
                (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2,
              )
            : scores[Math.floor(scores.length / 2)];

        // console.log(
        //   `[Credit Score] Using median score: ${median} from ${scores.join(", ")}`,
        // );
        return median;
      } else {
        console.log("[Credit Score] No valid scores found in CRS reports");
      }
    } else {
      console.log("[Credit Score] No CRS reports found for user");
    }

    // Try business credit score if personal credit not available
    if (clientData.businessId) {
      console.log(
        `[Credit Score] Attempting business credit for businessId: ${clientData.businessId}`,
      );
      const businessProfile = await getCRSBusinessProfile(
        clientData.businessId,
      );
      const commercialScore =
        businessProfile?.report?.scoreInformation?.commercialScore?.score;
      if (commercialScore && !isNaN(Number(commercialScore))) {
        // Convert commercial score (typically 0-100) to FICO-like scale (300-850)
        const normalizedScore = Math.round(
          300 + (Number(commercialScore) / 100) * 550,
        );
        console.log(
          `[Credit Score] Using business credit: ${commercialScore} (normalized to ${normalizedScore})`,
        );
        return normalizedScore;
      } else {
        console.log("[Credit Score] No valid business credit score found");
      }
    }
  } catch (error) {
    console.log(
      "[Credit Score] Error fetching CRS reports, falling back to estimation:",
      error,
    );
  }

  // Fallback to estimation if no credit reports available
  console.log(
    "[Credit Score] Using estimation based on employment, business age, address, and income",
  );
  let baseScore = 650; // Average starting point

  // Employment stability
  if (clientData.employmentDateOfHire) {
    const employmentMonths =
      (Date.now() - new Date(clientData.employmentDateOfHire).getTime()) /
      (1000 * 60 * 60 * 24 * 30);
    if (employmentMonths >= 36) baseScore += 50;
    else if (employmentMonths >= 24) baseScore += 30;
    else if (employmentMonths >= 12) baseScore += 15;
  }

  // Business age
  if (clientData.dateOfIncorporation) {
    const businessAgeMonths =
      (Date.now() - new Date(clientData.dateOfIncorporation).getTime()) /
      (1000 * 60 * 60 * 24 * 30);
    if (businessAgeMonths >= 24) baseScore += 40;
    else if (businessAgeMonths >= 12) baseScore += 20;
  }

  // Address stability
  if (clientData.moveInCurrentAddress) {
    const addressMonths =
      (Date.now() - new Date(clientData.moveInCurrentAddress).getTime()) /
      (1000 * 60 * 60 * 24 * 30);
    if (addressMonths >= 24) baseScore += 20;
    else if (addressMonths >= 12) baseScore += 10;
  }

  // Income level
  const monthlyIncome =
    clientData.employmentPayPerMonth ||
    (clientData.annualBusinessRevenue || 0) / 12 ||
    0;
  if (monthlyIncome >= 10000) baseScore += 30;
  else if (monthlyIncome >= 5000) baseScore += 20;
  else if (monthlyIncome >= 3000) baseScore += 10;

  const estimatedScore = Math.min(baseScore, 850); // Cap at maximum FICO
  console.log(`[Credit Score] Estimated score: ${estimatedScore}`);
  return estimatedScore;
}

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
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as BankFormData;
};

export const deleteBankProduct = async (id: string) => {
  console.log("deleteBankProduct", id);

  const data = await getBankProduct(id);
  console.log("deleteBankProduct - data fetched", data);
  if (!data) {
    throw new NotFoundError("Bank product not found.");
  }

  const db = firestoreAdmin();
  const collectionRef = db.collection(BANK_PRODUCTS_COLLECTION).doc(id);
  await collectionRef.delete();
};

export const updateBankProduct = async (id: string, values: BankFormData) => {
  const data = await getBankProduct(id);
  if (!data) {
    throw new NotFoundError("Bank product not found.");
  }

  const db = firestoreAdmin();
  const collectionRef = db.collection(BANK_PRODUCTS_COLLECTION).doc(id);
  await collectionRef.set(values);
};

export const recordFundMappingAnalysis = async ({
  userId,
  referenceNumber,
  ids,
  append,
  selectedPathwayId,
}: {
  userId: string;
  referenceNumber: string;
  ids: { id: string }[];
  append: boolean;
  selectedPathwayId?: string;
}) => {
  if (!userId) throw new NotFoundError("User ID is required.");
  if (!referenceNumber)
    throw new NotFoundError("Reference number is required.");
  if (!ids || ids.length === 0)
    throw new NotFoundError("Analysis is required.");

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
  const docId = selectedPathwayId || referenceNumber;
  const collectionRef = db
    .collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING}`,
    )
    .doc(docId);

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
      ...(selectedPathwayId && { selectedPathwayId }),
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
      ...(selectedPathwayId && { selectedPathwayId }),
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

export const recordFundMappingAnalysisNoOutput = async ({
  userId,
  referenceNumber,
  selectedPathwayId,
  reason,
}: {
  userId: string;
  referenceNumber: string;
  selectedPathwayId?: string;
  reason: string;
}) => {
  if (!userId) throw new NotFoundError("User ID is required.");
  if (!referenceNumber)
    throw new NotFoundError("Reference number is required.");

  const db = firestoreAdmin();
  const docId = selectedPathwayId || referenceNumber;
  const collectionRef = db
    .collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING}`,
    )
    .doc(docId);

  await collectionRef.set(
    {
      bank_products: [],
      noOutputReason: reason,
      userId,
      ...(selectedPathwayId && { selectedPathwayId }),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );
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

export const getFundMappingNoOutputReason = async (
  referenceNumber: string,
  pathwayId?: string,
) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING}`,
  );

  let docs = [];
  if (pathwayId) {
    const docSnapshot = await collectionRef.doc(pathwayId).get();
    if (docSnapshot.exists) {
      docs.push(docSnapshot);
    }
  } else {
    const querySnapshot = await collectionRef.get();
    docs = querySnapshot.docs;
  }

  for (const doc of docs) {
    const data = doc.data();
    if (data?.noOutputReason) {
      return data.noOutputReason as string;
    }
  }

  return null;
};

export const getFundMappingAnalysis = async (
  referenceNumber: string,
  pathwayId?: string,
) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING}`,
  );

  let docs = [];
  if (pathwayId) {
    const docSnapshot = await collectionRef.doc(pathwayId).get();
    if (docSnapshot.exists) {
      docs.push(docSnapshot);
    }
  } else {
    const querySnapshot = await collectionRef.get();
    docs = querySnapshot.docs;
  }

  const bankProductIds = docs.map((doc) => ({
    bank_products: doc.data()?.bank_products || [],
  }));
  // console.log("bankProductIds", JSON.stringify(bankProductIds));
  if (!bankProductIds || bankProductIds.length === 0) return null;

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
  pathwayId,
}: {
  userId?: string;
  clientApplicationStatus?: ClientApplicationStatus[];
  referenceNumber?: string;
  bankProductId?: string;
  pathwayId?: string;
}) => {
  const db = firestoreAdmin();

  let docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[] =
    [];

  if (userId) {
    // 1. Fetch user's funding applications first to get reference numbers
    const userApplicationsSnapshot = await db
      .collection(USER_FUNDING_APPLICATION)
      .where("userId", "==", userId)
      .get();

    let referenceNumbers = userApplicationsSnapshot.docs.map((d) => d.id);

    if (referenceNumber) {
      referenceNumbers = referenceNumbers.filter(
        (ref) => ref === referenceNumber,
      );
    }

    if (referenceNumbers.length > 0) {
      // 2. Fetch documents from each reference number's subcollection directly.
      // This is extremely robust and works even if the userId field is missing from subcollection documents!
      const subcollectionPromises = referenceNumbers.map(async (refNum) => {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db
          .collection(USER_FUNDING_APPLICATION)
          .doc(refNum)
          .collection(USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED);

        if (clientApplicationStatus && clientApplicationStatus.length > 0) {
          query = query.where(
            "clientApplicationStatus",
            "in",
            clientApplicationStatus,
          );
        }
        if (bankProductId) {
          query = query.where("bankProductId", "==", bankProductId);
        }
        if (pathwayId) {
          query = query.where("pathwayId", "==", pathwayId);
        }
        const snapshot = await query.get();
        return snapshot.docs;
      });

      const results = await Promise.all(subcollectionPromises);
      docs = results.flat();

      // Sort by createdAt desc
      docs.sort((a, b) => {
        const aData = a.data();
        const bData = b.data();
        const aTime =
          aData.createdAt?.toMillis?.() ||
          (aData.createdAt instanceof Date ? aData.createdAt.getTime() : 0);
        const bTime =
          bData.createdAt?.toMillis?.() ||
          (bData.createdAt instanceof Date ? bData.createdAt.getTime() : 0);
        return bTime - aTime;
      });
    }

    // 3. Fetch manual entries (where parent doc ID = userId) as well
    let manualQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
      db
        .collection(USER_FUNDING_APPLICATION)
        .doc(userId)
        .collection(USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED);

    if (clientApplicationStatus && clientApplicationStatus.length > 0) {
      manualQuery = manualQuery.where(
        "clientApplicationStatus",
        "in",
        clientApplicationStatus,
      );
    }
    if (bankProductId) {
      manualQuery = manualQuery.where("bankProductId", "==", bankProductId);
    }
    if (pathwayId) {
      manualQuery = manualQuery.where("pathwayId", "==", pathwayId);
    }
    const manualSnapshot = await manualQuery.get();
    if (!manualSnapshot.empty) {
      docs = [...docs, ...manualSnapshot.docs];
      // Re-sort by createdAt desc
      docs.sort((a, b) => {
        const aData = a.data();
        const bData = b.data();
        const aTime =
          aData.createdAt?.toMillis?.() ||
          (aData.createdAt instanceof Date ? aData.createdAt.getTime() : 0);
        const bTime =
          bData.createdAt?.toMillis?.() ||
          (bData.createdAt instanceof Date ? bData.createdAt.getTime() : 0);
        return bTime - aTime;
      });
    }
  } else {
    // Original collectionGroup query for non-userId cases (e.g. admin or fallback)
    let collectionGroupRef = db
      .collectionGroup(USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED)
      .orderBy("createdAt", "desc");

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

    if (pathwayId) {
      collectionGroupRef = collectionGroupRef.where(
        "pathwayId",
        "==",
        pathwayId,
      );
    }

    const docSnapshot = await collectionGroupRef.get();
    docs = docSnapshot.docs;
  }

  const bankProductIds = docs.map((d) => {
    return {
      id: d.id,
      ...normalizeAllDates(d.data()),
    };
  });

  // console.log("getFundMappingAnalysisDetails - bankProductIds", bankProductIds);

  if (!bankProductIds) return null;

  // We will fetch client funding data inside the loop if referenceNumber wasn't globally provided,
  // or use the global one if it was.
  const globalClientFundingData = referenceNumber
    ? await getApplyFundingByReferenceNumber({ referenceNumber })
    : null;

  const result: ApprovedBankFormData[] = [];
  for (const bankProductId of bankProductIds) {
    const currentRefNumber = referenceNumber || bankProductId.referenceNumber;
    const clientFundingData =
      globalClientFundingData ||
      (currentRefNumber
        ? await getApplyFundingByReferenceNumber({
            referenceNumber: currentRefNumber,
          })
        : null);

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
        hasSignedSuccessFeeAgreement:
          bankProductId.hasSignedSuccessFeeAgreement || false,
        successFeePercentage: bankProductId.successFeePercentage || 0,
        signedSuccessFeeAgreementAt:
          bankProductId.signedSuccessFeeAgreementAt || null,
        applicationMethod: bankProductId.applicationMethod || null,
        products: [
          {
            productName: bankProductId.manualProductName || "Manual Entry",
            category: "Manual",
            financingTerm: "",
            doubleDipAllowed: "No",
            creditBureauPulled: [],
            minimumFicoScore: 0,
            maximumFundingAmount: bankProductId.approvedAmount || 0,
            // averageApprovalAmount: 0,
            grossFundingPercentage: 0,
            maximumInquiriesAllowed: 0,
            minimumNumberOfAccountsOnCredit: 0,
            // minimumCreditAgeRequired: "",
            personalVerifiableIncomeRequired: "No",
            // noDocumentationRequired: "No",
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
        applicationUrl: undefined, // Manual entries don't have application URLs
      } as ApprovedBankFormData);
    } else {
      // For regular entries, fetch from bank products collection
      const bankProduct = await getBankProduct(bankProductId.bankProductId);
      if (bankProduct) {
        // Get applicationUrl from bank management collection
        const applicationUrl = await getBankWebsite(bankProduct.bankName);

        // Calculate approval odds for each product
        const productsWithOdds = clientFundingData
          ? await Promise.all(
              (bankProduct.products || []).map(async (product) => ({
                ...product,
                approvalOdds: await calculateApprovalOdds(
                  bankProductId.userId,
                  clientFundingData,
                  product,
                ),
              })),
            )
          : bankProduct.products || [];
        // console.log(
        //   `Calculated approval odds for products of reference ${bankProductId.referenceNumber}:`,
        //   productsWithOdds.map((p) => ({
        //     productName: p.productName,
        //     approvalOdds: p.approvalOdds,
        //   })),
        // );
        // Calculate overall approval odds (average of all products) + 25 extra
        const overallApprovalOdds =
          productsWithOdds.length > 0
            ? Math.min(
                98,
                Math.round(
                  productsWithOdds.reduce(
                    (sum, p: any) => sum + (p.approvalOdds || 0),
                    0,
                  ) / productsWithOdds.length,
                ) + 25,
              )
            : undefined;
        // console.log(
        //   `Calculated overall approval odds for reference ${bankProductId.referenceNumber}: ${overallApprovalOdds}%`,
        // );
        result.push({
          ...bankProduct,
          products: productsWithOdds,
          fundMappingApprovedId: bankProductId.id,
          clientApplicationStatus: bankProductId.clientApplicationStatus,
          adminApprovedStatus: bankProductId.adminApprovedStatus,
          referenceNumber: bankProductId.referenceNumber,
          approvedAmount: bankProductId.approvedAmount,
          approvedRemarks: bankProductId.approvedRemarks,
          fundedAmount: bankProductId.fundedAmount,
          fundedRemarks: bankProductId.fundedRemarks,
          userId: bankProductId.userId,
          applicationUrl, // Add applicationUrl to top level
          approvalOdds: overallApprovalOdds, // Add calculated approval odds
          pathwayId: bankProductId.pathwayId || pathwayId,
          hasSignedSuccessFeeAgreement:
            bankProductId.hasSignedSuccessFeeAgreement || false,
          successFeePercentage: bankProductId.successFeePercentage || 0,
          signedSuccessFeeAgreementAt:
            bankProductId.signedSuccessFeeAgreementAt || null,
          applicationMethod: bankProductId.applicationMethod || null,
        });
      }
    }
  }

  return result;
};

import { getUserMembership } from "./membership";

export const getAutoServedClientFunds = async ({
  userId,
  referenceNumber,
  pathwayId,
}: {
  userId: string;
  referenceNumber: string;
  pathwayId?: string;
}): Promise<ApprovedBankFormData[]> => {
  const MONTHLY_CAP_STATUSES: ClientApplicationStatus[] = [
    "Pending",
    "Sent to Lender",
    "Approved",
  ];

  let membershipTier = "tier_starter"; // default

  try {
    const membership = await getUserMembership(userId);
    if (membership && membership.status === "active") {
      membershipTier = membership.tier;
    }
  } catch (error) {
    console.error("Error fetching user membership for auto serve cap:", error);
  }

  // 1. Read full queue
  const queue =
    (await getFundMappingAnalysis(referenceNumber, pathwayId)) ?? [];

  // 2. Read ALL tracking records directly from Firestore (to check global vs pathway caps)
  const db = firestoreAdmin();
  const baseApprovedCollectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
  );

  const allApprovedSnapshot = await baseApprovedCollectionRef.get();
  const allExistingDocs = allApprovedSnapshot.docs.map((d: any) => ({
    id: d.id,
    ...normalizeAllDates(d.data()),
  })) as (ApprovedBankFormData & {
    autoServed?: boolean;
    createdAt?: any;
    pathwayId?: string;
  })[];

  // Filter docs for current pathway
  const existingDocs = pathwayId
    ? allExistingDocs.filter((d) => d.pathwayId === pathwayId)
    : allExistingDocs;

  // Count "Not Applied" records
  const notAppliedCount = existingDocs.filter(
    (r) => r.clientApplicationStatus === "Not Applied",
  ).length;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const getMonthlyActiveCount = (docs: any[]) =>
    docs.filter((r) => {
      if (
        !MONTHLY_CAP_STATUSES.includes(
          r.clientApplicationStatus as ClientApplicationStatus,
        )
      ) {
        return false;
      }
      const createdAt = r.createdAt;
      if (!createdAt) return false;
      const createdDate =
        createdAt instanceof Date ? createdAt : new Date(createdAt);
      return createdDate >= startOfMonth;
    }).length;

  const monthlyActiveCount = getMonthlyActiveCount(existingDocs);
  const totalMonthlyActiveCount = getMonthlyActiveCount(allExistingDocs);
  const totalNotAppliedCount = allExistingDocs.filter(
    (r) => r.clientApplicationStatus === "Not Applied",
  ).length;

  let SLOT_TARGET = 6;
  let MONTHLY_CAP = 6;
  let globalCap = true;

  switch (membershipTier) {
    case "tier_starter":
      SLOT_TARGET = 6;
      MONTHLY_CAP = 6;
      globalCap = true; // 6 lenders TOTAL
      break;
    case "tier_pro":
      SLOT_TARGET = 6;
      MONTHLY_CAP = 6;
      globalCap = false; // 6 lenders PER CATEGORY
      break;
    case "tier_executive":
      SLOT_TARGET = 12;
      MONTHLY_CAP = 12;
      globalCap = false; // 12 lenders PER CATEGORY
      break;
  }

  const effectiveNotAppliedCount = globalCap
    ? totalNotAppliedCount
    : notAppliedCount;
  const effectiveMonthlyActiveCount = globalCap
    ? totalMonthlyActiveCount
    : monthlyActiveCount;

  let approvedQuery: any = baseApprovedCollectionRef;
  if (pathwayId) {
    approvedQuery = baseApprovedCollectionRef.where(
      "pathwayId",
      "==",
      pathwayId,
    );
  }

  // 6. Fill slots to SLOT_TARGET
  if (
    effectiveNotAppliedCount < SLOT_TARGET &&
    effectiveMonthlyActiveCount < MONTHLY_CAP
  ) {
    const slotsToFill = Math.min(
      SLOT_TARGET - effectiveNotAppliedCount,
      MONTHLY_CAP - effectiveMonthlyActiveCount,
    );

    // Find untracked banks: queue banks whose id doesn't appear in any existing record
    const trackedBankIds = new Set(
      existingDocs.map((r) => (r as any).bankProductId).filter(Boolean),
    );
    const untrackedBanks = queue.filter((bank) => !trackedBankIds.has(bank.id));
    const banksToServe = untrackedBanks.slice(0, slotsToFill);

    for (const bank of banksToServe) {
      // Race condition guard: check if a doc with this bankProductId already exists
      const existing = await approvedQuery
        .where("bankProductId", "==", bank.id)
        .limit(1)
        .get();

      if (!existing.empty) continue;

      await baseApprovedCollectionRef.add({
        bankProductId: bank.id,
        products: bank.products, // ALL products from the bank
        createdAt: Timestamp.now(),
        clientApplicationStatus: "Not Applied",
        userId,
        referenceNumber,
        autoServed: true,
        ...(pathwayId && { pathwayId }),
      });
    }
  }

  // 7. Build return data — re-read all fund-mapping-approved records for current pathway
  const refreshedSnapshot = await approvedQuery.get();
  const refreshedDocs = refreshedSnapshot.docs.map((d: any) => ({
    id: d.id,
    ...normalizeAllDates(d.data()),
  }));

  const clientFundingData = await getApplyFundingByReferenceNumber({
    referenceNumber,
  });

  const result: ApprovedBankFormData[] = [];
  for (const record of refreshedDocs) {
    const r = record as any;

    if (r.isManualEntry || !r.bankProductId) {
      // Manual entry
      result.push({
        id: r.id,
        bankName: r.manualBankName || "",
        fundMappingApprovedId: r.id,
        clientApplicationStatus: r.clientApplicationStatus,
        adminApprovedStatus: r.adminApprovedStatus,
        referenceNumber: r.referenceNumber || referenceNumber,
        approvedAmount: r.approvedAmount || 0,
        approvedRemarks: r.approvedRemarks || "",
        fundedAmount: r.fundedAmount || 0,
        fundedRemarks: r.fundedRemarks || "",
        userId: r.userId || userId,
        underwritingNotes: r.approvedRemarks || "",
        hasSignedSuccessFeeAgreement: r.hasSignedSuccessFeeAgreement || false,
        successFeePercentage: r.successFeePercentage || 0,
        signedSuccessFeeAgreementAt: r.signedSuccessFeeAgreementAt || null,
        applicationMethod: r.applicationMethod || null,
        products: [
          {
            productName: r.manualProductName || "Manual Entry",
            category: "Manual",
            financingTerm: "",
            doubleDipAllowed: "No",
            creditBureauPulled: [],
            minimumFicoScore: 0,
            maximumFundingAmount: r.approvedAmount || 0,
            grossFundingPercentage: 0,
            maximumInquiriesAllowed: 0,
            minimumNumberOfAccountsOnCredit: 0,
            personalVerifiableIncomeRequired: "No",
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
        applicationUrl: undefined,
      } as ApprovedBankFormData);
    } else {
      const bankProduct = await getBankProduct(r.bankProductId);
      if (bankProduct) {
        const applicationUrl = await getBankWebsite(bankProduct.bankName);

        const productsWithOdds = clientFundingData
          ? await Promise.all(
              (bankProduct.products || []).map(async (product) => ({
                ...product,
                approvalOdds: await calculateApprovalOdds(
                  r.userId || userId,
                  clientFundingData,
                  product,
                ),
              })),
            )
          : bankProduct.products || [];

        const overallApprovalOdds =
          productsWithOdds.length > 0
            ? Math.min(
                98,
                Math.round(
                  productsWithOdds.reduce(
                    (sum, p: any) => sum + (p.approvalOdds || 0),
                    0,
                  ) / productsWithOdds.length,
                ) + 25,
              )
            : undefined;

        result.push({
          ...bankProduct,
          products: productsWithOdds,
          fundMappingApprovedId: r.id,
          clientApplicationStatus: r.clientApplicationStatus,
          adminApprovedStatus: r.adminApprovedStatus,
          referenceNumber: r.referenceNumber || referenceNumber,
          approvedAmount: r.approvedAmount,
          approvedRemarks: r.approvedRemarks,
          fundedAmount: r.fundedAmount,
          fundedRemarks: r.fundedRemarks,
          userId: r.userId || userId,
          applicationUrl,
          approvalOdds: overallApprovalOdds,
          pathwayId: r.pathwayId || pathwayId,
          hasSignedSuccessFeeAgreement: r.hasSignedSuccessFeeAgreement || false,
          successFeePercentage: r.successFeePercentage || 0,
          signedSuccessFeeAgreementAt: r.signedSuccessFeeAgreementAt || null,
          applicationMethod: r.applicationMethod || null,
        });
      }
    }
  }

  // Sort: "Not Applied" first, then by bank name alphabetically
  result.sort((a, b) => {
    const aNotApplied = a.clientApplicationStatus === "Not Applied" ? 0 : 1;
    const bNotApplied = b.clientApplicationStatus === "Not Applied" ? 0 : 1;
    if (aNotApplied !== bNotApplied) return aNotApplied - bNotApplied;
    return (a.bankName || "").localeCompare(b.bankName || "");
  });

  return result;
};

export const approveMappedFund = async ({
  referenceNumber,
  bankProductId,
  products,
}: {
  referenceNumber: string;
  bankProductId: string;
  products: BankProductCriteria[];
}): Promise<CommonResponse> => {
  try {
    if (!referenceNumber) {
      return {
        success: false,
        error: "warning",
        message: "Reference number is required.",
      };
    }
    if (!products || products.length === 0) {
      return {
        success: false,
        error: "warning",
        message: "At least one product must be selected for approval.",
      };
    }
    logInfo("approveMappedFund", { referenceNumber, bankProductId, products });

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

    const db = firestoreAdmin();
    const collectionRef = db.collection(
      `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
    );

    const q = collectionRef.where("bankProductId", "==", bankProductId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      // Create a new approval document
      await collectionRef.add({
        bankProductId,
        products, // Save the selected products
        createdAt: Timestamp.now(),
        approvedById: currentUser.uid,
        clientApplicationStatus: "Not Applied",
        userId: fundingApplication.userId,
        referenceNumber,
      });
    } else {
      // Update existing approval document to overwrite products
      const docRef = querySnapshot.docs[0].ref;
      await docRef.update({
        products: products, // Overwrite with new products
        updatedAt: Timestamp.now(),
        approvedById: currentUser.uid,
      });
    }

    await updateApplicationStatus({ referenceNumber, status: "Pre-Approved" });

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
      await updateApplicationStatus({ referenceNumber, status: "Processing" });
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

export const getApprovedMappedFunds = async (
  referenceNumber: string,
  pathwayId?: string,
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
    let collectionRef: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
      db.collection(
        `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
      );

    if (pathwayId) {
      collectionRef = collectionRef.where("pathwayId", "==", pathwayId);
    }

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
        products: data.products as BankProductCriteria[],
      };
    });

    // 2. Fetch all bank products in parallel for better performance
    const bankProductPromises = bankProductInfo.map(
      async (info): Promise<ApprovedBankFormData | null> => {
        const bankProduct = await getBankProduct(info.bankProductId);
        if (bankProduct) {
          // Get applicationUrl from bank management collection
          const applicationUrl = await getBankWebsite(bankProduct.bankName);

          return {
            ...bankProduct,
            clientApplicationStatus: info.clientApplicationStatus,
            fundMappingApprovedId: info.id,
            referenceNumber: info.referenceNumber,
            approvedAmount: info.approvedAmount,
            approvedRemarks: info.approvedRemarks,
            userId: referenceData.userId!,
            products: info.products, // Use approved products over all products
            applicationUrl, // Add applicationUrl to top level
          } as ApprovedBankFormData;
        }
        return null; // Return null if a specific bank product isn't found
      },
    );

    const resolvedBankProducts = await Promise.all(bankProductPromises);

    // Filter out any nulls from products that might not have been found
    const result: ApprovedBankFormData[] = resolvedBankProducts.filter(
      (product): product is ApprovedBankFormData => product !== null,
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

    // await fetch(`${process.env.n8n_HOST}/${await createAsanaTaskForLender()}`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
    //   },
    //   body: JSON.stringify({
    //     userId: userId,
    //     bankProductId: bankProductId,
    //   }),
    // });

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

export const getApprovedMappedFund = async ({
  referenceNumber,
  fundMappingApprovedId,
}: {
  referenceNumber: string;
  fundMappingApprovedId: string;
}): Promise<CommonResponse & { data?: ApprovedMappedFund }> => {
  try {
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

    const referenceData = await getApplyFundingByReferenceNumber({
      referenceNumber,
    });
    if (!referenceData) {
      return {
        success: false,
        error: "warning",
        message: "Funding application reference number not found.",
      };
    }

    const db = firestoreAdmin();
    const docRef = db
      .collection(
        `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
      )
      .doc(fundMappingApprovedId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return {
        success: false,
        error: "warning",
        message: "Fund mapping approved not found.",
      };
    }

    const data = doc.data()!;

    const result: ApprovedMappedFund = {
      id: doc.id,
      referenceNumber: data.referenceNumber as string,
      userId: referenceData.userId!,
      products: data.products as BankProductCriteria[],
      bankProductId: data.bankProductId as string,
      createdAt: normalizeAllDates(data.createdAt),
      approvedById: data.approvedById as string,
    };

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Unexpected error in getApprovedMappedFund:", error);
    return {
      success: false,
      error: "error",
      message: "An unexpected error occurred while fetching approved fund.",
    };
  }
};

export const applyApprovedMappedFund = async ({
  referenceNumber,
  fundMappingApprovedId,
  applicationMethod,
  hasSignedSuccessFeeAgreement,
  successFeePercentage,
}: {
  referenceNumber: string;
  fundMappingApprovedId: string;
  applicationMethod?: ClientApplicationMethod;
  hasSignedSuccessFeeAgreement?: boolean;
  successFeePercentage?: number;
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

    const bankProductId = docData?.bankProductId as string;

    await createAsanaCustomerServiceTask({
      userId: docData?.userId,
      bankProductId,
      referenceNumber,
      fundMappingApprovedId,
    });

    await collectionRef.doc(fundMappingApprovedId).set(
      {
        clientApplicationStatus: "Sent to Lender",
        applicationMethod: applicationMethod || "Specialist",
        hasSignedSuccessFeeAgreement:
          hasSignedSuccessFeeAgreement ||
          docData?.hasSignedSuccessFeeAgreement ||
          false,
        successFeePercentage:
          hasSignedSuccessFeeAgreement || docData?.hasSignedSuccessFeeAgreement
            ? successFeePercentage || docData?.successFeePercentage || 15
            : 0,
        signedSuccessFeeAgreementAt:
          hasSignedSuccessFeeAgreement || docData?.hasSignedSuccessFeeAgreement
            ? docData?.signedSuccessFeeAgreementAt || new Date().toISOString()
            : null,
      },
      { merge: true },
    );

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

    const docRef = collectionRef.doc(fundMappingApprovedId);
    const docSnapshot = await docRef.get();
    const docData = docSnapshot.data();

    await docRef.set(
      {
        clientApplicationStatus: "Approved",
        approvedAmount,
        approvedRemarks,
      },
      { merge: true },
    );

    if (docData?.hasSignedSuccessFeeAgreement) {
      const invoiceQuery = await db
        .collection(PSF_INVOICES_COLLECTION)
        .where("fundMappingApprovedId", "==", fundMappingApprovedId)
        .limit(1)
        .get();

      if (invoiceQuery.empty) {
        const successFeePercentage = docData.successFeePercentage || 15;
        const successFeeAmount = Math.round(
          approvedAmount * (successFeePercentage / 100),
        );

        let bankName = "Unknown Bank";
        if (docData.isManualEntry) {
          bankName = docData.manualBankName || "Unknown Bank";
        } else if (docData.bankProductId) {
          const bankProduct = await getBankProduct(docData.bankProductId);
          if (bankProduct) {
            bankName = bankProduct.bankName;
          }
        }

        const invoiceData = {
          userId: docData.userId,
          referenceNumber,
          fundMappingApprovedId,
          bankName,
          approvedAmount,
          successFeePercentage,
          successFeeAmount,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await db.collection(PSF_INVOICES_COLLECTION).add(invoiceData);
      }
    }

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

export const skipLenderAppliedBankProduct = async ({
  referenceNumber,
  fundMappingApprovedId,
  skipReason,
}: {
  referenceNumber: string;
  fundMappingApprovedId: string;
  skipReason?: string;
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
        clientApplicationStatus: "Lender Skipped",
        skipReason: skipReason || "",
      },
      { merge: true },
    );

    // 4. Return a successful response
    return { success: true };
  } catch (error: any) {
    // 5. Catch any unexpected errors and return a generic error response
    console.error("Unexpected error in skipLenderAppliedBankProduct:", error);
    return {
      success: false,
      error: "error",
      message: "An unexpected error occurred while skipping the lender.",
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

export const signSpecialistFeeAgreement = async ({
  referenceNumber,
  userId,
  signature,
  fundMappingApprovedId,
}: {
  referenceNumber: string;
  userId: string;
  signature: {
    type: "type" | "draw";
    value: string;
    ipAddress?: string;
    macAddress?: string;
  };
  fundMappingApprovedId?: string;
}): Promise<CommonResponse & { pdfUrl?: string }> => {
  try {
    // Validate inputs
    if (!referenceNumber || !userId || !signature || !signature.value) {
      return {
        success: false,
        error: "warning",
        message: "Reference number, user ID, and signature are required.",
      };
    }

    // Resolve client's IP address if not provided in signature.ipAddress (or fallback using standard headers() from "next/headers")
    let ipAddress = signature.ipAddress;
    if (!ipAddress || ipAddress === "Unknown") {
      try {
        const headersList = await headers();
        const forwardedFor = headersList.get("x-forwarded-for");
        ipAddress = forwardedFor
          ? forwardedFor.split(",")[0].trim()
          : headersList.get("x-real-ip") || "Unknown";
      } catch (e) {
        ipAddress = "Unknown";
      }
    }

    // Generate and save the PDF agreement (fundingAmount and feeAmount are 0 during pre-application)
    const uploadResult = await saveFeeAgreementToPDF(
      referenceNumber,
      userId,
      {
        ...signature,
        ipAddress: ipAddress || "Unknown",
      },
      0, // fundingAmount
      0, // feeAmount
      15, // percentageFee
    );

    if (fundMappingApprovedId) {
      const db = firestoreAdmin();
      const docRef = db
        .collection(
          `${USER_FUNDING_APPLICATION}/${referenceNumber}/${USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED}`,
        )
        .doc(fundMappingApprovedId);

      await docRef.set(
        {
          hasSignedSuccessFeeAgreement: true,
          successFeePercentage: 15,
          signedSuccessFeeAgreementAt: new Date().toISOString(),
          specialistSignature: {
            type: signature.type,
            value: signature.value,
            ipAddress: ipAddress || "Unknown",
            signedAt: new Date().toISOString(),
          },
        },
        { merge: true },
      );
    }

    return {
      success: true,
      pdfUrl: uploadResult?.publicUrl || "",
    };
  } catch (error: any) {
    console.error(
      "Error signing specialist fee agreement Server Action:",
      error,
    );
    return {
      success: false,
      error: "error",
      message:
        "An error occurred while generating or uploading your agreement PDF.",
    };
  }
};
