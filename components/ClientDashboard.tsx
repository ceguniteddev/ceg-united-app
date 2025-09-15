"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Landmark,
  FileText,
  TrendingUp,
  Scale,
  PlusCircle,
  AlertCircle,
  Briefcase,
  Banknote,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

// --- IMPORT YOUR ACTUAL APPLICATION TYPES ---
import { User } from "@/schema/registration";
import { ApplyFunding } from "@/schema/apply-funding";
import { PlaidCompleteRow } from "@/service/plaid/data";
import { Business } from "@/schema";
import { CreditScore } from "@/types/crs";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// --- 1. ADD DETAILED TYPE DEFINITIONS FOR CRS DATA ---

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
  userData: User | null;
  crsReportData: CreditReportWithId[] | null; // Use the detailed type
  fundingApplications: ApplyFunding[] | null;
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

function detectBureau(report: CreditReport): "Experian" | "TransUnion" | "Equifax" | null {
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

function groupByBureau(docs?: CreditReportWithId[] | null) {
  const out: Record<"Experian" | "TransUnion" | "Equifax", CreditReportWithId | null> = {
    Experian: null,
    TransUnion: null,
    Equifax: null,
  };
  if (!docs) return out;
  for (const d of docs) {
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
        <p className="text-xs text-muted-foreground">Apply for funding to see your status here.</p>
      </div>
    );
  }
  return <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />;
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
            <div className="h-2 rounded bg-black" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            {value ? `${pct}% of max` : "No score"}
          </div>
        </div>
      </div>
      {score?.modelName && <div className="text-xs text-neutral-500 mt-2">{score.modelName}</div>}
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
  const stats = useMemo(() => {
    if (!clientData) return null;

    // --- Funding and Plaid Calculations ---
    const totalRequested =
      clientData.fundingApplications?.reduce(
        (sum, app) => sum + (Number(app.amountFunding) || 0),
        0
      ) ?? 0;
    const totalApproved =
      clientData.fundingApplications?.reduce(
        (sum, app) => sum + (app.approveOrDecline?.amountApprove || 0),
        0
      ) ?? 0;
    const allPlaidData = clientData.getPlaidCompleteData || [];
    const allTransactions = allPlaidData.flatMap((d) => d.transaction || []);
    const allBalances = allPlaidData.flatMap((d) => d.balance || []);
    const allBankIncome = allPlaidData.flatMap((d) => d.bank_income || []);
    const personalAccountsBalances = allBalances.filter((b) => b.type === "depository");
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

    const scoresByBureau: Record<"Experian" | "TransUnion" | "Equifax", CreditScore | undefined> = {
      Experian: bureauMap.Experian?.report.scores?.[0],
      TransUnion: bureauMap.TransUnion?.report.scores?.[0],
      Equifax: bureauMap.Equifax?.report.scores?.[0],
    };

    return {
      totalRequested,
      totalApproved,
      lastMonthDeposits,
      averageMonthlyBalance,
      averageMonthlyIncome,
      scoresByBureau,
    };
  }, [clientData]);

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
    <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50/50 dark:bg-background">
      <header>
        {adminView ? (
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            {`${userData?.firstName} ${userData?.lastName}` || "Client"}!
          </h1>
        ) : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              Welcome, {userData?.firstName || "Client"}!
            </h1>
            <p className="text-muted-foreground">{`Here's a summary of your financial overview.`}</p>
          </div>
        )}
      </header>

      <main className="grid gap-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Credit Scores</CardTitle>
            <CardDescription>Scores from the three major credit bureaus.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ScoreCard bureau="Experian" score={stats.scoresByBureau.Experian} />
            <ScoreCard bureau="Equifax" score={stats.scoresByBureau.Equifax} />
            <ScoreCard bureau="TransUnion" score={stats.scoresByBureau.TransUnion} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Financial Snapshot</CardTitle>
              <CardDescription>Based on your connected Plaid accounts.</CardDescription>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Business Profiles</h2>
            {/* <Button asChild variant="outline">
              <Link href="/my-business">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Business
              </Link>
            </Button> */}
          </div>
          {businessesWithCrsData && businessesWithCrsData.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {businessesWithCrsData.map((business) => {
                const profile = business.crsBusinessProfile?.report;
                const commScore = profile?.scoreInformation?.commercialScore;
                const fsrScore = profile?.scoreInformation?.fsrScore;
                const isActive = profile?.commercialFraudShieldSummary?.activeBusinessIndicator;

                return (
                  <Card key={business.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{business.businessName}</CardTitle>
                          <CardDescription>
                            Employer Idenfication Number: {business.employerIdentificationNumber}
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
                    <CardContent className="grid flex-grow grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{commScore?.score ?? "N/A"}</p>
                          <p className="text-muted-foreground text-xs">Business Credit Score</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md">
                          <Landmark className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{fsrScore?.riskClass.definition ?? "N/A"}</p>
                          <p className="text-muted-foreground text-xs">Financial Stability Risk</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 opacity-60">
                        <div className="p-2 bg-gray-500/10 rounded-md">
                          <DollarSign className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-semibold">N/A</p>
                          <p className="text-muted-foreground text-xs">Account Balance</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 opacity-60">
                        <div className="p-2 bg-gray-500/10 rounded-md">
                          <CalendarDays className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-semibold">N/A</p>
                          <p className="text-muted-foreground text-xs">Monthly Deposits</p>
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
      </main>
    </div>
  );
};
