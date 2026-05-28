"use client";

import { useState } from "react";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";

type MembershipCheckoutViewProps = {
  checkoutId: string;
  prefillEmail?: string;
  onPaymentCompleteAction?: () => void;
};

export const MembershipCheckoutView = ({
  checkoutId,
  prefillEmail,
  onPaymentCompleteAction,
}: MembershipCheckoutViewProps) => {
  const [isRecording, setIsRecording] = useState(false);

  const handleComplete = (plan_id: string, receipt_id?: string) => {
    if (isRecording) return; // Prevent duplicate calls

    setIsRecording(true);

    // Normally we would have an API call here to verify the purchase,
    // but Whop webhooks can handle the fulfillment on the backend.
    // We just need to close the modal and maybe refresh the page.
    setTimeout(() => {
      setIsRecording(false);
      toast.success("Payment successful! Your membership is being activated.");
      onPaymentCompleteAction?.();
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Complete Your Membership Purchase
        </h2>
        <p className="text-gray-600">
          Please complete the payment form below to finalize your membership.
        </p>
      </div>

      <div className="rounded-lg overflow-hidden shadow-xl">
        <WhopCheckoutEmbed
          prefill={{
            email: prefillEmail || "",
            address: {
              country: "US",
            },
          }}
          sessionId={checkoutId}
          onComplete={handleComplete}
          fallback={
            <div className="flex items-center justify-center h-96">
              <Spinner displayText="Loading secure checkout..." />
            </div>
          }
        />
      </div>
    </div>
  );
};
