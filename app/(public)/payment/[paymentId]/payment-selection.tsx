"use client";

import React, { useState } from "react";
import { PaymentPlan } from "@/schema/payments";
import { toast } from "sonner";
import { UserWithId } from "@/schema/registration";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PaymentOptionCard,
  WhopCheckoutButtonBase,
} from "@/components/funding/PaymentOptionCard";
import { PRICING_PLANS } from "@/constant/payment";
import { createWhopCheckoutConfig } from "@/service/whop";

export default function PaymentSelection({ user }: { user: UserWithId }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 p-4 max-w-6xl mx-auto">
      {PRICING_PLANS.map((option, idx) => (
        <PaymentOptionCard key={idx} option={option}>
          <WhopCheckoutButton
            userId={user.id}
            paymentKey={option.whopKey}
            buttonName="Pay in Full"
            className={`w-full text-white h-auto py-2.5 sm:py-3 ${
              option.recommended
                ? "bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900"
                : "bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900"
            }`}
          />
          {option.hasDenefits &&
            (option.denefitsWhopKey ? (
              <WhopCheckoutButton
                userId={user.id}
                paymentKey={option.denefitsWhopKey}
                buttonName={option.denefitsText}
                subText={option.denefitsNote}
                className="w-full text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 h-auto py-2 sm:py-2.5 bg-transparent mt-2"
              />
            ) : (
              <a
                href={
                  (option.whopKey.includes("Audit")
                    ? process.env.NEXT_PUBLIC_DENEFITS_AUDIT_URL
                    : option.whopKey.includes("Intelligence")
                      ? process.env.NEXT_PUBLIC_DENEFITS_INTELLIGENCE_URL
                      : option.whopKey.includes("Accelerator")
                        ? process.env.NEXT_PUBLIC_DENEFITS_ACCELERATOR_URL
                        : process.env.NEXT_PUBLIC_DENEFITS_URL) || "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2"
              >
                <WhopCheckoutButtonBase
                  buttonName={option.denefitsText}
                  subText={option.denefitsNote}
                  className="w-full text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 h-auto py-2 sm:py-2.5 bg-transparent"
                  isLoading={false}
                  onClick={() => {}} // link handles it
                />
              </a>
            ))}
        </PaymentOptionCard>
      ))}
    </div>
  );
}

const WhopCheckoutButton = ({
  userId,
  buttonName,
  subText,
  className,
  paymentKey,
}: {
  userId: string;
  buttonName: string;
  subText?: string;
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

  const [showConfirm, setShowConfirm] = useState(false);
  const isDownPayment = String(paymentKey).includes("DownPayment");

  const handleCheckoutClick = () => {
    if (isDownPayment) {
      setShowConfirm(true);
    } else {
      handleCheckout();
    }
  };

  const getPlanDetails = () => {
    switch (paymentKey) {
      case "AuditDownPayment":
        return { downpayment: "$750", fee: "$500", total: "$2,500" };
      case "IntelligenceDownPayment":
        return { downpayment: "$1,000", fee: "$1,000", total: "$6,000" };
      case "AcceleratorDownPayment":
        return { downpayment: "$5,000", fee: "$2,000", total: "$17,000" };
      default:
        return { downpayment: "", fee: "", total: "" };
    }
  };

  const planDetails = getPlanDetails();

  return (
    <>
      <WhopCheckoutButtonBase
        buttonName={buttonName}
        subText={subText}
        className={className}
        isLoading={isLoading}
        onClick={handleCheckoutClick}
      />

      {showConfirm && (
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Installment Plan Setup</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                You are about to start a 2-step setup process for the
                installment plan:
                <ul className="list-decimal pl-5 my-4 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>
                    <strong>Initial Downpayment:</strong> Securely pay your
                    downpayment of {planDetails.downpayment} today via Whop.
                  </li>
                  <li>
                    <strong>Finalize Installments:</strong> After the
                    downpayment, you will be automatically redirected to
                    Denefits to pay a $39 enrollment fee and set up the
                    remaining installments.
                  </li>
                </ul>
                <em className="block mb-4 text-xs text-muted-foreground">
                  (Note: Financing includes a {planDetails.fee} convenience fee
                  for a total of {planDetails.total})
                </em>
                <span className="font-medium text-foreground">
                  Do you want to proceed?
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  setShowConfirm(false);
                  handleCheckout();
                }}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Proceed to Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
