"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DodoCheckoutView } from "@/components/funding/DodoCheckoutView";
import { useDodoCheckoutDetails } from "@/hooks/dodo";
import { toast } from "sonner";
import { useCartStore } from "@/components/tradelines/useCartStore";
import { USER_ALL_TRADELINES_KEY } from "@/hooks/tradelines";
import type { CartItem } from "@/types/tradelines";

type TradelineCheckoutViewProps = {
  checkoutId: string;
  items: CartItem[];
  totalPrice: number;
  prefillEmail?: string;
  userId: string;
  onPaymentCompleteAction?: () => void;
};

export const TradelineCheckoutView = ({
  checkoutId,
  items,
  totalPrice,
  userId,
  onPaymentCompleteAction,
}: TradelineCheckoutViewProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const queryClient = useQueryClient();
  const { checkoutDetails } = useDodoCheckoutDetails(checkoutId);

  const handleComplete = (paymentId?: string) => {
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
              planId: checkoutId,
              receiptId: paymentId || null,
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
        onPaymentCompleteAction?.();

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

      {/* Dodo Checkout */}
      <div className="rounded-lg overflow-hidden shadow-xl">
        <DodoCheckoutView
          checkoutId={checkoutId}
          checkoutDetails={{
            ...(checkoutDetails || {}),
            amount: Math.round(totalPrice * 100),
          }}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
};
