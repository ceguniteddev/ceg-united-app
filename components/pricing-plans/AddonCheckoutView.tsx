"use client";

import { useCallback, useRef } from "react";
import { DodoCheckoutView } from "@/components/funding/DodoCheckoutView";
import { useDodoCheckoutDetails } from "@/hooks/dodo";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getUserAddons, UserAddon } from "@/service/addons";

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
  const queryClient = useQueryClient();
  const isCompletingRef = useRef(false);
  const { checkoutDetails } = useDodoCheckoutDetails(checkoutId);

  const handleComplete = useCallback(async () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    try {
      toast.info("Payment received. Activating your add-on...");

      for (let attempt = 0; attempt < 8; attempt++) {
        const addons = (await queryClient.fetchQuery({
          queryKey: ["user-addons", userId],
          queryFn: () => getUserAddons(userId),
          staleTime: 0,
        })) as UserAddon[];

        if (
          addons.some(
            (addon) => addon.addonId === addonId && addon.status === "active",
          )
        ) {
          await queryClient.invalidateQueries({
            queryKey: ["has-credit-repair-addon", userId],
          });
          toast.success("Payment successful! Your add-on is now active.");
          onPaymentCompleteAction?.();
          return;
        }

        await queryClient.invalidateQueries({
          queryKey: ["user-addons", userId],
        });
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-addons", userId] }),
        queryClient.invalidateQueries({
          queryKey: ["has-credit-repair-addon", userId],
        }),
      ]);
      toast.info(
        "Your payment is confirmed. Add-on activation is still processing.",
      );
      onPaymentCompleteAction?.();
    } catch (error) {
      console.error("Failed to verify add-on activation:", error);
      toast.error(
        "Payment succeeded, but add-on verification is delayed. Please refresh shortly.",
      );
      onPaymentCompleteAction?.();
    }
  }, [addonId, onPaymentCompleteAction, queryClient, userId]);

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
