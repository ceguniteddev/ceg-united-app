import {
  CheckCircle2,
  TrendingUp,
  Calendar,
  Wallet,
  AlertCircle,
  CircleSlash,
  Sparkles,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { GradeBadge } from "./GradeBadge";
import { PreApprovalHeroCard } from "./PreApprovalHeroCard";
import { formatUSD } from "@/lib/underwriting";
import type { IncomeFundingDeal } from "@/types/income-funding-types";
import ClientActiveFundingList from "@/components/funding/ClientActiveFundingList";

interface PreApprovalViewProps {
  deal: IncomeFundingDeal;
  realDeal: any;
  onContinue: () => void;
  userId?: string;
  referenceNumber?: string;
  isAdminView?: boolean;
}

export function PreApprovalView({
  deal,
  realDeal,
  onContinue,
  userId,
  referenceNumber,
}: PreApprovalViewProps) {
  // Fallback to mock data if real data is not available yet
  const computationFromBackend = realDeal?.businessIncomeComputation || {};

  // Compute requested amount as fallback
  const requestedAmount =
    Number(realDeal?.personalAmountFunding || 0) +
    Number(realDeal?.businessAmountFunding || 0);

  const backendEstimatedAmountValue =
    typeof computationFromBackend.estimatedApprovalAmount === "object" &&
    computationFromBackend.estimatedApprovalAmount !== null
      ? computationFromBackend.estimatedApprovalAmount.amount
      : computationFromBackend.estimatedApprovalAmount;

  // Handle both old flat structure and new nested structure, fallback to requested amount if 0/null/undefined
  const estimatedAmountValue =
    backendEstimatedAmountValue !== undefined &&
    backendEstimatedAmountValue !== null &&
    backendEstimatedAmountValue !== 0
      ? backendEstimatedAmountValue
      : requestedAmount || deal.underwritingResult.maxFundingAmount;

  const calcSteps =
    typeof computationFromBackend.estimatedApprovalAmount === "object" &&
    computationFromBackend.estimatedApprovalAmount !== null
      ? computationFromBackend.estimatedApprovalAmount.calculationSteps
      : computationFromBackend.calculationSteps ||
        `${deal.underwritingResult.baseMultiple} × ${Math.round(deal.underwritingResult.percentage * 100)}% × ${formatUSD(deal.underwritingInput.monthlyDeposits)} = ${formatUSD(deal.underwritingResult.maxFundingAmount)}`;

  const rationaleText =
    typeof computationFromBackend.estimatedApprovalAmount === "object" &&
    computationFromBackend.estimatedApprovalAmount !== null
      ? computationFromBackend.estimatedApprovalAmount.rationale
      : computationFromBackend.rationale || deal.underwritingResult.rationale;

  const computation = {
    assignedGrade:
      computationFromBackend.assignedGrade || deal.underwritingResult.grade,
    multiplierUsed:
      computationFromBackend.multiplierUsed ||
      deal.underwritingResult.baseMultiple * deal.underwritingResult.percentage,
    estimatedApprovalAmount: estimatedAmountValue,
    calculationSteps: calcSteps,
    rationale: rationaleText,
    isEligible: computationFromBackend.isEligible ?? true,
  };

  // Map real deal inputs to stat cards if available
  const u = realDeal
    ? {
        monthlyDeposits:
          computationFromBackend.monthlyBusinessRevenue ||
          (realDeal.annualBusinessRevenue
            ? realDeal.annualBusinessRevenue / 12
            : deal.underwritingInput.monthlyDeposits),
        timeInBusinessMonths: realDeal.dateOfIncorporation
          ? Math.floor(
              (Date.now() - new Date(realDeal.dateOfIncorporation).getTime()) /
                (1000 * 60 * 60 * 24 * 30),
            )
          : deal.underwritingInput.timeInBusinessMonths,
        timeInBusinessStr: computationFromBackend.timeInBusiness,
        averageDailyBalance:
          computationFromBackend.avgDailyBankBalance ||
          realDeal.avgDailyBankBalance ||
          deal.underwritingInput.averageDailyBalance,
        endingBalance: computationFromBackend.endingBalance || 0,
        nsfCount: computationFromBackend.nsfCount || 0,
        negativeDays: computationFromBackend.negativeDays || 0,
      }
    : {
        ...deal.underwritingInput,
        timeInBusinessStr: undefined as string | undefined,
      };

  if (!computation.isEligible) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
          <h2 className="text-xl font-bold text-red-900">Not Eligible</h2>
          <p className="mt-2 text-red-700">{computation.rationale}</p>
        </div>
      </div>
    );
  }

  const isEstimatedAmountEmpty =
    backendEstimatedAmountValue === undefined ||
    backendEstimatedAmountValue === null ||
    backendEstimatedAmountValue === 0;

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <PreApprovalHeroCard
        estimatedApprovalAmount={computation.estimatedApprovalAmount}
        onContinue={onContinue}
      />

      {!isEstimatedAmountEmpty && (
        <>
          {/* Stat grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="animate-fade-in-up stagger-1">
              <StatCard
                icon={TrendingUp}
                label="Monthly Revenue"
                value={formatUSD(u.monthlyDeposits)}
                hint="Avg. of last 4 months"
              />
            </div>
            <div className="animate-fade-in-up stagger-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 card-hover h-full">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CheckCircle2 className="w-[18px] h-[18px]" />
                  </div>
                  <GradeBadge grade={computation.assignedGrade} size="sm" />
                </div>
                <div className="mt-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Risk Grade
                  </div>
                  <div className="mt-1 text-xl font-bold text-gray-900">
                    Tier {computation.assignedGrade}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {computation.assignedGrade === "A" && "Excellent profile"}
                    {computation.assignedGrade === "B" && "Solid profile"}
                    {computation.assignedGrade === "C" && "Fair profile"}
                    {computation.assignedGrade === "D" && "Subprime profile"}
                  </div>
                </div>
              </div>
            </div>
            <div className="animate-fade-in-up stagger-3">
              <StatCard
                icon={Calendar}
                label="Time in Business"
                value={
                  u.timeInBusinessStr || `${u.timeInBusinessMonths} months`
                }
                hint={
                  u.timeInBusinessStr
                    ? "Based on analysis"
                    : `Founded ${new Date(
                        Date.now() -
                          u.timeInBusinessMonths * 30 * 24 * 60 * 60 * 1000,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}`
                }
              />
            </div>
            <div className="animate-fade-in-up stagger-4">
              <StatCard
                icon={Wallet}
                label="Avg. Daily Balance"
                value={formatUSD(u.averageDailyBalance)}
                hint={
                  u.endingBalance > 0
                    ? `Ending balance ${formatUSD(u.endingBalance)}`
                    : "\u00A0"
                }
              />
            </div>
            <div className="animate-fade-in-up stagger-5">
              <StatCard
                icon={AlertCircle}
                label="NSF / Returned"
                value={u.nsfCount}
                hint={
                  u.nsfCount <= 2 ? "Within healthy range" : "Higher than ideal"
                }
                badge={
                  u.nsfCount <= 2
                    ? { text: "Healthy", tone: "success" }
                    : { text: "Watch", tone: "warning" }
                }
              />
            </div>
            <div className="animate-fade-in-up stagger-6">
              <StatCard
                icon={CircleSlash}
                label="Negative Days"
                value={u.negativeDays}
                hint={
                  u.negativeDays === 0
                    ? "No overdrafts"
                    : "Watch overdraft pattern"
                }
                badge={
                  u.negativeDays <= 2
                    ? { text: "Clean", tone: "success" }
                    : { text: "Risk", tone: "warning" }
                }
              />
            </div>
          </div>

          {/* Underwriting breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 md:p-7 animate-fade-in-up stagger-7">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Underwriting Summary
                </div>
                <h2 className="text-base font-bold text-gray-900">
                  How we calculated your offer
                </h2>
              </div>
            </div>

            <div className="mt-5 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-5">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Calculation
              </div>
              <div className="mt-2 font-mono text-base md:text-lg text-gray-900 flex flex-wrap items-baseline gap-2">
                <span className="font-bold">
                  {computation.calculationSteps}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                {computation.rationale}
              </p>
            </div>
          </div>
        </>
      )}
      {/* Matched Funding Products */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 md:p-7 animate-fade-in-up stagger-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Applied Funding Products
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-600">
              Generate a personalized playbook for any lender below, then open
              it to review application steps and recommendations.
            </p>
          </div>
        </div>

        <ClientActiveFundingList
          userId={userId}
          referenceNumber={referenceNumber}
        />
      </div>
    </div>
  );
}
