"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, PartyPopper } from "lucide-react";

// --- IMPORT YOUR ACTUAL APPLICATION TYPES ---
import { UserWithId } from "@/schema/registration";
import { ApplyFunding } from "@/schema/apply-funding";
import { PlaidCompleteRow } from "@/service/plaid/data";
import { Business } from "@/schema";
import { CreditScore } from "@/types/crs";
import { ApprovedBankFormData } from "@/schema/bank-products";
// import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";
import { useGetCongrats, useMarkCongratsAsRead } from "@/hooks/congrats";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/provider/AuthContext";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { useMembership } from "@/hooks/membership";

// CEG Brain Dashboard Components
import { MetricCards } from "@/components/dashboard/MetricCards";
import { CreditScoresSection } from "@/components/dashboard/CreditScoresSection";
import { FundabilityScoreCard } from "@/components/dashboard/FundabilityScoreCard";
import { FinancialSnapshotSection } from "@/components/dashboard/FinancialSnapshotSection";
import { MyBusinessesSection } from "@/components/dashboard/MyBusinessesSection";
import { NextStepsPanel } from "@/components/dashboard/NextStepsPanel";
import { ApplicationStatusChart } from "@/components/dashboard/ApplicationStatusChart";
import {
  MetricCardSkeleton,
  CreditScoreSkeleton,
  FundabilityScoreSkeleton,
  NextStepsSkeleton,
  ApplicationStatusSkeleton,
  BusinessCardSkeleton,
  SnapshotSkeleton,
} from "@/components/dashboard/Skeletons";

// Data transformation
import { transformClientDataToDashboard } from "@/lib/dashboard-data-mapper";

import { PreApprovalHeroCard } from "@/components/income-funding/PreApprovalHeroCard";

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
  userDocuments?: any[];
}

// --- MAIN DASHBOARD COMPONENT ---
export const ClientDashboard = ({
  clientData,
  adminView,
}: {
  clientData: ClientData | null | undefined;
  adminView?: boolean;
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const onOpenConfetti = useConfettiStore((state) => state.onOpen);
  const { data: membershipData } = useMembership();
  // const { denefitsContract, isLoading } = useGetDenefitsContractsByUserId(
  //   clientData?.userData?.id || "",
  // );

  const [congratsModalOpen, setCongratsModalOpen] = useState(false);
  const [currentCongratsMessage, setCurrentCongratsMessage] = useState<{
    id: string;
    message: string;
    userId: string;
  } | null>(null);

  // Fetch congrats messages for the first funding application
  const firstFundingApp = clientData?.fundingApplications?.[0];
  const { congratsMessages } = useGetCongrats(user?.uid || "");
  const markAsReadMutation = useMarkCongratsAsRead();

  // const [isOpenFunding, setIsOpenFunding] = useState(
  //   adminView === false || adminView === undefined
  // );

  // Check for unread congrats messages
  useEffect(() => {
    if (congratsMessages && !adminView) {
      const unreadMessages = congratsMessages.filter((msg) => !msg.isRead);
      if (unreadMessages.length > 0 && firstFundingApp?.referenceNumber) {
        setCurrentCongratsMessage({
          id: unreadMessages[0].id,
          message: unreadMessages[0].message,
          userId: user?.uid || "",
        });
        setCongratsModalOpen(true);
        onOpenConfetti();
      }
    }
  }, [
    congratsMessages,
    adminView,
    firstFundingApp?.referenceNumber,
    onOpenConfetti,
    user?.uid,
  ]);

  const handleCongratsClose = useCallback(() => {
    if (currentCongratsMessage) {
      markAsReadMutation.mutate({
        userId: currentCongratsMessage.userId,
        docId: currentCongratsMessage.id,
      });
    }
    setCongratsModalOpen(false);
    setCurrentCongratsMessage(null);
  }, [currentCongratsMessage, markAsReadMutation]);

  const viewAuditReport = useCallback(() => {
    router.push("/client/income-funding");
  }, [router]);

  // useEffect(() => {
  //   if (denefitsContract && denefitsContract.length > 0) {
  //     setIsOpenFunding(true);
  //   }
  // }, [denefitsContract]);

  // Transform data for new dashboard components
  const dashboardData = transformClientDataToDashboard(clientData);

  // Compute estimated amount for the Hero Card
  const computationFromBackend =
    (firstFundingApp as any)?.businessIncomeComputation || {};
  const estimatedApprovalAmount =
    typeof computationFromBackend.estimatedApprovalAmount === "object" &&
    computationFromBackend.estimatedApprovalAmount !== null
      ? computationFromBackend.estimatedApprovalAmount.amount
      : computationFromBackend.estimatedApprovalAmount || 0;

  if (!clientData || !dashboardData) {
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

  const { userData } = clientData;

  const loading = !dashboardData;

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-6">
        <div className="flex-1">
          {adminView ? (
            <h1 className="text-xl font-bold text-gray-900">
              {userData?.firstName && userData?.lastName
                ? `${userData.firstName} ${userData.lastName}`
                : "Client"}
            </h1>
          ) : (
            <div className="animate-fadeInUp">
              <h1 className="text-xl font-bold text-gray-900">
                Welcome back, {userData?.firstName || "Client"}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Your Financial Intelligence Center
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Real-time overview of your funding readiness and financial
                profile
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          {/* Pre-Approval Hero Card */}
          {firstFundingApp && estimatedApprovalAmount > 0 && (
            <PreApprovalHeroCard
              estimatedApprovalAmount={estimatedApprovalAmount}
              onContinue={() =>
                router.push("/client/income-funding?showPathways=true")
              }
            />
          )}

          {/* Grid: main content (left) + sidebar panels (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* === LEFT COLUMN === */}
            <div className="space-y-6 min-w-0">
              {/* Metric Cards: Total Requested + Total Approved + Total Funded */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                </div>
              ) : (
                <MetricCards metrics={dashboardData.fundingMetrics} />
              )}

              {/* Credit Scores: Experian, Equifax, TransUnion */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CreditScoreSkeleton />
                  <CreditScoreSkeleton />
                  <CreditScoreSkeleton />
                </div>
              ) : (
                <CreditScoresSection
                  scores={dashboardData.creditScores}
                  isPremium={membershipData?.status === "active"}
                />
              )}

              {/* My Businesses grid */}
              {loading ? (
                <div>
                  <div className="h-5 w-32 skeleton rounded mb-4" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <BusinessCardSkeleton />
                    <BusinessCardSkeleton />
                    <BusinessCardSkeleton />
                  </div>
                </div>
              ) : (
                <MyBusinessesSection businesses={dashboardData.businesses} />
              )}

              {/* Financial Snapshot: Deposits, Balance, Income */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SnapshotSkeleton />
                  <SnapshotSkeleton />
                  <SnapshotSkeleton />
                </div>
              ) : (
                <FinancialSnapshotSection
                  data={dashboardData.financialSnapshot}
                />
              )}
            </div>

            {/* === RIGHT COLUMN (sidebar panels) === */}
            <div className="space-y-5">
              {/* Fundability Score Ring */}
              {loading ? (
                <FundabilityScoreSkeleton />
              ) : (
                <FundabilityScoreCard
                  score={dashboardData.fundabilityScore.score}
                  maxScore={dashboardData.fundabilityScore.maxScore}
                  status={dashboardData.fundabilityScore.status}
                />
              )}

              {/* Next Steps Checklist */}
              {loading ? (
                <NextStepsSkeleton />
              ) : (
                <NextStepsPanel steps={dashboardData.nextSteps} />
              )}

              {/* Application Status Donut */}
              {loading ? (
                <ApplicationStatusSkeleton />
              ) : (
                <ApplicationStatusChart
                  data={dashboardData.applicationStatus}
                />
              )}
            </div>
          </div>

          {/* Issues Card (if needed) */}
          {dashboardData.creditAnalysis && (
            <IssuesCard
              issues={dashboardData.creditAnalysis.issues}
              negatives={dashboardData.creditAnalysis.negatives}
              derogatory={dashboardData.creditAnalysis.derogatory}
            />
          )}
        </div>
      </main>

      {/* Congratulations Message Modal */}
      <AlertDialog open={congratsModalOpen} onOpenChange={setCongratsModalOpen}>
        <AlertDialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader className="text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-100 rounded-full">
                <PartyPopper className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <AlertDialogTitle className="text-xl sm:text-2xl">
                Congratulations!
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="text-xs sm:text-sm text-muted-foreground">
                <div
                  dangerouslySetInnerHTML={{
                    __html: currentCongratsMessage?.message || "",
                  }}
                  className="[&_p]:mb-2 sm:[&_p]:mb-3 [&_ul]:mb-2 sm:[&_ul]:mb-3 [&_ul]:ml-4 sm:[&_ul]:ml-5 [&_ul]:list-disc [&_li]:mb-1 [&_strong]:font-semibold [&_br]:block"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 justify-between">
            <AlertDialogAction
              onClick={viewAuditReport}
              className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto"
            >
              View Audit Report
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleCongratsClose}
              className="bg-green-500 hover:bg-green-600 w-full sm:w-auto"
            >
              Got it, thanks!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
