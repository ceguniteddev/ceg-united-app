import { getUsers } from "./user";
import { getFundingApplications } from "./apply-funding";

// get all registered user
export const getAdminStatistics = async (): Promise<AdminStatistics> => {
  const usersClient = await getUsers("Client");
  const fundingApplications = await getFundingApplications();

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

export const getClientStatistics = async (userId: string) => {
  // get total funding applications amount
  // get total funding approved amount
  // get business details
  // get CRS data
};
