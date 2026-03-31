"use server";
import { getUserById, getUsers } from "./user";
import { getApplyFunding, getFundingApplications } from "./apply-funding";
import { getBusiness } from "./business";
import {
  getCRSBusinessProfile,
  getCRSBusinessScore,
  getCRSReport,
} from "./crs";
import { Business } from "@/schema";
import { getPlaidCompleteDataForUser } from "./plaid/data";
import { getFundMappingAnalysisDetails } from "./bank-products";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED } from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";

// get all registered user
export const getAdminStatistics = async (): Promise<AdminStatistics> => {
  const usersClient = await getUsers("Client");
  const fundingApplications = await getFundingApplications({});

  if (!fundingApplications) {
    return {
      totalClients: usersClient?.length ?? 0,
      totalFundingApplications: 0,
      totalApprovedApplications: 0,
      totalFundedApplications: 0,
      totalApprovedAmount: 0,
      totalFundedAmount: 0,
      countsByState: {},
      countsByStatus: {},
    };
  }

  const fundMappingApprovedData = await getFundMappingApproved();

  const counts = fundingApplications.reduce<{
    states: Record<string, number>;
    statuses: Record<string, number>;
  }>(
    (acc, app) => {
      // per state
      const state = app.addressState || "Unknown";
      acc.states[state] = (acc.states[state] || 0) + 1;

      // per status
      const status = app.status || "Unknown";
      acc.statuses[status] = (acc.statuses[status] || 0) + 1;

      return acc;
    },
    { states: {}, statuses: {} },
  );

  return {
    totalClients: usersClient?.length ?? 0,
    totalFundingApplications: fundingApplications.length,
    totalApprovedApplications:
      fundMappingApprovedData.totalApprovedApplications,
    totalFundedApplications: fundMappingApprovedData.totalFundedApplications,
    totalApprovedAmount: fundMappingApprovedData.totalApprovedAmount,
    totalFundedAmount: fundMappingApprovedData.totalFundedAmount,
    countsByState: counts.states,
    countsByStatus: counts.statuses,
  };
};

export const getFundMappingApproved = async () => {
  const db = firestoreAdmin();

  const collectionGroupRef = db
    .collectionGroup(USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED)
    .orderBy("createdAt", "desc")
    .where("clientApplicationStatus", "in", ["Approved", "Funded"]);

  const querySnapshot = await collectionGroupRef.get();
  const data = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...normalizeAllDates(doc.data()),
  }));

  return processApplicationData(data);
};

const processApplicationData = (applications: any) => {
  const totals = {
    totalApprovedApplications: 0,
    totalFundedApplications: 0,
    totalApprovedAmount: 0,
    totalFundedAmount: 0,
  };

  return applications.reduce((acc: any, application: any) => {
    if (
      application.clientApplicationStatus === "Approved" ||
      application.clientApplicationStatus === "Funded"
    ) {
      acc.totalApprovedApplications += 1;
    }

    if (application.clientApplicationStatus === "Funded") {
      acc.totalFundedApplications += 1;
    }

    acc.totalApprovedAmount += Number(application.approvedAmount) || 0;
    acc.totalFundedAmount += Number(application.fundedAmount) || 0;

    return acc;
  }, totals);
};

export interface BusinessWithCRSData extends Business {
  crsBusinessProfile: any;
  crsBusinessScore: any;
  computedFundabilityScore: number;
}

export const getClientStatistics = async (userId: string) => {
  const userData = await getUserById(userId);
  // get total funding applications amount
  const fundingApplications = await getApplyFunding(userId);

  const approvedFunds = await getFundMappingAnalysisDetails({
    userId,
    clientApplicationStatus: ["Approved", "Funded"],
  });

  // Fetch CRS report data and DTI report in parallel
  const [crsReportData, dtiReportData] = await Promise.all([
    getCRSReport(userId),
    getCRSReport(userId, true, ["dti"]),
  ]);

  const dtiReport = dtiReportData?.find((r) => r.type === "dti");

  // get business details
  const businessDetails: Business[] = await getBusiness(userId);

  // get CRS business profile + score, and compute fundability score per business
  // Single source of truth — same logic as service/business-audit.ts
  const businessesWithCrsData = await Promise.all(
    businessDetails.map(async (business) => {
      const [businessProfile, businessScore] = await Promise.all([
        getCRSBusinessProfile(business.id ?? ""),
        getCRSBusinessScore(business.id ?? ""),
      ]);

      // ── Fundability Score ────────────────────────────────────────────────
      // Priority 1: CRS Business Score (when populated by N8N)
      const crsScore = Number(businessScore?.report?.score ?? 0);
      let computedFundabilityScore = 0;

      if (crsScore > 0) {
        computedFundabilityScore = crsScore;
      } else {
        // Priority 2: Audit-item ratio — same 4 checks as business-audit.ts
        const bizApps = (fundingApplications ?? []).filter(
          (a) => a.businessId === (business.id ?? ""),
        );

        if (bizApps.length > 0) {
          const app = bizApps[0];
          let verified = 0;
          let total = 0;

          // 1. Revenue
          if (app.annualBusinessRevenue || app.businessGrossProjectedRevenue1) {
            total++;
            verified++;
          }

          // 2. Tax returns
          if (app.businessFiledWithIRS1 !== undefined) {
            total++;
            if (app.businessFiledWithIRS1) verified++;
          }

          // 3. DTI
          if (
            dtiReport?.report &&
            Array.isArray(dtiReport.report) &&
            dtiReport.report.length > 0
          ) {
            const dtiData = (dtiReport.report as any[])[0];
            const dtiValue =
              dtiData.finalDTI || dtiData.dti || dtiData.debtToIncomeRatio;
            if (dtiValue) {
              const dtiPercent =
                typeof dtiValue === "number"
                  ? dtiValue
                  : parseFloat(dtiValue.toString().replace("%", ""));
              total++;
              if (dtiPercent < 20) verified++;
            }
          }

          // 4. Funding utilization (always verified when apps exist)
          total++;
          verified++;

          computedFundabilityScore =
            total > 0 ? Math.round((verified / total) * 100) : 0;
        }
      }

      return {
        ...business,
        crsBusinessProfile: businessProfile,
        crsBusinessScore: businessScore,
        computedFundabilityScore,
      };
    }),
  );

  const getPlaidCompleteData = await getPlaidCompleteDataForUser(userId);

  return {
    userData,
    crsReportData,
    fundingApplications,
    approvedFunds,
    businessesWithCrsData,
    getPlaidCompleteData,
  };
};
