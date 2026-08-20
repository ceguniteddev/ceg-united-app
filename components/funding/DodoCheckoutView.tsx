"use client";

import { useEffect, useRef } from "react";
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
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Unified single-execution success handler
  const handleSuccess = (paymentId?: string) => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    if (DodoPayments.Checkout.isOpen()) {
      DodoPayments.Checkout.close();
    }
    onCompleteRef.current?.(paymentId);
  };

  // Intercept and suppress ALL SDK top-level window redirects in inline mode
  useEffect(() => {
    hasCompletedRef.current = false;

    const handleCaptureMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.event_type === "checkout.redirect") {
        // Stop the dodopayments-checkout SDK from receiving this event and calling window.location.href
        event.stopImmediatePropagation();

        const redirectTo = String(
          data.data?.message?.redirect_to || data.data?.redirect_to || "",
        );
        const paymentId = String(
          data.data?.message?.payment_id || data.data?.payment_id || "",
        );

        const isExplicitFailure =
          redirectTo.includes("/failed") ||
          redirectTo.includes("status=failed") ||
          redirectTo.includes("status=error") ||
          redirectTo.includes("/cancelled");

        if (!isExplicitFailure) {
          handleSuccess(paymentId || undefined);
        }
      }
    };

    window.addEventListener("message", handleCaptureMessage, true);

    return () => {
      window.removeEventListener("message", handleCaptureMessage, true);
    };
  }, []);

  useEffect(() => {
    if (!checkoutUrl) return;

    DodoPayments.Initialize({
      mode:
        process.env.NEXT_PUBLIC_DODO_PAYMENTS_MODE === "live" ? "live" : "test",
      displayType: "inline",
      onEvent: (event: any) => {
        const isSuccess =
          (event.event_type === "checkout.status" &&
            (event.data?.status === "succeeded" ||
              event.data?.status === "completed")) ||
          event.event_type === "checkout.payment_succeeded" ||
          event.event_type === "checkout.completed";

        if (isSuccess) {
          handleSuccess(String(event.data?.payment_id || ""));
        }
      },
    });
    DodoPayments.Checkout.open({ checkoutUrl, elementId });

    return () => {
      if (DodoPayments.Checkout.isOpen()) DodoPayments.Checkout.close();
    };
  }, [checkoutUrl, elementId]);

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
