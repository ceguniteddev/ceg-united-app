import type { ClientData } from "@/components/ClientDashboard";
import type { FundingMetrics } from "@/components/dashboard/MetricCards";
import type { CreditScore } from "@/components/dashboard/CreditScoresSection";
import type { FundabilityScore } from "@/components/dashboard/FundabilityScoreCard";
import type { FinancialSnapshot } from "@/components/dashboard/FinancialSnapshotSection";
import type { Business } from "@/components/dashboard/MyBusinessesSection";
import type { NextStep } from "@/components/dashboard/NextStepsPanel";
import type { ApplicationStatus } from "@/components/dashboard/ApplicationStatusChart";

// ============================================
// Dashboard Data Mapper
// ============================================
// Transforms ClientData to component prop shapes

export interface DashboardData {
  fundingMetrics: FundingMetrics;
  creditScores: CreditScore[];
  fundabilityScore: FundabilityScore;
  financialSnapshot: FinancialSnapshot;
  businesses: Business[];
  nextSteps: NextStep[];
  applicationStatus: ApplicationStatus;
  creditAnalysis?: {
    issues: string[];
    negatives: string[];
    derogatory: string[];
  };
}

function detectBureau(
  report: any,
): "experian" | "transunion" | "equifax" | null {
  const fromScore = report.scores?.[0]?.sourceType;
  if (fromScore) {
    const s = fromScore.toLowerCase();
    if (s.includes("experian")) return "experian";
    if (s.includes("equifax")) return "equifax";
    if (s.includes("trans")) return "transunion";
  }

  const fromFile = report.creditFiles?.[0]?.creditFileDetail?.sourceType;
  if (fromFile) {
    const s = fromFile.toLowerCase();
    if (s.includes("experian")) return "experian";
    if (s.includes("equifax")) return "equifax";
    if (s.includes("trans")) return "transunion";
  }

  const r = report.repositoryIncluded;
  if (r) {
    if (r.experian) return "experian";
    if (r.equifax) return "equifax";
    if (r.transunion) return "transunion";
  }
  return null;
}

function getRating(score: number): CreditScore["rating"] {
  if (score >= 800) return "Excellent";
  if (score >= 740) return "Very Good";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  return "Poor";
}

export function transformClientDataToDashboard(
  clientData: ClientData | null | undefined,
): DashboardData | null {
  if (!clientData) return null;

  const {
    fundingApplications,
    crsReportData,
    businessesWithCrsData,
    getPlaidCompleteData,
  } = clientData;

  // 1. Funding Metrics
  const totalRequested =
    fundingApplications?.reduce((sum, app) => {
      const personalAmount = app.personalAmountFunding || 0;
      const businessAmount = app.businessAmountFunding || 0;
      return sum + Number(personalAmount) + Number(businessAmount);
    }, 0) || 0;

  // Calculate total approved from approvedFunds (approvedAmount field)
  const totalApproved =
    clientData.approvedFunds?.reduce((sum, currentApp) => {
      const amount = Number(currentApp.approvedAmount) || 0;
      return sum + amount;
    }, 0) ?? 0;

  // Calculate total funded from approvedFunds (fundedAmount field)
  const totalFunded =
    clientData.approvedFunds?.reduce((sum, currentApp) => {
      const amount = Number(currentApp.fundedAmount) || 0;
      return sum + amount;
    }, 0) ?? 0;

  const fundingMetrics: FundingMetrics = {
    totalRequested,
    totalApproved,
    totalFunded,
    requestedTrend: 12, // TODO: Calculate from historical data
    approvedTrend: totalApproved > 0 ? 8 : 0,
    fundedTrend: totalFunded > 0 ? 5 : 0,
  };

  // 2. Credit Scores
  const creditReports =
    crsReportData?.filter((d): d is any => {
      if (d.id === "issues" || d.id === "dti") return false;
      // Check if it's a credit report with scores (not IssueItem or DTI)
      return Array.isArray((d as any).report?.scores);
    }) || [];

  const creditScores: CreditScore[] = [];
  const seenBureaus = new Set<string>();

  for (const reportDoc of creditReports) {
    const bureau = detectBureau(reportDoc.report);
    if (!bureau || seenBureaus.has(bureau)) continue;

    const score = reportDoc.report.scores?.[0];
    if (!score?.scoreValue) continue;

    const scoreValue = Number(score.scoreValue);
    const accountNum =
      reportDoc.report.creditFiles?.[0]?.creditFileDetail?.fileNumber ||
      `XX-XXX${Math.floor(Math.random() * 9999)}`;

    creditScores.push({
      bureau,
      score: scoreValue,
      rating: getRating(scoreValue),
      accountNumber: accountNum,
      lastUpdated: reportDoc.createdAt || new Date().toISOString(),
    });

    seenBureaus.add(bureau);
  }

  // Fill missing bureaus with placeholders
  const allBureaus: Array<"experian" | "equifax" | "transunion"> = [
    "experian",
    "equifax",
    "transunion",
  ];
  for (const bureau of allBureaus) {
    if (!seenBureaus.has(bureau)) {
      creditScores.push({
        bureau,
        score: 0,
        rating: "Poor",
        accountNumber: "N/A",
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  // 3. Fundability Score
  // Pre-computed per-business in service/statistics.ts (single source of truth).
  // Same priority logic as service/business-audit.ts:
  //   Priority 1 — CRS business score (when populated by N8N)
  //   Priority 2 — Verified audit-item ratio (revenue, tax, DTI, utilization)
  const avgBusinessScore =
    businessesWithCrsData.length > 0
      ? businessesWithCrsData.reduce(
          (sum, biz) => sum + ((biz as any).computedFundabilityScore ?? 0),
          0,
        ) / businessesWithCrsData.length
      : 0;

  const fundabilityScore: FundabilityScore = {
    score: Math.round(avgBusinessScore),
    maxScore: 100,
    status:
      avgBusinessScore >= 80
        ? "Excellent"
        : avgBusinessScore >= 60
          ? "Good"
          : avgBusinessScore >= 40
            ? "Fair"
            : "Needs Improvement",
  };

  // 4. Financial Snapshot - Calculate from Plaid data
  const allTransactions =
    getPlaidCompleteData?.flatMap((d) => d.transaction || []) || [];
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const monthlyDeposits = allTransactions
    .filter((t: any) => new Date(t.date) >= oneMonthAgo && t.amount < 0)
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

  const allBalances =
    getPlaidCompleteData?.flatMap((d) => d.balance || []) || [];
  const personalAccountsBalances = allBalances.filter(
    (b: any) => b.type === "depository",
  );
  const avgBalance =
    personalAccountsBalances.length > 0
      ? personalAccountsBalances.reduce(
          (sum: number, b: any) => sum + (b.balances?.current || 0),
          0,
        ) / personalAccountsBalances.length
      : 0;

  const allBankIncome =
    getPlaidCompleteData?.flatMap((d) => d.bank_income || []) || [];
  const monthlyIncomes = allBankIncome
    .flatMap((bi: any) => bi.bank_income_summary?.historical_summary || [])
    .map((summary: any) => summary.total_amount);
  const verifiedIncome =
    monthlyIncomes.length > 0
      ? monthlyIncomes.reduce((a: number, b: number) => a + b, 0) /
        monthlyIncomes.length
      : 0;

  const financialSnapshot: FinancialSnapshot = {
    monthlyDeposits: Math.round(monthlyDeposits),
    monthlyDepositsStatus: monthlyDeposits < 5000 ? "Low activity" : "Healthy",
    monthlyDepositsInsight: "Increase for stronger approvals",
    avgBalance: Math.round(avgBalance),
    avgBalanceStatus: avgBalance > 10000 ? "Good" : "Moderate",
    avgBalanceInsight: "Lenders prefer $10K+",
    verifiedIncome: Math.round(verifiedIncome),
    verifiedIncomeStatus:
      verifiedIncome > 60000 ? "Sufficient" : "Insufficient",
    verifiedIncomeInsight: "Needs $60K+",
  };

  // 5. Businesses
  const businesses: Business[] = businessesWithCrsData.map((biz) => ({
    id: biz.id || "",
    name: biz.businessName,
    status: biz.crsBusinessProfile ? "Active" : "Pending",
    fundabilityScore: biz.crsBusinessScore?.score,
    commercialScore:
      biz.crsBusinessProfile?.report?.scoreInformation?.commercialScore
        ?.score || null,
    ein: biz.employerIdentificationNumber,
    accountBalance: biz.crsBusinessProfile?.report?.accountBalance || null,
    financialStabilityRisk:
      biz.crsBusinessScore?.report?.scoreInformation?.fsrScore?.riskClass
        ?.definition ||
      biz.crsBusinessScore?.financialStabilityRisk ||
      "INSUFFICIENT DATA TO SCORE",
    monthlyDeposits: biz.crsBusinessProfile?.report?.monthlyDeposits || null,
  }));

  // 6. Next Steps (hardcoded for now - TODO: integrate with user onboarding state)

  const hasBankStatements =
    (getPlaidCompleteData?.length || 0) > 0 ||
    clientData.userDocuments?.some(
      (doc) =>
        doc.name.includes("PERSONAL_BANK_STATEMENTS") ||
        doc.name.includes("BANK_STATEMENTS"),
    ) ||
    false;

  let hasBusiness = businessesWithCrsData.length > 0;
  let hasApplied = (fundingApplications?.length || 0) > 0;

  const nextSteps: NextStep[] = [
    {
      id: "step-1",
      label: "Upload bank statements",
      completed: hasBankStatements,
      icon: "upload",
      href: !hasBankStatements ? "/client/my-documents" : undefined,
    },
    {
      id: "step-2",
      label: "Add business EIN",
      completed: hasBusiness,
      icon: "building",
      href: !hasBusiness ? "/client/my-business" : undefined,
    },
    {
      id: "step-3",
      label: "Apply to matched lenders",
      completed: hasApplied,
      icon: "send",
      href: !hasApplied ? "/client/income-funding" : undefined,
    },
  ];

  // 7. Application Status (using schema statuses: New, Processing, Pre-Approved, Approved, Declined)
  // Note: Pre-Approved and Approved are combined into one "Approved" segment
  const newApps =
    fundingApplications?.filter((app) => app.status === "New").length || 0;
  const processing =
    fundingApplications?.filter((app) => app.status === "Processing").length ||
    0;
  const preApproved =
    fundingApplications?.filter((app) => app.status === "Pre-Approved")
      .length || 0;
  const approved =
    fundingApplications?.filter((app) => app.status === "Approved").length || 0;
  const declined =
    fundingApplications?.filter((app) => app.status === "Declined").length || 0;

  const applicationStatus: ApplicationStatus = {
    total: fundingApplications?.length || 0,
    new: newApps,
    processing,
    approved: preApproved + approved, // Combined Pre-Approved + Approved
    declined,
  };

  // 8. Credit Analysis (Issues)
  const issuesDoc = crsReportData?.find((d) => d.id === "issues") as any;
  const reportIssues = issuesDoc?.report?.[0]?.issues ?? [];
  const reportNegatives = issuesDoc?.report?.[0]?.negatives ?? [];
  const reportDerogatory = issuesDoc?.report?.[0]?.degoretory ?? [];

  const creditAnalysis =
    reportIssues.length > 0 ||
    reportNegatives.length > 0 ||
    reportDerogatory.length > 0
      ? {
          issues: reportIssues,
          negatives: reportNegatives,
          derogatory: reportDerogatory,
        }
      : undefined;

  return {
    fundingMetrics,
    creditScores,
    fundabilityScore,
    financialSnapshot,
    businesses,
    nextSteps,
    applicationStatus,
    creditAnalysis,
  };
}
