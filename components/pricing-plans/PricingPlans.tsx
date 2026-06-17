"use client";

import React, { useState } from "react";
import { Check, X, ArrowRight, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useFeeSettings } from "@/hooks/fee-settings";
import { cn } from "@/lib/utils";
import { useMembership } from "@/hooks/membership";
import { useAuth } from "@/provider/AuthContext";
import { useAddons } from "@/hooks/addons";

interface PricingPlansProps {
  onSelectPlan?: (
    planId: string,
    amount: number,
    selectedAddonIds?: string[],
  ) => void;
  isLoading?: boolean;
}

export function PricingPlans({
  onSelectPlan,
  isLoading = false,
}: PricingPlansProps) {
  const { userData } = useAuth();
  const { data: feeSettings, isLoading: isLoadingSettings } = useFeeSettings();
  const { data: membership } = useMembership(userData?.id);
  const { data: addons } = useAddons();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const activeTierId = membership?.status === "active" ? membership.tier : null;
  const creditModuleActive = addons?.some(
    (a) => a.addonId === "credit_module_pro" && a.status === "active",
  );

  const tiers = [
    {
      id: "tier_starter",
      name: "CEG BRAIN STARTER",
      price: feeSettings?.tierStarterPrice ?? 297,
      description: "Perfect for getting started with targeted funding options.",
      features: [
        "Personal & Business credit monitoring",
        "AI financial audits & Bank statement analysis",
        "Estimated funding amount",
        "Education vault lite",
        "AI financial health score",
        "ONE funding category selected",
        "6 lenders shown",
        "Refresh every 30 days",
      ],
      notIncluded: [
        "Business LOC",
        "SBA & Commercial lending",
        "Unlimited lenders",
        "Dispute module",
      ],
      cta: "Get Started",
      highlight: false,
    },
    {
      id: "tier_pro",
      name: "CEG BRAIN PRO",
      price: feeSettings?.tierProPrice ?? 397,
      description:
        "Advanced intelligence and more funding options for growing businesses.",
      features: [
        "Everything in Starter, plus:",
        "TWO funding categories",
        "12 lenders TOTAL (shared)",
        "Business LOC category access",
        "Advanced AI underwriting",
        "Faster refreshes",
        "Advanced education vault",
        "Banker scheduling access",
      ],
      notIncluded: ["SBA & Commercial lending", "Dispute module"],
      cta: "Go Pro",
      highlight: true,
      badge: "Most Popular",
    },
    {
      id: "tier_executive",
      name: "CEG BRAIN EXECUTIVE",
      price: feeSettings?.tierExecutivePrice ?? 697,
      description:
        "The ultimate tier for maximum funding potential and intelligence.",
      features: [
        "ALL funding categories included",
        "12 lenders PER category",
        "Refresh every 30 days",
        "Business LOC intelligence",
        "SBA & Commercial lender intelligence",
        "Advanced AI underwriting",
        "Advanced education vault & financial optimization",
        "Banker coordination access",
      ],
      notIncluded: ["Dispute module"],
      cta: "Go Executive",
      highlight: false,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl lg:text-5xl">
          Unlock the Power of CEG Brain
        </h2>
        <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto">
          Choose the membership tier that fits your funding needs. Get access to
          AI underwriting, lender intelligence, and financial audits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {tiers.map((tier) => {
          const isCurrentPlan = activeTierId === tier.id;
          const isSelected = selectedPlanId === tier.id;

          return (
            <div
              key={tier.id}
              className={cn(
                "relative flex flex-col h-full rounded-2xl bg-white shadow-lg border transition-all duration-200 hover:shadow-xl",
                isCurrentPlan
                  ? "border-emerald-500 ring-2 ring-emerald-500 ring-opacity-50 scale-105 z-20"
                  : isSelected
                    ? "border-blue-600 ring-2 ring-blue-600 ring-opacity-50 scale-105 z-20 shadow-blue-900/10"
                    : tier.highlight
                      ? "border-blue-300 ring-2 ring-blue-300 ring-opacity-50 scale-105 z-10"
                      : "border-slate-200",
              )}
            >
              {isCurrentPlan ? (
                <div className="absolute top-0 inset-x-0 flex justify-center -mt-4">
                  <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 uppercase tracking-wider rounded-full shadow-md flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Current Plan
                  </span>
                </div>
              ) : tier.badge ? (
                <div className="absolute top-0 inset-x-0 flex justify-center -mt-4">
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-full shadow-sm">
                    {tier.badge}
                  </span>
                </div>
              ) : null}

              <div className="p-8 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm text-slate-500 min-h-[40px]">
                  {tier.description}
                </p>
                <div className="mt-6 flex items-baseline text-5xl font-extrabold text-slate-900">
                  ${tier.price}
                  <span className="ml-1 text-xl font-medium text-slate-500">
                    /mo
                  </span>
                </div>
                <Button
                  onClick={() => setSelectedPlanId(tier.id)}
                  disabled={isLoading || isLoadingSettings || isCurrentPlan}
                  className={cn(
                    "mt-8 w-full h-12 text-md font-semibold transition-colors",
                    isCurrentPlan
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white opacity-100 disabled:opacity-100 cursor-default shadow-md"
                      : isSelected
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                        : tier.highlight
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200",
                  )}
                >
                  {isCurrentPlan ? (
                    "Current Plan"
                  ) : isSelected ? (
                    <>
                      <CheckCircle2 className="mr-2 w-5 h-5" /> Selected
                    </>
                  ) : (
                    <>
                      {tier.cta} <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="p-8 flex-1 flex flex-col bg-slate-50 rounded-b-2xl">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                  {`What's Included`}
                </h4>
                <ul className="mt-2 space-y-1 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="flex-shrink-0 w-5 h-5 text-emerald-500 mt-0.5" />
                      <span className="ml-3 text-sm text-slate-600 leading-snug">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {tier.notIncluded.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                      Not Included
                    </h4>
                    <ul className="mt-4 space-y-3">
                      {tier.notIncluded.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <X className="flex-shrink-0 w-4 h-4 text-slate-400 mt-0.5" />
                          <span className="ml-3 text-sm text-slate-500 leading-snug">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16 bg-blue-50/50 rounded-2xl p-8 border border-blue-100 transition-colors hover:bg-blue-50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 p-3 rounded-lg text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Credit Module Pro Add-on
              </h3>
              <p className="text-slate-600 mt-1 max-w-2xl text-sm">
                Unlock the self-service AI credit optimization toolkit. Includes
                AI dispute letter generator, inquiry dispute workflows, bureau
                tracking, and more.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6 whitespace-nowrap">
            <span className="text-2xl font-bold text-slate-900">
              +${feeSettings?.creditModuleProAddonPrice ?? 197}
              <span className="text-sm font-medium text-slate-500">/mo</span>
            </span>

            {creditModuleActive ? (
              <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-bold text-sm flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Already Active
              </span>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      selectedAddonIds.includes("credit_module_pro")
                        ? "text-emerald-600"
                        : "text-slate-600",
                    )}
                  >
                    {selectedAddonIds.includes("credit_module_pro")
                      ? "Added to Cart"
                      : "Add to Plan"}
                  </span>
                  <Switch
                    checked={selectedAddonIds.includes("credit_module_pro")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAddonIds((prev) => [
                          ...prev,
                          "credit_module_pro",
                        ]);
                      } else {
                        setSelectedAddonIds((prev) =>
                          prev.filter((id) => id !== "credit_module_pro"),
                        );
                      }
                    }}
                  />
                </div>
                {!activeTierId && !selectedPlanId && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded font-semibold mt-1">
                    Requires Membership
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Summary Section */}
      {(selectedPlanId || selectedAddonIds.length > 0) && (
        <>
          {/* Spacer so the fixed cart doesn't overlap content */}
          <div className="h-24 md:h-28" />
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:p-6 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] z-50">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {selectedPlanId && (
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-medium">
                      Selected Plan
                    </span>
                    <span className="text-slate-900 font-bold">
                      {tiers.find((t) => t.id === selectedPlanId)?.name} ($
                      {tiers.find((t) => t.id === selectedPlanId)?.price}/mo)
                    </span>
                  </div>
                )}
                {selectedAddonIds.length > 0 && (
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-medium">
                      Selected Add-ons
                    </span>
                    <span className="text-slate-900 font-bold">
                      Credit Module Pro ($
                      {feeSettings?.creditModuleProAddonPrice ?? 197}/mo)
                    </span>
                  </div>
                )}
                <div className="flex flex-col pl-6 border-l border-slate-200">
                  <span className="text-slate-500 font-medium">
                    Monthly Total
                  </span>
                  <span className="text-blue-600 font-extrabold text-lg">
                    $
                    {(selectedPlanId
                      ? (tiers.find((t) => t.id === selectedPlanId)?.price ?? 0)
                      : 0) +
                      (selectedAddonIds.includes("credit_module_pro")
                        ? (feeSettings?.creditModuleProAddonPrice ?? 197)
                        : 0)}
                    /mo
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => {
                  const planPrice = selectedPlanId
                    ? (tiers.find((t) => t.id === selectedPlanId)?.price ?? 0)
                    : 0;
                  const addonsPrice = selectedAddonIds.includes(
                    "credit_module_pro",
                  )
                    ? (feeSettings?.creditModuleProAddonPrice ?? 197)
                    : 0;
                  const total = planPrice + addonsPrice;
                  onSelectPlan?.(selectedPlanId || "", total, selectedAddonIds);
                }}
                disabled={isLoading || (!selectedPlanId && !activeTierId)}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-lg px-8 h-12"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
