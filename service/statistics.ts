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
    { states: {}, statuses: {} }
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
}

export const getClientStatistics = async (userId: string) => {
  const userData = await getUserById(userId);
  // get total funding applications amount
  const fundingApplications = await getApplyFunding(userId);

  const approvedFunds = await getFundMappingAnalysisDetails({
    userId,
    clientApplicationStatus: ["Approved", "Funded"],
  });

  // get total funding approved amount
  const crsReportData = await getCRSReport(userId);

  // get business details
  const businessDetails: Business[] = await getBusiness(userId);
  // get CRS business prorfile
  // get CRS business score
  const businessesWithCrsData = await Promise.all(
    businessDetails.map(async (business) => {
      const [businessProfile, businessScore] = await Promise.all([
        getCRSBusinessProfile(business.id ?? ""),
        getCRSBusinessScore(business.id ?? ""),
      ]);

      return {
        ...business,
        crsBusinessProfile: businessProfile,
        crsBusinessScore: businessScore,
      };
    })
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
