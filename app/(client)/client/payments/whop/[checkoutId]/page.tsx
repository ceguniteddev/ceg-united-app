"use client";

import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/provider/AuthContext";
import Spinner from "@/components/Spinner";
import { toast } from "sonner";
import { useWhopCheckoutDetails } from "@/hooks/whop";
import { currency } from "@/lib/utils";

const WhopCheckoutPage = () => {
  const params = useParams();
  const { user, loading: userLoading } = useAuth();

  const checkoutId = params.checkoutId as string;

  const {
    checkoutDetails,
    isLoading: checkoutLoading,
    error,
  } = useWhopCheckoutDetails(checkoutId);

  if (userLoading || checkoutLoading) {
    return <Spinner displayText="Loading checkout details..." />;
  }

  if (error || !checkoutDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {error
          ? `Error: ${error.message}`
          : "Invalid checkout session or details not found."}
      </div>
    );
  }

  const planName =
    checkoutDetails.paymentKey === "FullPayment"
      ? "Full Payment Plan"
      : "Financing Plan";
  const planPrice = checkoutDetails.initialPrice;

  const returnUrl =
    checkoutDetails.paymentKey === "FinancingPlan"
      ? process.env.NEXT_PUBLIC_DEFENITS_URL
      : "";

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6">
          Complete Your Purchase
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-10">
          Please complete the payment form below to finalize your enrollment.
        </p>

        {/* Purchase Details */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 border-b pb-3">
            Order Summary
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Plan Selected:
              </span>
              <span className="font-medium">{planName}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-800 dark:text-gray-200">
                Total Amount:
              </span>
              <span>{currency(planPrice)}</span>
            </div>
            {checkoutDetails.paymentKey === "FinancingPlan" && (
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-center text-yellow-800 dark:text-yellow-200">
                    <strong>Please Note:</strong> After completing this payment,
                    you will be automatically redirected to the Denefits
                    checkout platform to finalize your enrollment.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg overflow-hidden shadow-2xl">
          <WhopCheckoutEmbed
            prefill={{
              email: user?.email || "",
              address: {
                country: "US",
              },
            }}
            returnUrl={returnUrl || undefined}
            sessionId={checkoutId}
            onComplete={(planId, receiptId) => {
              toast.success("Payment successful!");
            }}
            fallback={
              <div className="flex items-center justify-center h-96">
                <Spinner displayText="Loading secure checkout..." />
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default WhopCheckoutPage;
