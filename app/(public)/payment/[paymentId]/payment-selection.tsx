"use client";

import React, { useState } from "react";
import { PaymentPlan } from "@/schema/payments";
import { toast } from "sonner";
import { UserWithId } from "@/schema/registration";
import {
  PaymentOptionCard,
  WhopCheckoutButtonBase,
} from "@/components/funding/PaymentOptionCard";
import { PAYMENT_OPTIONS } from "@/constant/payment";
import { createWhopCheckoutConfig } from "@/service/whop";

export default function PaymentSelection({ user }: { user: UserWithId }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4">
      {PAYMENT_OPTIONS.map((option) => (
        <PaymentOptionCard key={option.key} option={option}>
          <WhopCheckoutButton
            userId={user.id}
            paymentKey={option.key as PaymentPlan}
            buttonName={`Select ${option.name}`}
            className={`w-full  text-white w-full sm:w-auto h-10 sm:h-9 ${option.recommended ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"}`}
          />
        </PaymentOptionCard>
      ))}
    </div>
  );
}

const WhopCheckoutButton = ({
  userId,
  buttonName,
  className,
  paymentKey,
}: {
  userId: string;
  buttonName: string;
  className: string;
  paymentKey: PaymentPlan;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const { checkoutId } = await createWhopCheckoutConfig({
        userId,
        paymentKey,
      });

      if (checkoutId) {
        let url = `/checkout/${checkoutId}`;
        window.open(url, "_blank");
      } else {
        toast.error("Could not retrieve the checkout session.");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WhopCheckoutButtonBase
      buttonName={buttonName}
      className={className}
      isLoading={isLoading}
      onClick={handleCheckout}
    />
  );
};
