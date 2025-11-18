"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Landmark,
  FileText,
  TrendingUp,
  Scale,
  AlertCircle,
  Briefcase,
  Banknote,
  CalendarDays,
  BanknoteArrowUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

// --- IMPORT YOUR ACTUAL APPLICATION TYPES ---
import { User, UserWithId } from "@/schema/registration";
import { ApplyFunding } from "@/schema/apply-funding";
import { PlaidCompleteRow } from "@/service/plaid/data";
import { Business } from "@/schema";
import { CreditScore } from "@/types/crs";
import { ApprovedBankFormData } from "@/schema/bank-products";
import { Button } from "./ui/button";
import { ResponsiveDialog } from "./responsive-dialog";
import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";
import CalendlyScheduler from "@/components/support-service/CalendlyScheduler";
import ApplyFundingForm from "@/components/fundingv2/ApplyFundingForm";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface IssueItem {
  issues: string[];
  negatives: string[];
  degoretory: string[];
  downPaymentRequired: boolean | string;
}

// --- 1. ADD DETAILED TYPE DEFINITIONS FOR CRS DATA ---
interface IssuesReportData {
  id: "issues";
  type: "issues";
  userId: string;
  createdAt: string;
  report: IssueItem[];
}

interface DTIReportData {
  id: "dti";
  type: "dti";
  userId: string;
  createdAt: string;
  report: {
    monthlyIncome: string;
    monthlyDebtPayments: string;
    finalDTI: string;
  }[];
}

interface CreditReport {
  repositoryIncluded?: {
    transunion: boolean;
    experian: boolean;
    equifax: boolean;
  };
  creditFiles?: Array<{
    creditFileDetail?: {
      sourceType?: string;
    };
  }>;
  scores?: CreditScore[];
}

interface CreditReportWithId {
  id: string;
  userId: string;
  report: CreditReport;
  createdAt: string; // Assuming createdAt is a string date
}

interface BusinessWithCRSData extends Business {
  crsBusinessProfile?: { report?: any } | null;
  crsBusinessScore?: any | null;
}

export interface ClientData {
  userData: UserWithId | null;
  crsReportData:
    | (CreditReportWithId | IssuesReportData | DTIReportData)[]
    | null;
  fundingApplications: ApplyFunding[] | null;
  approvedFunds?: ApprovedBankFormData[] | null;
  businessesWithCrsData: BusinessWithCRSData[];
  getPlaidCompleteData: PlaidCompleteRow[] | null;
}

// --- 2. YOUR HELPER FUNCTIONS (NOW FULLY TYPED) ---
function bureauLabel(sourceType?: string): string {
  const s = (sourceType || "").toLowerCase();
  if (s.includes("experian")) return "Experian";
  if (s.includes("equifax")) return "Equifax";
  if (s.includes("trans")) return "TransUnion";
  return sourceType || "Unknown";
}

function detectBureau(
  report: CreditReport
): "Experian" | "TransUnion" | "Equifax" | null {
  const fromScore = report.scores?.[0]?.sourceType;
  if (fromScore) return bureauLabel(fromScore) as any;

  const fromFile = report.creditFiles?.[0]?.creditFileDetail?.sourceType;
  if (fromFile) return bureauLabel(fromFile) as any;

  const r = report.repositoryIncluded;
  if (r) {
    const truths = [
      r.experian ? "Experian" : null,
      r.transunion ? "TransUnion" : null,
      r.equifax ? "Equifax" : null,
    ].filter(Boolean) as ("Experian" | "TransUnion" | "Equifax")[];
    if (truths.length === 1) return truths[0];
  }
  return null;
}

function groupByBureau(
  docs?: (CreditReportWithId | IssuesReportData | DTIReportData)[] | null
) {
  const out: Record<
    "Experian" | "TransUnion" | "Equifax",
    CreditReportWithId | null
  > = {
    Experian: null,
    TransUnion: null,
    Equifax: null,
  };
  if (!docs) return out;

  // Filter for actual credit reports before grouping to avoid processing the 'issues' object
  const creditDocs = docs.filter(
    (d): d is CreditReportWithId => d.id !== "issues" && d.id !== "dti"
  );

  for (const d of creditDocs) {
    const bureau = d?.report ? detectBureau(d.report) : null;
    if (!bureau) continue;
    const prev = out[bureau];
    if (!prev) {
      out[bureau] = d;
    } else {
      const prevTs = new Date(prev.createdAt).getTime();
      const curTs = new Date(d.createdAt).getTime();
      if (curTs >= prevTs) {
        out[bureau] = d;
      }
    }
  }
  return out;
}

// --- HELPER COMPONENTS ---
const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  className = "",
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  className?: string;
}) => (
  <Card className={className}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);
const FundingStatusChart = ({ data }: { data: ApplyFunding[] | null }) => {
  const chartData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };
    const statusCounts = data.reduce((acc, app) => {
      const status = app.status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return {
      labels: Object.keys(statusCounts),
      datasets: [
        {
          label: "Applications",
          data: Object.values(statusCounts),
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)",
            "rgba(249, 115, 22, 0.7)",
            "rgba(34, 197, 94, 0.7)",
            "rgba(239, 68, 68, 0.7)",
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(249, 115, 22, 1)",
            "rgba(34, 197, 94, 1)",
            "rgba(239, 68, 68, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [data]);
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center">
        <FileText className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">No Funding Applications</p>
        <p className="text-xs text-muted-foreground">
          Apply for funding to see your status here.
        </p>
      </div>
    );
  }
  return (
    <Doughnut
      data={chartData}
      options={{ responsive: true, maintainAspectRatio: false }}
    />
  );
};

const ScoreCard: React.FC<{
  bureau: "Experian" | "Equifax" | "TransUnion";
  score?: CreditScore;
}> = ({ bureau, score }) => {
  const value = score?.scoreValue ? Number(score.scoreValue) : undefined;
  const max = score?.scoreMaximumValue ? Number(score.scoreMaximumValue) : 850;
  const pct = value && max ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-500">{bureau}</div>
          <div className="text-3xl font-bold mt-1">{value ?? "—"}</div>
        </div>
        <div className="w-28">
          <div className="h-2 w-full rounded bg-neutral-100 overflow-hidden">
            <div
              className="h-2 rounded bg-black"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            {value ? `${pct}% of max` : "No score"}
          </div>
        </div>
      </div>
      {score?.modelName && (
        <div className="text-xs text-neutral-500 mt-2">{score.modelName}</div>
      )}
    </Card>
  );
};

const DTICard: React.FC<{
  data: {
    monthlyIncome: string;
    monthlyDebtPayments: string;
    finalDTI: string;
  } | null;
}> = ({ data }) => {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debt-to-Income Ratio</CardTitle>
          <CardDescription>
            Your debt-to-income (DTI) ratio could not be calculated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No DTI data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debt-to-Income Ratio</CardTitle>
        <CardDescription>
          A summary of your debt-to-income ratio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Monthly Income</span>
          <span className="font-semibold">{data.monthlyIncome}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Monthly Debt Payments</span>
          <span className="font-semibold">{data.monthlyDebtPayments}</span>
        </div>
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Final DTI</span>
          <span>{data.finalDTI}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
export const ClientDashboard = ({
  clientData,
  adminView,
}: {
  clientData: ClientData | null | undefined;
  adminView?: boolean;
}) => {
  const { denefitsContract, isLoading } = useGetDenefitsContractsByUserId(
    clientData?.userData?.id || ""
  );

  const [isOpen, setIsOpen] = useState(false);

  const [isOpenFunding, setIsOpenFunding] = useState(
    adminView === false || adminView === undefined
  );

  const stats = useMemo(() => {
    if (!clientData) return null;

    const totalRequested =
      clientData.fundingApplications?.reduce((sum, app) => {
        const personalAmount = app.personalAmountFunding || 0;
        const businessAmount = app.businessAmountFunding || 0;

        return sum + Number(personalAmount) + Number(businessAmount);
      }, 0) ?? 0;

    const totalApproved =
      clientData.approvedFunds
        // ?.filter((app) => app.clientApplicationStatus === "Approved")
        ?.reduce((sum, currentApp) => {
          const amount = Number(currentApp.approvedAmount) || 0;
          return sum + amount;
        }, 0) ?? 0;

    const totalFunded =
      clientData.approvedFunds
        // ?.filter((app) => app.clientApplicationStatus === "Approved")
        ?.reduce((sum, currentApp) => {
          const amount = Number(currentApp.fundedAmount) || 0;
          return sum + amount;
        }, 0) ?? 0;

    const allPlaidData = clientData.getPlaidCompleteData || [];
    const allTransactions = allPlaidData.flatMap((d) => d.transaction || []);
    const allBalances = allPlaidData.flatMap((d) => d.balance || []);
    const allBankIncome = allPlaidData.flatMap((d) => d.bank_income || []);
    const personalAccountsBalances = allBalances.filter(
      (b) => b.type === "depository"
    );
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastMonthDeposits = allTransactions
      .filter((t) => new Date(t.date) >= oneMonthAgo && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalCurrentBalance = personalAccountsBalances.reduce(
      (sum, b) => sum + (b.balances.current || 0),
      0
    );
    const averageMonthlyBalance =
      personalAccountsBalances.length > 0
        ? totalCurrentBalance / personalAccountsBalances.length
        : 0;
    const monthlyIncomes = allBankIncome
      .flatMap((bi) => bi.bank_income_summary?.historical_summary || [])
      .map((summary) => summary.total_amount);
    const averageMonthlyIncome =
      monthlyIncomes.length > 0
        ? monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length
        : 0;

    // --- 3. REVISED Credit Score Extraction Logic ---
    const bureauMap = groupByBureau(clientData.crsReportData || []);

    const scoresByBureau: Record<
      "Experian" | "TransUnion" | "Equifax",
      CreditScore | undefined
    > = {
      Experian: bureauMap.Experian?.report.scores?.[0],
      TransUnion: bureauMap.TransUnion?.report.scores?.[0],
      Equifax: bureauMap.Equifax?.report.scores?.[0],
    };

    const issuesData = clientData.crsReportData?.find(
      (d) => d.id === "issues"
    ) as IssuesReportData | undefined;

    const dtiData = clientData.crsReportData?.find((d) => d.id === "dti") as
      | DTIReportData
      | undefined;

    const reportIssues = issuesData?.report[0]?.issues ?? [];
    const reportNegatives = issuesData?.report[0]?.negatives ?? [];
    const reportDerogatory = issuesData?.report[0]?.degoretory ?? [];

    const initialValue = issuesData?.report[0]?.downPaymentRequired;
    const dtiReport = dtiData?.report[0] ?? null;
    let downPaymentRequired =
      typeof initialValue === "string"
        ? initialValue.toLowerCase() === "true"
        : Boolean(initialValue);

    if (denefitsContract && denefitsContract.length > 0) {
      downPaymentRequired = false;
    } else if (dtiReport && parseFloat(dtiReport.finalDTI) > 50) {
      downPaymentRequired = true;
    }

    /**
     * downPaymentRequired note
     * If the audit contains any of the following items: 'late payments', 'charge-off', 'collections', or 'bankruptcy', set `downPaymentRequired` to `true`
     * if DTI > 50
     */

    return {
      totalRequested,
      totalApproved,
      totalFunded,
      lastMonthDeposits,
      averageMonthlyBalance,
      averageMonthlyIncome,
      scoresByBureau,
      reportIssues,
      reportNegatives,
      reportDerogatory,
      dtiReport,
      downPaymentRequired,
    };
  }, [clientData, denefitsContract]);

  const handleSignUp = useCallback(() => {
    let url = process.env.NEXT_PUBLIC_DEFENITS_URL;
    if (stats?.downPaymentRequired) {
      url = process.env.NEXT_PUBLIC_FANBASIS_URL;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }, [stats]);

  useEffect(() => {
    if (
      stats?.downPaymentRequired === true &&
      (adminView === false || adminView === undefined)
    ) {
      setIsOpen(true);
    }
  }, [stats, adminView]);

  // useEffect(() => {
  //   if (denefitsContract && denefitsContract.length > 0) {
  //     setIsOpenFunding(true);
  //   }
  // }, [denefitsContract]);

  if (!clientData || !stats) {
    return (
      <div className="flex items-center justify-center p-10 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
            Data Not Available
          </h3>
          <p className="mt-1 text-sm text-gray-500">{`We couldn't load the dashboard data.`}</p>
        </div>
      </div>
    );
  }

  const { userData, fundingApplications, businessesWithCrsData } = clientData;
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 md:p-6 bg-gray-50/50 dark:bg-background">
      <header className="flex flex-col sm:flex-row items-start gap-3 sm:gap-0 sm:justify-between">
        <ResponsiveDialog
          isOpen={isOpenFunding}
          setIsOpen={setIsOpenFunding}
          title="Apply Funding"
          description={""}
          descriptionClassName="text-red-500 text-lg font-semibold"
          className="w-full sm:w-5/6 lg:w-4/6 max-w-4xl"
        >
          <ApplyFundingForm
            setOpen={setIsOpenFunding}
            userId={userData?.id || ""}
          />
        </ResponsiveDialog>
        <ResponsiveDialog
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          title=""
          description={""}
          className="w-full sm:w-5/6 md:w-4/6 lg:w-3/6 max-w-2xl"
        >
          <CreditRepairClientMessage setIsOpen={setIsOpen} />
        </ResponsiveDialog>
        <div className="flex-1">
          {adminView ? (
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              {`${userData?.firstName} ${userData?.lastName}` || "Client"}
            </h1>
          ) : (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                Welcome, {userData?.firstName || "Client"}!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">{`Here's a summary of your financial overview.`}</p>
            </div>
          )}
        </div>
        {!adminView && (
          <Button
            className="signup-link-playful w-full sm:w-auto"
            onClick={handleSignUp}
          >
            Sign Up
          </Button>
        )}
      </header>

      <main className="grid gap-4 sm:gap-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
          <StatCard
            title="Total Requested Amount"
            value={formatCurrency(stats.totalRequested)}
            description="Sum of all funding applications"
            icon={FileText}
          />
          <StatCard
            title="Total Approved Amount"
            value={formatCurrency(stats.totalApproved)}
            description="Total funds approved to date"
            icon={DollarSign}
          />
          <StatCard
            title="Total Funded Amount"
            value={formatCurrency(stats.totalFunded)}
            description="Total amount funded to date"
            icon={BanknoteArrowUp}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className={stats.dtiReport ? "md:col-span-2" : "md:col-span-3"}>
            <Card>
              <CardHeader>
                <CardTitle>Personal Credit Scores</CardTitle>
                <CardDescription>
                  Scores from the three major credit bureaus.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ScoreCard
                  bureau="Experian"
                  score={stats.scoresByBureau.Experian}
                />
                <ScoreCard
                  bureau="Equifax"
                  score={stats.scoresByBureau.Equifax}
                />
                <ScoreCard
                  bureau="TransUnion"
                  score={stats.scoresByBureau.TransUnion}
                />
              </CardContent>
            </Card>
          </div>
          {stats.dtiReport && <DTICard data={stats.dtiReport} />}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Financial Snapshot</CardTitle>
              <CardDescription>
                Based on your connected Plaid accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <StatCard
                title="Last Month's Deposits"
                value={formatCurrency(stats.lastMonthDeposits)}
                description="Total deposits in the last 30 days"
                icon={TrendingUp}
              />
              <StatCard
                title="Avg. Monthly Balance"
                value={formatCurrency(stats.averageMonthlyBalance)}
                description="Average of current account balances"
                icon={Scale}
              />
              <StatCard
                title="Avg. Verified Income"
                value={formatCurrency(stats.averageMonthlyIncome)}
                description="Average monthly income from Plaid"
                icon={Banknote}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>Breakdown of your applications.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] w-full">
              <FundingStatusChart data={fundingApplications} />
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">Business Profiles</h2>
          </div>
          {businessesWithCrsData && businessesWithCrsData.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              {businessesWithCrsData.map((business) => {
                const profile = business.crsBusinessProfile?.report;
                const commScore = profile?.scoreInformation?.commercialScore;
                const fsrScore = profile?.scoreInformation?.fsrScore;
                const isActive =
                  profile?.commercialFraudShieldSummary
                    ?.activeBusinessIndicator;

                return (
                  <Card key={business.id} className="flex flex-col">
                    <CardHeader className="pb-3 sm:pb-6">
                      <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-0 sm:justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg sm:text-xl">
                            {business.businessName}
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm">
                            Employer Idenfication Number:{" "}
                            {business.employerIdentificationNumber}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={isActive ? "default" : "destructive"}
                          className={isActive ? "bg-green-600 text-white" : ""}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="grid flex-grow grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {commScore?.score ?? "N/A"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Business Credit Score
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md">
                          <Landmark className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {fsrScore?.riskClass.definition ?? "N/A"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Financial Stability Risk
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 opacity-60">
                        <div className="p-2 bg-gray-500/10 rounded-md">
                          <DollarSign className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-semibold">N/A</p>
                          <p className="text-muted-foreground text-xs">
                            Account Balance
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 opacity-60">
                        <div className="p-2 bg-gray-500/10 rounded-md">
                          <CalendarDays className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-semibold">N/A</p>
                          <p className="text-muted-foreground text-xs">
                            Monthly Deposits
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    {/* <div className="p-4 pt-0">
                      <Button variant="secondary" className="w-full">
                        View Full Report <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div> */}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground" />
              <CardTitle className="mt-4">No Businesses Found</CardTitle>
              <CardDescription className="mt-2">
                Add a business profile to get started.
              </CardDescription>
            </Card>
          )}
        </div>

        <IssuesCard
          issues={stats.reportIssues}
          negatives={stats.reportNegatives}
          derogatory={stats.reportDerogatory}
        />
      </main>
    </div>
  );
};

const IssuesCard = ({
  issues,
  negatives,
  derogatory,
}: {
  issues: string[];
  negatives: string[];
  derogatory: string[];
}) => {
  if (
    issues.length === 0 &&
    negatives.length === 0 &&
    derogatory.length === 0
  ) {
    return null; // Don't render the card if there's no data
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Analysis</CardTitle>
        <CardDescription>
          Summary and potential issues from your credit analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {issues.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
              Analysis Notes
            </h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {issues.map((item, index) => (
                <li key={`issue-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {negatives.length > 0 && (
          <div>
            <h4 className="font-semibold text-orange-600 dark:text-orange-500 mb-1">
              Negative Items
            </h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {negatives.map((item, index) => (
                <li key={`negative-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {derogatory.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-600 dark:text-red-500 mb-1">
              Derogatory Marks
            </h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {derogatory.map((item, index) => (
                <li key={`derogatory-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CreditRepairClientMessage = ({
  setIsOpen,
}: {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="bg-card text-card-foreground rounded-xl border shadow-lg max-w-lg mx-auto font-sans">
        <div className="flex flex-col space-y-1.5 p-4 sm:p-6">
          <h3 className="font-semibold tracking-tight text-xl sm:text-2xl">
            Complete Your Enrollment
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Please follow the steps below to finalize your application.
          </p>
        </div>
        <div className="p-4 sm:p-6 pt-0">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 mr-3 mt-1" />
              <div className="flex-1">
                <h5 className="font-semibold mb-1">Action Required</h5>
                <p className="text-sm">
                  Based on your personal credit profile, a two-step payment
                  process is necessary to get started.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <h4 className="font-semibold text-sm sm:text-md mb-2">
                Step 1: Initial Payment
              </h4>
              <p className="text-muted-foreground mb-4 text-sm">
                First, please submit the initial payment of **$2,000** through
                our secure Fanbasis link. This will register you in our system.
              </p>
              <Link
                href={process.env.NEXT_PUBLIC_FANBASIS_URL as string}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
              >
                Pay with Fanbasis ($2,000)
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div>
              <h4 className="font-semibold text-sm sm:text-md mb-2">
                Step 2: Enrollment Fee
              </h4>
              <p className="text-muted-foreground text-sm">
                After completing the first step, Fanbasis will automatically
                redirect you to complete the final **$39 enrollment fee** with
                Denefits.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                This finalizes your enrollment and gives you full access to our
                services.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center p-4 sm:p-6 pt-0">
          <p className="text-xs text-muted-foreground">
            {`If you have any questions, please don't hesitate to contact our
          support team.`}
          </p>
        </div>
        <div className="flex items-center justify-end p-4 sm:p-6 pt-0">
          <Button
            className="cursor-pointer bg-blue-200 hover:bg-blue-300"
            variant={"outline"}
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </div>
      </div>
      <CalendlyScheduler />
    </div>
  );
};
