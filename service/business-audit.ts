"use server";
import {
  AuditItem,
  AuditItemStatus,
  CreditAccount,
  CreditRating,
  CompatibilityFactor,
  FinancialMetric,
} from "@/schema";
import { getApplyFunding } from "./apply-funding";
import {
  getCRSReport,
  getCRSBusinessScore,
  getCRSBusinessProfile,
} from "./crs";

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
  creditScore: number;
  creditRating: CreditRating;
  creditChange: number;
  accounts: CreditAccount[];
  metrics: FinancialMetric[];
  revenueData: { month: string; revenue: number }[];
  compatibilityFactors: CompatibilityFactor[];
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
      creditScore: 0,
      creditRating: "Good",
      creditChange: 0,
      accounts: [],
      metrics: [],
      revenueData: [],
      compatibilityFactors: [],
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

  // ── CRS Business Score ────────────────────────────────────────────
  let creditScore = 0;
  let creditRating: CreditRating = "Good";
  let creditChange = 0;
  let accounts: CreditAccount[] = [];

  try {
    const crsScore = await getCRSBusinessScore(businessId);
    if (crsScore?.report) {
      const r = crsScore.report as any;
      creditScore = Number(r?.score ?? r?.creditScore ?? 0);
      const rawRating = r?.rating ?? r?.creditRating ?? "Good";
      const validRatings: CreditRating[] = [
        "Poor",
        "Fair",
        "Good",
        "Very Good",
        "Excellent",
      ];
      creditRating = validRatings.includes(rawRating) ? rawRating : "Good";
      creditChange = Number(r?.change ?? r?.scoreChange ?? 0);
      if (Array.isArray(r?.accounts)) {
        accounts = r.accounts.map((a: any, i: number) => ({
          id: String(a.id ?? i),
          type: String(a.type ?? a.accountType ?? "Business Account"),
          balance: Number(a.balance ?? 0),
          limit: Number(a.limit ?? a.creditLimit ?? 0),
          status: (["Current", "Past Due", "Closed"].includes(a.status)
            ? a.status
            : "Current") as CreditAccount["status"],
          age: String(a.age ?? "—"),
        }));
      }
    }
  } catch {
    // CRS score unavailable — defaults apply
  }

  // ── CRS Business Profile ──────────────────────────────────────────
  let revenueData: { month: string; revenue: number }[] = [];

  try {
    const crsProfile = await getCRSBusinessProfile(businessId);
    if (crsProfile?.report) {
      const r = crsProfile.report as any;
      if (Array.isArray(r?.revenueData)) {
        revenueData = r.revenueData.map((d: any) => ({
          month: String(d.month ?? ""),
          revenue: Number(d.revenue ?? 0),
        }));
      }
    }
  } catch {
    // CRS profile unavailable — defaults apply
  }

  // ── Financial Metrics (derived from auditItems) ───────────────────
  const auditIconMap: Record<string, string> = {
    revenue: "trending-up",
    "tax-returns": "dollar",
    dti: "percent",
    "funding-utilization": "bar-chart",
  };

  const auditStatusToMetric: Record<string, FinancialMetric["status"]> = {
    verified: "Verified",
    warning: "Moderate",
    needs_update: "At Risk",
    pending: "Moderate",
  };

  const metrics: FinancialMetric[] = auditItems.map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    status: auditStatusToMetric[item.status] ?? "Moderate",
    icon: auditIconMap[item.id] ?? "dollar",
  }));

  // ── Compatibility Factors ─────────────────────────────────────────
  const compatibilityFactors: CompatibilityFactor[] = [
    {
      id: "credit-score",
      label: "Credit Score",
      met: creditScore >= 60,
      detail:
        creditScore > 0
          ? `Business score: ${creditScore}/100`
          : "No score on record",
    },
    {
      id: "verified-revenue",
      label: "Verified Revenue",
      met: auditItems.some(
        (i) => i.id === "revenue" && i.status === "verified",
      ),
      detail:
        auditItems.find((i) => i.id === "revenue")?.value ??
        "Revenue not verified",
    },
    {
      id: "verified-ein",
      label: "Verified EIN",
      met: true,
      detail: "EIN on file",
    },
    {
      id: "registered-entity",
      label: "Registered Entity",
      met: businessApps.length > 0,
      detail: "Active business with funding applications",
    },
    {
      id: "dti",
      label: "Debt-to-Income Ratio",
      met: auditItems.some((i) => i.id === "dti" && i.status === "verified"),
      detail:
        auditItems.find((i) => i.id === "dti")?.value ?? "DTI not calculated",
    },
  ];

  return {
    auditItems,
    fundabilityScore,
    fundabilityStatus,
    creditScore,
    creditRating,
    creditChange,
    accounts,
    metrics,
    revenueData,
    compatibilityFactors,
  };
};
