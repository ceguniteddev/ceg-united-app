"use client";

import { useState } from "react";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";
import { useFeeSettings } from "@/hooks/fee-settings";

import { activateUserMembership } from "@/service/membership";
import { activateUserAddon } from "@/service/addons";

type MembershipCheckoutViewProps = {
  checkoutId: string;
  userId: string;
  tierId: string;
  amount: number; // Total combined amount paid
  membershipAmount: number; // Membership portion of the price
  addonAmount?: number; // Add-on portion of the price (default 197)
  pendingAddons?: string[]; // Queued addons to activate (e.g., ["credit_module_pro"])
  prefillEmail?: string;
  onPaymentCompleteAction?: () => void;
};

export const MembershipCheckoutView = ({
  checkoutId,
  userId,
  tierId,
  amount,
  membershipAmount,
  addonAmount,
  pendingAddons,
  prefillEmail,
  onPaymentCompleteAction,
}: MembershipCheckoutViewProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const { data: feeSettings } = useFeeSettings();

  const resolvedMembershipAmount =
    tierId === "tier_starter"
      ? (feeSettings?.tierStarterPrice ?? 297)
      : tierId === "tier_pro"
        ? (feeSettings?.tierProPrice ?? 397)
        : tierId === "tier_executive"
          ? (feeSettings?.tierExecutivePrice ?? 697)
          : membershipAmount;

  const resolvedAddonAmount =
    addonAmount ?? feeSettings?.creditModuleProAddonPrice ?? 197;

  const handleComplete = async (plan_id: string, receipt_id?: string) => {
    if (isRecording) return; // Prevent duplicate calls

    setIsRecording(true);

    try {
      await activateUserMembership({
        userId,
        tier: tierId,
        planId: plan_id,
        receiptId: receipt_id,
        amount: resolvedMembershipAmount,
        checkoutId: receipt_id || checkoutId,
      });

      if (pendingAddons && pendingAddons.includes("credit_module_pro")) {
        await activateUserAddon({
          userId,
          addonId: "credit_module_pro",
          amount: resolvedAddonAmount,
          planId: plan_id,
          receiptId: receipt_id,
          checkoutId: receipt_id || checkoutId,
        });
      }

      toast.success(
        "Payment successful! Your membership and selected add-ons have been activated.",
      );
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
          Secure Checkout
        </h2>
        <p className="text-gray-600">Complete Your Purchase</p>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex justify-between text-gray-600 mb-2">
            <span>Membership Subscription</span>
            <span>${resolvedMembershipAmount}/mo</span>
          </div>
          {pendingAddons && pendingAddons.includes("credit_module_pro") && (
            <div className="flex justify-between text-gray-600 mb-2">
              <span>Credit Module Pro Add-on</span>
              <span>${resolvedAddonAmount}/mo</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-gray-900">
            <span>Total cart amount</span>
            <span>${amount}/mo</span>
          </div>
        </div>
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
