"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";

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
import {
  createMembershipCheckoutConfig,
} from "@/service/whop";
// import { useFeeSettings } from "@/hooks/fee-settings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

function ratingStyle(rating: string) {
  switch (rating) {
    case "Excellent":
      return {
        badge: "bg-emerald-100 text-emerald-700",
        bar: "bg-emerald-500",
      };
    case "Very Good":
      return { badge: "bg-teal-100 text-teal-700", bar: "bg-teal-500" };
    case "Good":
      return { badge: "bg-blue-100 text-blue-700", bar: "bg-blue-500" };
    case "Fair":
      return { badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500" };
    default:
      return { badge: "bg-red-100 text-red-700", bar: "bg-red-500" };
  }
}

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
  const [isCheckoutSheetOpen, setCheckoutSheetOpen] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    amount: number;
  } | null>(null);
  const [isAddonCheckout, setIsAddonCheckout] = useState(false);
  const [pendingAddons, setPendingAddons] = useState<string[]>([]);

  const { userData } = useAuth();
  const router = useRouter();
  // const { data: feeSettings } = useFeeSettings();

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
    </>
  );
}
