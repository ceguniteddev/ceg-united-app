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

// get all registered user
export const getAdminStatistics = async (): Promise<AdminStatistics> => {
  const usersClient = await getUsers("Client");
  const fundingApplications = await getFundingApplications({});

  if (!fundingApplications) {
    return {
      totalClients: usersClient?.length ?? 0,
      totalFundingApplications: 0,
      countsByState: {},
      countsByStatus: {},
    };
  }

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
    countsByState: counts.states,
    countsByStatus: counts.statuses,
  };
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
    clientApplicationStatus: ["Approved"],
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
