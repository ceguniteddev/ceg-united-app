"use client";

import { useState } from "react";
import { DodoCheckoutView } from "@/components/funding/DodoCheckoutView";
import { useDodoCheckoutDetails } from "@/hooks/dodo";
import { toast } from "sonner";

import { activateUserAddon, AddonTier } from "@/service/addons";

type AddonCheckoutViewProps = {
  checkoutId: string;
  userId: string;
  addonId: string;
  amount: number;
  prefillEmail?: string;
  onPaymentCompleteAction?: () => void;
};

export const AddonCheckoutView = ({
  checkoutId,
  userId,
  addonId,
  amount,
  onPaymentCompleteAction,
}: AddonCheckoutViewProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const { checkoutDetails } = useDodoCheckoutDetails(checkoutId);

  const handleComplete = async (paymentId?: string) => {
    if (isRecording) return; // Prevent duplicate calls

    setIsRecording(true);

    try {
      await activateUserAddon({
        userId,
        addonId: addonId as AddonTier,
        planId: checkoutId,
        receiptId: paymentId,
        amount,
        checkoutId,
      });

      toast.success("Payment successful! Your add-on is being activated.");
      onPaymentCompleteAction?.();
    } catch (error) {
      console.error(error);
      toast.error(
        "There was an error verifying your payment. Please contact support.",
      );
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Complete Your Add-on Purchase
        </h2>
        <p className="text-gray-600">
          Please complete the payment form below to finalize unlocking your
          add-on module.
        </p>
      </div>

      <div className="rounded-lg overflow-hidden shadow-xl">
        <DodoCheckoutView
          checkoutId={checkoutId}
          checkoutDetails={{
            ...(checkoutDetails || {}),
            amount: Math.round(amount * 100),
          }}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
};
