"use client";

import { toast } from "sonner";
import Spinner from "@/components/Spinner";
import { useFeeSettings } from "@/hooks/fee-settings";
import { useDodoCheckoutDetails } from "@/hooks/dodo";
import { DodoCheckoutView } from "@/components/funding/DodoCheckoutView";

type MembershipCheckoutViewProps = {
  checkoutId: string;
  checkoutUrl?: string;
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
  checkoutUrl,
  userId,
  tierId,
  amount,
  membershipAmount,
  addonAmount,
  pendingAddons,
  prefillEmail,
  onPaymentCompleteAction,
}: MembershipCheckoutViewProps) => {
  const { data: feeSettings } = useFeeSettings();
  const {
    checkoutDetails: fetchedCheckoutDetails,
    isLoading,
    error,
  } = useDodoCheckoutDetails(checkoutUrl ? "" : checkoutId);
  const checkoutDetails = checkoutUrl
    ? { url: checkoutUrl, amount: Math.round(amount * 100) }
    : fetchedCheckoutDetails;

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

  const handleComplete = () => {
    toast.success(
      "Payment received. Your membership will activate after verification.",
    );
    onPaymentCompleteAction?.();
  };

  if (!checkoutUrl && isLoading) {
    return <Spinner displayText="Loading secure Dodo checkout..." />;
  }

  if ((!checkoutUrl && error) || !checkoutDetails) {
    return <p role="alert">Unable to load the Dodo Payments checkout.</p>;
  }

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
        <DodoCheckoutView
          checkoutId={checkoutId}
          checkoutDetails={checkoutDetails}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
};
