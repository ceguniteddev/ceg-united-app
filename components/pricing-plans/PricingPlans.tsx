"use client";

import React from "react";
import { Check, X, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeeSettings } from "@/hooks/fee-settings";
import { cn } from "@/lib/utils";

interface PricingPlansProps {
  onSelectPlan?: (planId: string) => void;
  isLoading?: boolean;
}

export function PricingPlans({
  onSelectPlan,
  isLoading = false,
}: PricingPlansProps) {
  const { data: feeSettings, isLoading: isLoadingSettings } = useFeeSettings();

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
        "Advanced underwriting",
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
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              "relative flex flex-col h-full rounded-2xl bg-white shadow-lg border transition-all duration-200 hover:shadow-xl",
              tier.highlight
                ? "border-blue-600 ring-2 ring-blue-600 ring-opacity-50 scale-105 z-10"
                : "border-slate-200",
            )}
          >
            {tier.badge && (
              <div className="absolute top-0 inset-x-0 flex justify-center -mt-4">
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-full shadow-sm">
                  {tier.badge}
                </span>
              </div>
            )}

            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
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
                onClick={() => onSelectPlan?.(tier.id)}
                disabled={isLoading || isLoadingSettings}
                className={cn(
                  "mt-8 w-full h-12 text-md font-semibold transition-colors",
                  tier.highlight
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200",
                )}
              >
                {tier.cta}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>

            <div className="p-8 flex-1 flex flex-col bg-slate-50 rounded-b-2xl">
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                What's Included
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
        ))}
      </div>

      {/* <div className="mt-16 bg-blue-50 rounded-2xl p-8 border border-blue-100">
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
          <div className="flex flex-col sm:flex-row items-center gap-4 whitespace-nowrap">
            <span className="text-2xl font-bold text-slate-900">
              +${feeSettings?.creditModuleProAddonPrice ?? 197}
              <span className="text-sm font-medium text-slate-500">/mo</span>
            </span>
            <span className="text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-semibold">
              Requires Active Membership
            </span>
          </div>
        </div>
      </div> */}
    </div>
  );
}
