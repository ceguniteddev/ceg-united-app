"use client";

import { useEffect } from "react";
import { DodoPayments } from "@/lib/dodo-checkout";
import { currency } from "@/lib/utils";

type DodoCheckoutViewProps = {
  checkoutDetails: {
    url?: string;
    checkout_url?: string;
    amount?: number | null;
    paymentKey?: string;
  };
  checkoutId: string;
  onComplete?: (paymentId?: string) => void;
};

export const DodoCheckoutView = ({
  checkoutDetails,
  checkoutId,
  onComplete,
}: DodoCheckoutViewProps) => {
  const checkoutUrl = checkoutDetails.checkout_url || checkoutDetails.url;
  const elementId = `dodo-inline-checkout-${checkoutId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  useEffect(() => {
    if (!checkoutUrl) return;

    DodoPayments.Initialize({
      mode:
        process.env.NEXT_PUBLIC_DODO_PAYMENTS_MODE === "live" ? "live" : "test",
      displayType: "inline",
      onEvent: (event) => {
        if (
          event.event_type === "checkout.status" &&
          event.data?.status === "succeeded"
        ) {
          onComplete?.(String(event.data.payment_id || ""));
        }
      },
    });
    DodoPayments.Checkout.open({ checkoutUrl, elementId });

    return () => {
      if (DodoPayments.Checkout.isOpen()) DodoPayments.Checkout.close();
    };
  }, [checkoutUrl, elementId, onComplete]);

  if (!checkoutUrl) {
    return <p role="alert">Dodo checkout URL is unavailable.</p>;
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold">Complete Your Purchase</h1>
        <p className="mt-2 text-muted-foreground">
          Complete the secure Dodo Payments checkout below.
        </p>
      </header>
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex justify-between gap-4">
          <span>Payment</span>
          <strong>
            {checkoutDetails.amount != null
              ? currency(checkoutDetails.amount / 100)
              : "Calculated at checkout"}
          </strong>
        </div>
      </div>
      <div
        id={elementId}
        data-testid="dodo-inline-checkout"
        className="min-h-[720px] w-full rounded-lg border bg-white"
      />
    </section>
  );
};
