"use server";
import { AuditItem, AuditItemStatus } from "@/schema";
import { getApplyFunding } from "./apply-funding";
import { getCRSReport } from "./crs";

/**
 * Get business audit items from funding applications and CRS data
 */
export const getBusinessAuditData = async (
  userId: string,
  businessId: string,
): Promise<{
  auditItems: AuditItem[];
  fundabilityScore: number;
  fundabilityStatus: string;
}> => {
  // Get all funding applications for this user
  const allApps = await getApplyFunding(userId);

  // Filter to only apps related to this business
  const businessApps =
    allApps?.filter((app) => app.businessId === businessId) || [];

  // Only generate audit items if there's at least one business funding application
  if (businessApps.length === 0) {
    return {
      auditItems: [],
      fundabilityScore: 0,
      fundabilityStatus: "No Data",
    };
  }

  // Get CRS DTI data
  const crsReports = await getCRSReport(userId, true, ["dti"]);

  const dtiReport = crsReports?.find((report) => report.type === "dti");

  const auditItems: AuditItem[] = [];

  // Use the most recent funding application for business data
  const latestApp = businessApps[0]; // Already sorted by date in getApplyFunding

  // 1. Business Revenue
  const revenue =
    latestApp.annualBusinessRevenue || latestApp.businessGrossProjectedRevenue1;
  if (revenue) {
    auditItems.push({
      id: "revenue",
      label: "Business Revenue",
      value: `$${Number(revenue).toLocaleString()}`,
      status: "verified" as AuditItemStatus,
      statusLabel: "Verified",
      checkable: true,
    });
  }

  // 2. Business Tax Returns
  const taxFiled = latestApp.businessFiledWithIRS1;
  if (taxFiled !== undefined) {
    auditItems.push({
      id: "tax-returns",
      label: "Business Tax Returns",
      value: taxFiled ? `Filed ${new Date().getFullYear()}` : "Not Filed",
      status: taxFiled
        ? ("verified" as AuditItemStatus)
        : ("warning" as AuditItemStatus),
      statusLabel: taxFiled ? "Verified" : "Needs Update",
      checkable: true,
    });
  }

  // 3. Debt-to-Income Ratio
  if (
    dtiReport?.report &&
    Array.isArray(dtiReport.report) &&
    dtiReport.report.length > 0
  ) {
    const dtiData = dtiReport.report[0];
    const dtiValue =
      dtiData.finalDTI || dtiData.dti || dtiData.debtToIncomeRatio;

    if (dtiValue) {
      // Parse percentage string (e.g., "30%" -> 30)
      const dtiPercent =
        typeof dtiValue === "number"
          ? dtiValue
          : parseFloat(dtiValue.toString().replace("%", ""));

      const status: AuditItemStatus =
        dtiPercent < 20
          ? "verified"
          : dtiPercent < 40
            ? "warning"
            : "needs_update";

      auditItems.push({
        id: "dti",
        label: "Debt-to-Income Ratio",
        value: `${Math.round(dtiPercent)}%`,
        status,
        statusLabel: status === "verified" ? "Verified" : "Review Needed",
        checkable: true,
      });
    }
  }

  // 4. Funding Utilization
  if (businessApps.length > 0) {
    const totalBorrowed = businessApps.reduce((sum, app) => {
      const amount = Number(
        app.businessAmountFunding || app.personalAmountFunding || 0,
      );
      return sum + amount;
    }, 0);

    auditItems.push({
      id: "funding-utilization",
      label: "Funding Utilization",
      value: `Total borrowed $${totalBorrowed.toLocaleString()}`,
      status: "verified" as AuditItemStatus,
      statusLabel: "Verified",
      checkable: true,
    });
  }

  // Calculate fundability score based on available data
  let fundabilityScore = 0;
  let fundabilityStatus = "Pending Review";

  if (auditItems.length > 0) {
    const verifiedCount = auditItems.filter(
      (item) => item.status === "verified",
    ).length;
    const totalCount = auditItems.length;
    fundabilityScore = Math.round((verifiedCount / totalCount) * 100);

    if (fundabilityScore >= 80) {
      fundabilityStatus = "Excellent";
    } else if (fundabilityScore >= 60) {
      fundabilityStatus = "Good";
    } else if (fundabilityScore >= 40) {
      fundabilityStatus = "Fair";
    } else {
      fundabilityStatus = "Needs Improvement";
    }
  }

  return {
    auditItems,
    fundabilityScore,
    fundabilityStatus,
  };
};
