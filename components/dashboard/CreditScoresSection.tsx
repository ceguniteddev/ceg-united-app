"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Lock, Sparkles, ReceiptIcon, Loader2, X } from "lucide-react";

import { ResponsiveDialog } from "@/components/responsive-dialog";
import { PricingPlans } from "@/components/pricing-plans/PricingPlans";
import { MembershipCheckoutView } from "@/components/pricing-plans/MembershipCheckoutView";
import { AddonCheckoutView } from "@/components/pricing-plans/AddonCheckoutView";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/provider/AuthContext";
import { createMembershipCheckoutConfig } from "@/service/dodo";
// import { useFeeSettings } from "@/hooks/fee-settings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { useUserQuery } from "@/hooks/user";
import { useMembership } from "@/hooks/membership";
import { useGetClientApplyFunding } from "@/hooks/apply-funding";
import { checkFreePullEligibility } from "@/lib/crs-eligibility";
import { useQueryClient } from "@tanstack/react-query";
import {
  GET_USER,
  GET_USER_CRS_REPORT,
  GET_CLIENT_STATISTICS,
  GET_WALLET,
} from "@/constant/react-query-keys";
import { initiateCRSReportCheckout, generateCRSReport } from "@/service/crs";
import { useWalletQuery, useSpendFundsMutation } from "@/hooks/wallet";
import { TopUpModal } from "@/components/wallet/TopUpModal";
import { ConfirmButton } from "@/components/Confirmation";
import { useFeeSettings } from "@/hooks/fee-settings";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DodoCheckoutView } from "@/components/funding/DodoCheckoutView";

export interface CreditScore {
  bureau: "experian" | "equifax" | "transunion";
  score: number;
  rating: "Poor" | "Fair" | "Good" | "Very Good" | "Excellent";
  accountNumber: string;
  lastUpdated: string;
  delta?: number;
  prevScore?: number;
}

// const bureauConfig: Record<
//   string,
//   {
//     label: string;
//     logoPath: string;
//     bgColor: string;
//   }
// > = {
//   experian: {
//     label: "Experian",
//     logoPath: "/icons/experian.jpeg",
//     bgColor: "bg-white",
//   },
//   equifax: {
//     label: "Equifax",
//     logoPath: "/icons/equifax.jpeg",
//     bgColor: "bg-white",
//   },
//   transunion: {
//     label: "TransUnion",
//     logoPath: "/icons/transunion.jpeg",
//     bgColor: "bg-white",
//   },
// };

// function ratingStyle(rating: string) {
//   switch (rating) {
//     case "Excellent":
//       return {
//         badge: "bg-emerald-100 text-emerald-700",
//         bar: "bg-emerald-500",
//       };
//     case "Very Good":
//       return { badge: "bg-teal-100 text-teal-700", bar: "bg-teal-500" };
//     case "Good":
//       return { badge: "bg-blue-100 text-blue-700", bar: "bg-blue-500" };
//     case "Fair":
//       return { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500" };
//     default:
//       return { badge: "bg-red-100 text-red-700", bar: "bg-red-500" };
//   }
// }

function fmtPulled(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const nth = (d: number) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}${nth(day)}, ${year}`;
}

function CreditScoreCard({
  score,
  index,
  isPremium,
  onUpgradeClick,
}: {
  score: CreditScore;
  index: number;
  isPremium?: boolean;
  onUpgradeClick?: () => void;
}) {
  const currentScore = score.score || 0;
  // Use prevScore from data if available, else derive from delta
  const delta = score.delta || 0;
  const prevScore =
    score.prevScore !== undefined ? score.prevScore : currentScore - delta;

  const min = 300;
  const max = 850;
  const pct = Math.max(0, Math.min(1, (currentScore - min) / (max - min)));
  const angle = -180 + pct * 180;

  // Re-use logic for styles
  const bureauName =
    score.bureau.charAt(0).toUpperCase() + score.bureau.slice(1);
  // const style = ratingStyle(score.rating);

  return (
    <div
      className={`card-hover rounded-2xl border border-gray-100 bg-white p-6 animate-fadeInUp stagger-${
        index + 3
      } relative overflow-hidden flex flex-col items-center justify-center`}
    >
      <div className={`w-full ${!isPremium ? "blur-sm select-none" : ""}`}>
        {/* Bureau Logo */}
        <div className="h-8 flex items-center justify-center mb-6">
          <Image
            src={`/icons/${bureauName}.png`}
            alt={bureauName}
            width={100}
            height={32}
            className="object-contain h-full w-auto"
          />
        </div>

        {/* Gauge and Score */}
        <div className="relative w-full max-w-[200px] aspect-[2/1] mb-8 mx-auto">
          <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient
                id={`gaugeGradient-${score.bureau}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="75%" stopColor="#3b82f6" />
                <stop offset="75%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>

            {/* Colored track */}
            <path
              d="M 10 90 A 90 90 0 0 1 190 90"
              fill="none"
              stroke={`url(#gaugeGradient-${score.bureau})`}
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* Marker */}
            <g transform={`translate(100, 90) rotate(${angle})`}>
              <circle
                cx="90"
                cy="0"
                r="5"
                fill="#fff"
                stroke="#f59e0b"
                strokeWidth="2"
              />
            </g>
          </svg>

          {/* Inside the arc content */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <div className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-none">
              {currentScore}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-gray-800 mt-1">
              {fmtPulled(score.lastUpdated)}
            </div>
          </div>

          {/* 300 and 850 labels */}
          <div className="absolute -bottom-2 left-0 text-sm font-bold text-gray-800 -translate-x-2 translate-y-full">
            300
          </div>
          <div className="absolute -bottom-2 right-0 text-sm font-bold text-gray-800 translate-x-2 translate-y-full">
            850
          </div>
        </div>

        {/* Delta */}
        <div className="text-center mt-2">
          <div
            className={`text-3xl sm:text-4xl font-extrabold leading-none tracking-tight mb-2 ${
              delta > 0
                ? "text-emerald-500"
                : delta < 0
                  ? "text-red-500"
                  : "text-gray-400"
            }`}
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </div>
          <div className="text-sm font-semibold text-gray-700">
            Prev Score: {prevScore}
          </div>
        </div>
      </div>

      {!isPremium && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-white/40 z-10 cursor-pointer"
          onClick={onUpgradeClick}
        >
          <div className="flex flex-col items-center p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:bg-white transition-colors">
            <Lock className="w-5 h-5 text-gray-500 mb-1" />
            <span className="text-xs font-medium text-gray-700">
              Upgrade to view
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function CreditScoresSection({
  scores,
  isPremium = false,
}: {
  scores: CreditScore[];
  isPremium?: boolean;
}) {
  const [isPricingModalOpen, setPricingModalOpen] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isCheckoutSheetOpen, setCheckoutSheetOpen] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    amount: number;
  } | null>(null);
  const [isAddonCheckout, setIsAddonCheckout] = useState(false);
  const [pendingAddons, setPendingAddons] = useState<string[]>([]);

  // State variables for paid checkout/free pull
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [checkoutMetadata, setCheckoutMetadata] = useState<any>(null);

  const queryClient = useQueryClient();
  const { user, userData } = useAuth();
  const router = useRouter();

  // Load user's membership
  const { data: userMembership } = useMembership(user?.uid);

  // Query live profile userData
  const { userData: queryUserData } = useUserQuery(user?.uid ?? "");
  const activeUserData = queryUserData || userData;

  // Load user's latest funding application
  const { appliedFunding } = useGetClientApplyFunding(user?.uid ?? "");

  // Load credit report fee
  const { data: feeSettings } = useFeeSettings();
  const creditReportFee = feeSettings?.creditReportFee ?? 49;

  // Wallet and balance states
  const { data: walletData } = useWalletQuery(user?.uid ?? "");
  const currentBalance = walletData?.balance || 0;
  const hasSufficientBalance = currentBalance >= creditReportFee;
  const spendFunds = useSpendFundsMutation();
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

  // Determine free pull eligibility
  const isEligibleForFreePull = useMemo(() => {
    return checkFreePullEligibility(
      userMembership,
      activeUserData?.lastFreePullAt,
    );
  }, [userMembership, activeUserData?.lastFreePullAt]);

  // Compute membership tier label
  const membershipTierLabel = useMemo(() => {
    if (!userMembership?.tier) return "Premium";
    const tier = userMembership.tier.toLowerCase();
    if (tier.includes("starter")) return "Starter";
    if (tier.includes("pro")) return "Pro";
    if (tier.includes("executive")) return "Executive";
    return "Premium";
  }, [userMembership?.tier]);

  const handleGenerateReport = async () => {
    if (!user?.uid) return;

    if (!isEligibleForFreePull && !hasSufficientBalance) {
      setIsConfirmOpen(false);
      setTopUpModalOpen(true);
      return;
    }

    const latestApp = appliedFunding?.[0];

    if (!isEligibleForFreePull && hasSufficientBalance) {
      try {
        setIsGenerating(true);
        // Trigger the fund deduction
        await spendFunds.mutateAsync({
          amount: creditReportFee,
          description: "Credit Report Pull Fee",
          metadata: { reportType: "personal" },
        });

        // Upon success, trigger the report generation directly
        await generateCRSReport({
          userId: user.uid,
          bureaus: { equifax: true, experian: true, transunion: true },
          bypassPremiumCheck: true,
        });

        toast.success(
          "Payment processed and credit report generation started. Please wait a few moments for the data to appear.",
        );

        // Invalidate the React Query cache
        queryClient.invalidateQueries({ queryKey: [GET_USER, user.uid] });
        queryClient.invalidateQueries({
          queryKey: [GET_USER_CRS_REPORT, user.uid],
        });
        queryClient.invalidateQueries({
          queryKey: [GET_CLIENT_STATISTICS, user.uid],
        });
        queryClient.invalidateQueries({ queryKey: [GET_WALLET, user.uid] });

        setIsConfirmOpen(false);
        router.refresh();
      } catch (error: any) {
        console.error(
          "Failed to process wallet payment and generate report:",
          error,
        );
        toast.error(
          error.message ||
            "Failed to process wallet payment and generate report. Please contact support.",
        );
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    try {
      setIsGenerating(true);
      const res = await initiateCRSReportCheckout({
        userId: user.uid,
        reportType: "personal",
        referenceNumber: latestApp?.referenceNumber,
      });

      if (res.checkoutId && res.url) {
        setCheckoutMetadata({
          reportType: "personal",
          referenceNumber:
            "metadata" in res
              ? (res as any).metadata?.referenceNumber
              : undefined,
        });
        setCheckoutId(res.checkoutId);
        setCheckoutUrl(res.url);
        setIsConfirmOpen(false);
      } else if ("success" in res && res.success) {
        toast.success(
          "Credit report generation has started. Please wait a few moments for the new data to appear.",
        );
        setIsConfirmOpen(false);
        queryClient.invalidateQueries({ queryKey: [GET_USER, user.uid] });
        queryClient.invalidateQueries({
          queryKey: [GET_USER_CRS_REPORT, user.uid],
        });
        queryClient.invalidateQueries({
          queryKey: [GET_CLIENT_STATISTICS, user.uid],
        });
      }
    } catch (error: any) {
      console.error("Failed to initiate CRS report checkout:", error);
      toast.error(
        error.message ||
          "Failed to generate credit report. Please contact support.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPlan = async (
    planId: string,
    amount: number,
    selectedAddons: string[] = [],
  ) => {
    if (!userData?.id) return;
    try {
      setIsCreatingCheckout(true);
      setPendingAddons(selectedAddons);
      setIsAddonCheckout(false);
      const res = await createMembershipCheckoutConfig({
        userId: userData.id,
        planId: planId as any,
        selectedAddonIds: selectedAddons,
      });
      setCheckoutId(res.checkoutId);
      setCheckoutUrl(res.url);
      setSelectedPlan({ id: planId, amount });
      setPricingModalOpen(false);
      setCheckoutSheetOpen(true);
    } catch (err: any) {
      toast.error("Failed to start checkout: " + err.message);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 w-full">
        <h2 className="text-lg font-bold text-gray-900">Credit Scores</h2>
        {isPremium && (
          <ConfirmButton
            open={isConfirmOpen}
            onOpenChange={setIsConfirmOpen}
            onConfirm={handleGenerateReport}
            isLoading={isGenerating}
            disabled={isGenerating}
            description={
              isEligibleForFreePull ? (
                <div className="space-y-3 mt-2 text-sm text-blue-800 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Free Monthly Pull Available!
                  </p>
                  <p>
                    As an active {membershipTierLabel} member, you are eligible
                    for 1 free credit report pull every calendar month.
                  </p>
                  <p>
                    You have not used your free pull for this month yet. Pulling
                    a new credit report now will use this monthly benefit and
                    will be completely free of charge.
                  </p>
                </div>
              ) : hasSufficientBalance ? (
                <div className="space-y-3 mt-2 text-sm text-gray-600">
                  <p>
                    Pulling a new credit report will deduct from your wallet
                    balance.
                  </p>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1.5 font-medium text-blue-900 text-left">
                    <div className="flex justify-between">
                      <span>Report Fee:</span>
                      <span className="font-mono">
                        ${creditReportFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Balance:</span>
                      <span className="font-mono">
                        ${currentBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-blue-200">
                      <span>Remaining Balance:</span>
                      <span className="font-mono">
                        ${(currentBalance - creditReportFee).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p>This report will be generated instantly.</p>
                </div>
              ) : (
                <div className="space-y-3 mt-2 text-sm text-gray-600">
                  <p>
                    Pulling a new credit report requires a fee of{" "}
                    <strong>${creditReportFee.toFixed(2)}</strong>.
                  </p>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 space-y-1.5 font-medium text-red-900 text-left">
                    <div className="flex justify-between">
                      <span>Report Fee:</span>
                      <span className="font-mono">
                        ${creditReportFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Balance:</span>
                      <span className="font-mono">
                        ${currentBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-red-200 font-bold">
                      <span>Amount Needed:</span>
                      <span className="font-mono">
                        ${(creditReportFee - currentBalance).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p>Please top up your wallet balance to proceed.</p>
                </div>
              )
            }
            confirmLabel={
              isEligibleForFreePull
                ? "Pull Credit Report for Free"
                : hasSufficientBalance
                  ? `Pay $${creditReportFee.toFixed(2)} & Pull Report`
                  : "Top Up Wallet"
            }
            classNameAction="bg-blue-600 hover:bg-blue-700 text-white animate-pulse"
            title={
              isEligibleForFreePull
                ? "Free Credit Report Pull"
                : hasSufficientBalance
                  ? "Pay with Wallet"
                  : "Insufficient Wallet Balance"
            }
            trigger={
              <button
                onClick={() => setIsConfirmOpen(true)}
                disabled={isGenerating}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors w-full sm:w-auto justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pulling Credit Report...
                  </>
                ) : (
                  <>
                    {isEligibleForFreePull ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Pull Credit Report (Free)
                      </>
                    ) : (
                      <>
                        <ReceiptIcon className="w-4 h-4" />
                        Pull Credit Report
                      </>
                    )}
                  </>
                )}
              </button>
            }
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scores.map((s, i) => (
          <CreditScoreCard
            key={s.bureau}
            score={s}
            index={i}
            isPremium={isPremium}
            onUpgradeClick={() => setPricingModalOpen(true)}
          />
        ))}
      </div>

      <ResponsiveDialog
        isOpen={isPricingModalOpen}
        setIsOpen={setPricingModalOpen}
        title="Upgrade to View Credit Scores"
        description=""
        className="sm:max-w-[90vw] md:max-w-6xl max-h-[90vh] overflow-y-auto p-0 border-0"
      >
        <PricingPlans
          isLoading={isCreatingCheckout}
          onSelectPlan={handleSelectPlan}
        />
      </ResponsiveDialog>

      <Sheet open={isCheckoutSheetOpen} onOpenChange={setCheckoutSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 overflow-hidden"
        >
          <SheetHeader className="px-6 py-4 border-b border-gray-200">
            <SheetTitle className="text-xl font-bold">
              Secure Checkout
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {checkoutId &&
              selectedPlan &&
              userData &&
              (isAddonCheckout ? (
                <AddonCheckoutView
                  checkoutId={checkoutId}
                  userId={userData.id}
                  addonId={selectedPlan.id}
                  amount={selectedPlan.amount}
                  prefillEmail={userData.email || ""}
                  onPaymentCompleteAction={() => {
                    setCheckoutSheetOpen(false);
                    router.refresh();
                  }}
                />
              ) : (
                <MembershipCheckoutView
                  checkoutId={checkoutId}
                  userId={userData.id}
                  tierId={selectedPlan.id}
                  amount={selectedPlan.amount}
                  prefillEmail={userData.email || ""}
                  pendingAddons={pendingAddons}
                  membershipAmount={selectedPlan?.amount ?? 0}
                  onPaymentCompleteAction={() => {
                    // Checkout is now 1-step, just close the modal
                    setCheckoutSheetOpen(false);
                    router.refresh();
                  }}
                />
              ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Paid Checkout Modal */}
      <Dialog
        open={!!checkoutId && !!checkoutMetadata}
        onOpenChange={(open) => {
          if (!open) {
            setCheckoutId(null);
            setCheckoutUrl(null);
            setCheckoutMetadata(null);
          }
        }}
      >
        <DialogContent
          className="w-[95vw] sm:max-w-[600px] md:max-w-[700px] p-0 overflow-hidden bg-transparent border-none shadow-none"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Complete Your Purchase</DialogTitle>
          {checkoutId && checkoutMetadata && (
            <div className="bg-white rounded-xl shadow-2xl overflow-y-auto w-full max-h-[90vh] md:max-h-[85vh] relative">
              <button
                onClick={() => {
                  setCheckoutId(null);
                  setCheckoutUrl(null);
                  setCheckoutMetadata(null);
                }}
                className="cursor-pointer absolute top-3 right-3 p-2 bg-gray-100 hover:bg-gray-200 rounded-full z-50 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              <DodoCheckoutView
                checkoutId={checkoutId}
                checkoutDetails={{
                  url: checkoutUrl || undefined,
                  checkout_url: checkoutUrl || undefined,
                  amount: Math.round(creditReportFee * 100),
                }}
                onComplete={async (paymentId) => {
                  try {
                    const response = await fetch(
                      `/api/user/${user!.uid}/crs/purchase`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          planId: checkoutId,
                          receiptId: paymentId,
                          checkoutId,
                          metadata: checkoutMetadata,
                        }),
                      },
                    );

                    if (!response.ok) {
                      throw new Error("Failed to trigger report generation");
                    }

                    toast.success(
                      "Payment successful! Generating your credit report...",
                    );
                    setCheckoutId(null);
                    setCheckoutUrl(null);
                    setCheckoutMetadata(null);
                    queryClient.invalidateQueries({
                      queryKey: [GET_USER, user!.uid],
                    });
                    queryClient.invalidateQueries({
                      queryKey: [GET_USER_CRS_REPORT, user!.uid],
                    });
                    queryClient.invalidateQueries({
                      queryKey: [GET_CLIENT_STATISTICS, user!.uid],
                    });
                    router.refresh();
                  } catch (error) {
                    console.error(error);
                    toast.error(
                      "Payment succeeded but report generation failed. Please contact support.",
                    );
                    setCheckoutId(null);
                    setCheckoutUrl(null);
                    setCheckoutMetadata(null);
                  }
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {user?.uid && (
        <TopUpModal
          isOpen={topUpModalOpen}
          onClose={() => setTopUpModalOpen(false)}
          userId={user.uid}
          userEmail={activeUserData?.email || ""}
        />
      )}
    </>
  );
}
