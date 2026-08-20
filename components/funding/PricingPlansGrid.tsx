"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { PaymentPlan } from "@/schema/payments";
import { PRICING_PLANS } from "@/constant/payment";
import { useAuth } from "@/provider/AuthContext";
import { DodoCheckoutButtonBase } from "./PaymentOptionCard";
import { createDodoCheckoutConfig } from "@/service/dodo";
import {
  ArrowUpRight,
  CheckCircle2,
  Phone,
  Calendar,
  Zap,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** Pass a specific userId (e.g. from server-side props). If omitted, falls back to the logged-in user. */
  userId?: string;
  className?: string;
};

const DENEFITS_URLS: Record<string, string | undefined> = {
  audit: process.env.NEXT_PUBLIC_DENEFITS_AUDIT_URL,
  intelligence: process.env.NEXT_PUBLIC_DENEFITS_INTELLIGENCE_URL,
  accelerator: process.env.NEXT_PUBLIC_DENEFITS_ACCELERATOR_URL,
};

const PLAN_ICONS = {
  installments: Calendar,
  "one-time": Zap,
  contact: Rocket,
};

export default function PricingPlansGrid({ userId, className }: Props) {
  // Default to the recommended plan (index 1 — One Payment)
  const defaultIdx = PRICING_PLANS.findIndex((p) => p.recommended);
  const [activeIdx, setActiveIdx] = useState(defaultIdx >= 0 ? defaultIdx : 0);

  const active = PRICING_PLANS[activeIdx];

  return (
    <div className={cn("w-full max-w-2xl mx-auto px-4 py-6", className)}>
      {/* Tab buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
        {PRICING_PLANS.map((plan, idx) => {
          const Icon = PLAN_ICONS[plan.type];
          return (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={cn(
                "cursor-pointer relative flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-200 text-left sm:text-center",
                activeIdx === idx
                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
              )}
            >
              {plan.recommended && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Best Deal
                </span>
              )}
              <div className="flex items-center justify-start sm:justify-center gap-2">
                <Icon
                  className={cn(
                    "h-5 w-5",
                    activeIdx === idx ? "text-blue-600" : "text-gray-500",
                  )}
                />
                <span className="block leading-tight">{plan.title}</span>
              </div>
              {plan.badge && (
                <span className="mt-1 inline-block text-xs font-normal text-emerald-600">
                  {plan.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Plan card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Price header */}
        <div
          className={cn(
            "px-6 py-6 border-b border-gray-100",
            active.recommended
              ? "bg-gradient-to-br from-blue-50 to-indigo-50"
              : "bg-gray-50",
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {(() => {
              const Icon = PLAN_ICONS[active.type];
              return (
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active.recommended ? "text-blue-600" : "text-gray-600",
                  )}
                />
              );
            })()}
            <p className="text-sm font-medium text-gray-500">{active.title}</p>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold text-gray-900">
              {active.price}
            </span>
            {active.priceSubtext && (
              <span className="text-base text-gray-500 mb-1">
                {active.priceSubtext}
              </span>
            )}
            {active.badge && (
              <span className="ml-2 mb-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {active.badge}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-600">{active.subtitle}</p>
        </div>

        {/* Features */}
        <ul className="px-6 py-5 space-y-3">
          {active.features.map((feature, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm text-gray-700"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="px-6 pb-6">
          {active.type === "installments" && (
            <a
              href={
                (active.denefitsUrlEnvKey
                  ? DENEFITS_URLS[active.denefitsUrlEnvKey]
                  : process.env.NEXT_PUBLIC_DENEFITS_URL) || "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  Get Started — $497/mo
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Button>
            </a>
          )}

          {active.type === "one-time" && active.paymentKey && (
            <DodoCheckoutButton
              userId={userId}
              paymentKey={active.paymentKey}
              buttonName="Pay $4,950 Now"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-sm font-semibold"
            />
          )}

          {active.type === "contact" && (
            <a
              href={process.env.NEXT_PUBLIC_CALENDLY_URL || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white h-11 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Book a Call
                </span>
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const DodoCheckoutButton = ({
  userId: userIdProp,
  buttonName,
  className,
  paymentKey,
}: {
  userId?: string;
  buttonName: string;
  className: string;
  paymentKey: PaymentPlan;
}) => {
  const { user } = useAuth();
  const resolvedUserId = userIdProp ?? user?.uid;
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!resolvedUserId) {
      toast.error("You must be logged in to proceed.");
      return;
    }
    setIsLoading(true);
    try {
      const { checkoutId, url } = await createDodoCheckoutConfig({
        userId: resolvedUserId,
        paymentKey,
      });

      if (checkoutId && url) {
        window.location.assign(url);
      } else {
        toast.error("Could not retrieve the checkout session.");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DodoCheckoutButtonBase
      buttonName={buttonName}
      className={className}
      isLoading={isLoading}
      onClick={handleCheckout}
    />
  );
};
