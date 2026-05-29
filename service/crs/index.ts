"use server";
import {
  CRS_REPORT_BUSINESS_PROFILE,
  CRS_REPORT_BUSINESS_SCORE,
  CRS_REPORT_DATA,
} from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { logInfo } from "@/lib/logger";
import {
  deleteCRSReportN8N,
  generateCRSReportN8N,
  getFundingAnalysis,
  getFundingAnalysisNewRegistrationFlow,
  mapBankProductsN8nNewRegistration,
  sendClientAnalysisN8N,
  sendClientCongratsMessageN8N,
  sendClientCongratsMessageN8NNewRegistration,
} from "@/lib/n8n";
import { Business } from "@/schema";
import { getBusiness } from "@/service/business";
import { getUserById } from "@/service/user";
import { CRSAddressInfo, CRSPersonalInfo, CRSReportType } from "@/types/crs";
import { getFeeSettings } from "@/service/fee-settings";
import { createCRSReportCheckoutConfig } from "@/service/whop";

export const initiateCRSReportCheckout = async ({
  userId,
  reportType,
  businessId,
  referenceNumber,
}: {
  userId: string;
  reportType: "personal" | "business";
  businessId?: string;
  referenceNumber?: string;
}) => {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found.");

  const feeSettings = await getFeeSettings();
  const fee =
    reportType === "personal"
      ? feeSettings.creditReportFee
      : feeSettings.businessCreditReportFee;

  // Generate a temporary reference number if one isn't provided
  const generatedRef = referenceNumber || `crs-req-${Date.now()}`;

  if (fee > 0) {
    // Return checkout info
    const paymentKey =
      reportType === "personal" ? "CreditReportFee" : "BusinessCreditReportFee";

    return await createCRSReportCheckoutConfig({
      userId,
      paymentKey,
      feeAmount: fee,
      metadata: {
        reportType,
        businessId: businessId || "",
        referenceNumber: generatedRef,
      },
    });
  }

  return { success: false, url: null, checkoutId: null };
  // } else {
  //   // Fee is $0, invoke generation directly
  //   if (reportType === "personal") {
  //     await generateCRSReport({
  //       userId,
  //       referenceNumber: generatedRef,
  //       bureaus: { equifax: true, experian: true, transunion: true },
  //       bypassPremiumCheck: true,
  //     });
  //   } else if (reportType === "business" && businessId) {
  //     await generateCRSReportBusiness(
  //       userId,
  //       generatedRef,
  //       businessId,
  //       true, // bypassPremiumCheck
  //     );
  //   }
  //   return { success: true, url: null, checkoutId: null };
  // }
};

export const recordCRSReport = async (
  userId: string,
  crsType: CRSReportType,
  report: any,
) => {
  if (!userId) throw new Error("User ID is required.");

  const userData = await getUserById(userId);
  if (!userData) throw new Error("User not found.");

  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_DATA);
  const docRef = collectionRef.doc(userId);

  await docRef.set(
    { userId, createdAt: new Date(), updatedAt: new Date() },
    { merge: true },
  );

  const timestamp = Date.now();
  //backup old crs data
  await renameDocument({
    userId,
    crsType,
    oldDocId: crsType,
    newDocId: `${crsType}-${timestamp}`,
  });

  const subCollectionRef = db.collection(
    `${CRS_REPORT_DATA}/${userId}/${crsType}`,
  );
  const subDocRef = subCollectionRef.doc(crsType);
  await subDocRef.set(
    { userId, report, createdAt: new Date() },
    { merge: true },
  );
};

export const recordCRSBusinessProfile = async (
  userId: string,
  businessId: string,
  report: any,
) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_BUSINESS_PROFILE);
  const docRef = collectionRef.doc(businessId);
  await docRef.set(
    { userId, businessId, report, createdAt: new Date() },
    { merge: true },
  );
};

export const recordCRSBusinessScore = async (
  userId: string,
  businessId: string,
  report: any,
) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_BUSINESS_SCORE);
  const docRef = collectionRef.doc(businessId);
  await docRef.set(
    { userId, businessId, report, createdAt: new Date() },
    { merge: true },
  );
};

export const getCRSReport = async (
  userId: string,
  isLatest?: boolean,
  reportTypes: string[] = ["equifax", "experian", "transunion"],
) => {
  const db = firestoreAdmin();

  const collectionRef = db.collection(CRS_REPORT_DATA);
  const docRef = collectionRef.doc(userId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) return null;

  const subcols = await docRef.listCollections();

  const nested = await Promise.all(
    subcols
      .filter((col) => reportTypes.includes(col.id))
      .map(async (colRef) => {
        let query = colRef.orderBy("createdAt", "desc");

        if (isLatest) {
          query = query.limit(1);
        }

        const qs = await query.get();
        return qs.docs.map((doc) => ({
          type: colRef.id,
          id: doc.id,
          ...normalizeAllDates(doc.data() || {}),
        }));
      }),
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

export const generateCRSReport = async ({
  userId,
  referenceNumber,
  bureaus,
  personalInfo,
  addressInfo,
  bypassPremiumCheck = false,
}: {
  userId: string;
  referenceNumber: string;
  bureaus: { equifax: boolean; experian: boolean; transunion: boolean };
  personalInfo?: CRSPersonalInfo;
  addressInfo?: CRSAddressInfo;
  bypassPremiumCheck?: boolean;
}) => {
  // check if the user is premium client before allowing to generate CRS report
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found.");
  if (!user.isPremiumClient && !bypassPremiumCheck) {
    throw new Error("Only premium clients can generate CRS reports.");
  }

  await fetch(`${process.env.n8n_HOST}/${await generateCRSReportN8N()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
    },
    body: JSON.stringify({
      userId,
      referenceNumber,
      type: "personal",
      bureaus,
      personalInfo,
      addressInfo,
    }),
  });

  // Add delay before returning to allow N8N workflow to process
  console.log("Waiting 5 seconds for CRS report generation to complete...");
  await new Promise((resolve) => setTimeout(resolve, 5000));
};

export const generateCRSReportBusiness = async (
  userId: string,
  referenceNumber: string,
  businessId: string,
  bypassPremiumCheck = false,
) => {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found.");
  if (!user.isPremiumClient && !bypassPremiumCheck) {
    throw new Error("Only premium clients can generate CRS reports.");
  }

  await fetch(`${process.env.n8n_HOST}/${await generateCRSReportN8N()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
    },
    body: JSON.stringify({
      businessId: businessId,
      referenceNumber,
      userId: userId,
      type: "business",
    }),
  });
};

export const refreshCRSData = async ({
  userId,
  referenceNumber,
  bureaus,
  personalInfo,
  addressInfo,
  refreshBusinessCredit = true,
  businessIds,
}: {
  userId: string;
  referenceNumber: string;
  bureaus?: { equifax: boolean; experian: boolean; transunion: boolean };
  personalInfo?: CRSPersonalInfo;
  addressInfo?: CRSAddressInfo;
  refreshBusinessCredit?: boolean;
  businessIds?: string[];
}) => {
  const hasSelectedBureaus =
    bureaus && (bureaus.equifax || bureaus.experian || bureaus.transunion);

  if (!hasSelectedBureaus && !refreshBusinessCredit) {
    throw new Error("At least one bureau or business credit must be selected.");
  }

  if (hasSelectedBureaus) {
    await fetch(`${process.env.n8n_HOST}/${await deleteCRSReportN8N()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
      },
      body: JSON.stringify({
        userId,
        bureaus,
      }),
    });

    await generateCRSReport({
      userId,
      referenceNumber,
      bureaus,
      personalInfo,
      addressInfo,
    });
  }

  if (refreshBusinessCredit) {
    const user = await getUserById(userId);
    if (!user) throw new Error("User not found.");
    if (!user.isPremiumClient) {
      throw new Error("Only premium clients can refresh business credit.");
    }

    let businessesToRefresh: Business[] = [];
    const allBusinesses = await getBusiness(userId);

    if (businessIds && businessIds.length > 0) {
      businessesToRefresh = allBusinesses.filter((b) =>
        businessIds.includes(b.id!),
      );
    } else {
      businessesToRefresh = allBusinesses;
    }

    await Promise.all(
      businessesToRefresh.map(async (business) => {
        await generateCRSReportBusiness(userId, referenceNumber, business.id!);
      }),
    );
  }
};

export const fundAnalysisNewRegistrationFlow = async ({
  referenceNumber,
  userId,
}: {
  referenceNumber: string;
  userId: string;
}) => {
  logInfo("Sending funding application for analysis...", {
    referenceNumber,
    userId,
  });
  await fetch(
    `${process.env.n8n_HOST}/${await getFundingAnalysisNewRegistrationFlow()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
      },
      body: JSON.stringify({
        referenceNumber,
        userId,
      }),
    },
  );
};

export const fundAnalysis = async ({
  referenceNumber,
  userId,
}: {
  referenceNumber: string;
  userId: string;
}) => {
  const url = await getFundingAnalysisNewRegistrationFlow();  
  logInfo("Sending funding application for analysis...", {
    referenceNumber,
    userId,
    url,
  });
  await fetch(
    `${process.env.n8n_HOST}/${await getFundingAnalysisNewRegistrationFlow()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
      },
      body: JSON.stringify({
        referenceNumber,
        userId,
      }),
    },
  );

  // Add delay before returning to allow N8N workflow to process
  // console.log("Waiting 2 minutes for funding analysis to complete...");
  // await new Promise((resolve) => setTimeout(resolve, 120000));
};

export const sendClientFundingApplicationCongratsMessage = async ({
  referenceNumber,
  userId,
}: {
  referenceNumber: string;
  userId: string;
}) => {
  logInfo("Sending client congrats message...", {
    referenceNumber,
    userId,
  });
  await fetch(
    `${process.env.n8n_HOST}/${await sendClientCongratsMessageN8N()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
      },
      body: JSON.stringify({
        referenceNumber,
        userId,
      }),
    },
  );
};

export const sendClientFundingApplicationCongratsMessageNewRegistration =
  async ({
    referenceNumber,
    userId,
  }: {
    referenceNumber: string;
    userId: string;
  }) => {
    logInfo("Sending client congrats message new registration...", {
      referenceNumber,
      userId,
    });
    await fetch(
      `${process.env.n8n_HOST}/${await sendClientCongratsMessageN8NNewRegistration()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
        },
        body: JSON.stringify({
          referenceNumber,
          userId,
        }),
      },
    );
  };

export const requestMapBankProductsN8nNewRegistration = async ({
  referenceNumber,
  userId,
  selectedPathwayId,
}: {
  referenceNumber: string;
  userId: string;
  selectedPathwayId: string;
}) => {
  logInfo("Sending bank product mapping request for new registration...", {
    referenceNumber,
    userId,
    selectedPathwayId,
  });
  await fetch(
    `${process.env.n8n_HOST}/${await mapBankProductsN8nNewRegistration()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
      },
      body: JSON.stringify({
        referenceNumber,
        userId,
        selectedPathwayId,
      }),
    },
  );
};

export const sendClientFundingApplicationAuditAnalysis = async ({
  referenceNumber,
  userId,
}: {
  referenceNumber: string;
  userId: string;
}) => {
  logInfo("Sending client audit analysis...", { referenceNumber, userId });
  await fetch(`${process.env.n8n_HOST}/${await sendClientAnalysisN8N()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
    },
    body: JSON.stringify({
      referenceNumber,
      userId,
    }),
  });
};

const renameDocument = async ({
  userId,
  crsType,
  oldDocId,
  newDocId,
}: {
  userId: string;
  crsType: CRSReportType;
  oldDocId: string;
  newDocId: string;
}) => {
  const db = firestoreAdmin();

  const oldDocRef = db
    .collection(CRS_REPORT_DATA)
    .doc(userId)
    .collection(crsType)
    .doc(oldDocId);

  // Read old document first
  const oldDoc = await oldDocRef.get();

  // If document doesn't exist, skip the rename operation
  if (!oldDoc.exists) {
    console.log(`No existing document to rename: ${oldDocId}`);
    return;
  }

  const newDocRef = db
    .collection(CRS_REPORT_DATA)
    .doc(userId)
    .collection(crsType)
    .doc(newDocId);

  const batch = db.batch();

  // Add to batch: create new doc and delete old doc
  batch.set(newDocRef, oldDoc.data()!);
  batch.delete(oldDocRef);

  // Commit batch
  await batch.commit();

  console.log(`Document renamed atomically from ${oldDocId} to ${newDocId}`);
};
