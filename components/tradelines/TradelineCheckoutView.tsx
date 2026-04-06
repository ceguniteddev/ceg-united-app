"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";
import { useCartStore } from "@/components/tradelines/useCartStore";
import { USER_ALL_TRADELINES_KEY } from "@/hooks/tradelines";
import type { CartItem } from "@/types/tradelines";

type TradelineCheckoutViewProps = {
  checkoutId: string;
  items: CartItem[];
  totalPrice: number;
  prefillEmail?: string;
  userId: string;
  onPaymentComplete?: () => void;
};

export const TradelineCheckoutView = ({
  checkoutId,
  items,
  totalPrice,
  prefillEmail,
  userId,
  onPaymentComplete,
}: TradelineCheckoutViewProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const queryClient = useQueryClient();

  const handleComplete = (plan_id: string, receipt_id?: string) => {
    if (isRecording) return; // Prevent duplicate calls

    setIsRecording(true);

    // Use async IIFE to handle the promise without returning it
    (async () => {
      try {
        const response = await fetch(
          `/api/user/${userId}/tradelines/purchase`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items,
              totalPrice,
              planId: plan_id,
              receiptId: receipt_id || null,
              checkoutId,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to record purchase");
        }

        // Clear Zustand cart state
        useCartStore.getState().clearCart();

        // Invalidate React Query cache so purchased tab shows fresh data
        queryClient.invalidateQueries({ queryKey: USER_ALL_TRADELINES_KEY });

        // Clear cart from sessionStorage
        sessionStorage.removeItem("tradeline_checkout_data");

        // Notify parent to close sheet / switch tabs
        onPaymentComplete?.();

        toast.success("Payment successful! Your order is being processed.");
      } catch (error: any) {
        console.error("Error recording purchase:", error);
        toast.error(
          "Payment succeeded but failed to record purchase. Please contact support.",
        );
      } finally {
        setIsRecording(false);
      }
    })();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Complete Your Tradeline Purchase
        </h2>
        <p className="text-gray-600">
          Please complete the payment form below to finalize your order.
        </p>
      </div>

      {/* Whop Checkout Embed */}
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
