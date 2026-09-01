"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PricingPlans } from "@/components/pricing-plans/PricingPlans";
import { MembershipCheckoutView } from "@/components/pricing-plans/MembershipCheckoutView";
import { createMembershipCheckoutConfig } from "@/service/dodo";
import { useAuth } from "@/provider/AuthContext";
import { toast } from "sonner";

const messages: Record<string, string> = {
  platform:
    "Platform Access is required for audits, analysis, and credit-report features.",
  "funding-course":
    "An active Platform Access membership and an eligible funding course are required for these funding tools.",
  "credit-to-capital":
    "The credit dispute module is unlocked by Credit to Capital while Platform Access is active.",
};

export const dynamic = "force-dynamic";

export default function ClientAccessPage() {
  const { userData } = useAuth();
  const searchParams = useSearchParams();
  const required = searchParams.get("required") || "platform";
  const [checkout, setCheckout] = useState<{
    id: string;
    url: string;
    amount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCheckout = async (_planId: string, amount: number) => {
    if (!userData?.id) return;
    setIsLoading(true);
    try {
      const result = await createMembershipCheckoutConfig({
        userId: userData.id,
        planId: "platform_access",
        returnUrl: `${window.location.origin}/client/home?membershipCheckout=1`,
      });
      setCheckout({ id: result.checkoutId, url: result.url, amount });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start checkout.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (checkout && userData?.id) {
    return (
      <MembershipCheckoutView
        checkoutId={checkout.id}
        checkoutUrl={checkout.url}
        userId={userData.id}
        tierId="platform_access"
        amount={checkout.amount}
        membershipAmount={checkout.amount}
        onPaymentCompleteAction={() =>
          window.location.assign("/client/home?membershipCheckout=processing")
        }
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <p className="font-semibold">This feature is currently locked</p>
          <p className="mt-1 text-sm leading-6">
            {messages[required] || messages.platform}
          </p>
        </div>
      </div>
      <PricingPlans onSelectPlan={startCheckout} isLoading={isLoading} />
    </main>
  );
}
