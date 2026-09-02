"use client";

import { useEffect, useState } from "react";
import { PricingPlans } from "@/components/pricing-plans/PricingPlans";
import { MembershipCheckoutView } from "@/components/pricing-plans/MembershipCheckoutView";
import { createMembershipCheckoutConfig } from "@/service/dodo";
import { useAuth } from "@/provider/AuthContext";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const messages: Record<string, string> = {
  platform:
    "Platform Access is required for audits, analysis, and credit-report features.",
  "funding-course":
    "An active Platform Access membership and an eligible funding course are required for these funding tools.",
  "credit-to-capital":
    "The credit dispute module is unlocked by Credit to Capital while Platform Access is active.",
};

export default function ClientAccessPage() {
  const { userData } = useAuth();
  const [required, setRequired] = useState("platform");
  const [checkout, setCheckout] = useState<{
    id: string;
    url: string;
    amount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setRequired(
      new URLSearchParams(window.location.search).get("required") || "platform",
    );
  }, []);

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

  return (
    <>
      <main className="min-h-screen bg-white pb-16">
        <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
            <p className="font-semibold">This feature is currently locked</p>
            <p className="mt-1 text-sm leading-6">
              {messages[required] || messages.platform}
            </p>
          </div>
        </div>
        <PricingPlans onSelectPlan={startCheckout} isLoading={isLoading} />
      </main>

      <Sheet
        open={checkout !== null}
        onOpenChange={(open) => {
          if (!open) setCheckout(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <SheetHeader className="border-b border-gray-200 px-6 py-4">
            <SheetTitle className="text-xl font-bold">
              Secure Checkout
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {checkout && userData?.id && (
              <MembershipCheckoutView
                checkoutId={checkout.id}
                checkoutUrl={checkout.url}
                userId={userData.id}
                tierId="platform_access"
                amount={checkout.amount}
                membershipAmount={checkout.amount}
                prefillEmail={userData.email || ""}
                onPaymentCompleteAction={() =>
                  window.location.assign(
                    "/client/home?membershipCheckout=processing",
                  )
                }
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
