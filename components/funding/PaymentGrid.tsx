"use client";

import React from "react";
import { PaymentPlan } from "@/schema/payments";
import { toast } from "sonner";
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
import { useAuth } from "@/provider/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Mail, Clock, CheckCircle2 } from "lucide-react";

type PaymentGridProps = {
  userId?: string;
  className?: string;
  redirectPath?: "checkout" | "client-payments";
  paymentId?: string;
};

export const PaymentGrid = ({
  userId,
  className = "",
  redirectPath = "client-payments",
  paymentId,
}: PaymentGridProps) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 ${className}`}
    >
      {PRICING_PLANS.map((option, idx) => (
        <PaymentOptionCard key={idx} option={option}>
          <WhopCheckoutButton
            userId={userId}
            paymentId={paymentId}
            paymentKey={option.whopKey}
            buttonName="Pay in Full"
            redirectPath={redirectPath}
            className={`w-full text-white h-auto py-2.5 sm:py-3 ${
              option.recommended
                ? "bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900"
                : "bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900"
            }`}
          />
          {option.hasDenefits &&
            (option.denefitsWhopKey ? (
              <WhopCheckoutButton
                userId={userId}
                paymentId={paymentId}
                paymentKey={option.denefitsWhopKey}
                buttonName={option.denefitsText}
                subText={option.denefitsNote}
                redirectPath={redirectPath}
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
                <Button
                  variant="outline"
                  className="w-full text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 h-auto py-2 flex flex-col justify-center items-center"
                >
                  <span className="flex items-center justify-center gap-2">
                    {option.denefitsText} <ArrowUpRight className="w-4 h-4" />
                  </span>
                  {option.denefitsNote && (
                    <span className="text-[10px] sm:text-[11px] opacity-70 font-normal mt-0.5 tracking-tight">
                      {option.denefitsNote}
                    </span>
                  )}
                </Button>
              </a>
            ))}
        </PaymentOptionCard>
      ))}
    </div>
  );
};

type WhopCheckoutButtonProps = {
  userId?: string;
  buttonName: string;
  subText?: string;
  className: string;
  paymentKey: PaymentPlan;
  redirectPath?: "checkout" | "client-payments";
  paymentId?: string;
};

const WhopCheckoutButton = ({
  userId: userIdProp,
  buttonName,
  subText,
  className,
  paymentKey,
  redirectPath = "client-payments",
  paymentId,
}: WhopCheckoutButtonProps) => {
  const auth = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  // Use provided userId or fall back to auth context
  const userId = userIdProp || auth.user?.uid;

  const handleCheckout = async () => {
    if (!userId) {
      toast.error("You must be logged in to proceed.");
      return;
    }

    setIsLoading(true);
    try {
      // Intelligence plan: Create Denefits proposal directly (no Whop)
      if (paymentKey === "IntelligenceDownPayment") {
        // Get paymentId from URL if available (for public payment pages)

        if (!paymentId) {
          toast.error(
            "Payment session not found. Please use the payment link sent to your email.",
          );
          return;
        }

        const response = await fetch(`/api/denefits/create-proposal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentId,
            serviceAmount: 6000,
            downpaymentAmount: 1000,
            serviceName: "CEG Brain™ Intelligence",
            proposalType: "no-fee",
          }),
        });

        if (!response.ok) {
          console.log("API Error:", response.status, response.statusText);
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error Response:", {
            status: response.status,
            statusText: response.statusText,
            errorData,
          });

          // Show more specific error messages
          const errorMessage =
            errorData.message ||
            (response.status === 401 || response.status === 403
              ? "You must be logged in to apply for financing."
              : response.status === 400
                ? "Invalid request. Please check your information and try again."
                : "Failed to create financing proposal. Please try again or contact support.");

          throw new Error(errorMessage);
        }

        const data = await response.json();

        toast.success("Financing Application Submitted!", {
          description:
            "Check your email from Denefits for a secure link to complete your installment plan setup.",
          duration: 10000,
        });

        setShowConfirm(false);
        return;
      }

      // All other plans: Use Whop checkout
      let checkoutId: string;

      // If userId was provided as prop, use server action directly
      if (userIdProp) {
        const result = await createWhopCheckoutConfig({
          userId: userIdProp,
          paymentKey,
        });
        checkoutId = result.checkoutId;
      } else {
        // Otherwise, call API route (for client-side auth context)
        const response = await fetch(`/api/user/${userId}/whop`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentKey }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to create checkout session.",
          );
        }

        const data = await response.json();
        checkoutId = data.checkoutId;
      }

      if (checkoutId) {
        const url =
          redirectPath === "checkout"
            ? `/checkout/${checkoutId}`
            : `/client/payments/whop/${checkoutId}`;
        window.open(url, "_blank");

        // Show reminder for downpayment plans
        if (isDownPayment) {
          setTimeout(() => {
            toast.success("Checkout opened!", {
              description:
                "Remember: After payment, check your email from Denefits to complete your installment setup.",
              duration: 8000,
            });
          }, 500);
        }
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

  const [showConfirm, setShowConfirm] = React.useState(false);
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
              <AlertDialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                {paymentKey === "IntelligenceDownPayment"
                  ? "Financing Application"
                  : "Installment Plan Setup"}
              </AlertDialogTitle>
              <div className="text-sm text-muted-foreground space-y-4">
                {paymentKey === "IntelligenceDownPayment" ? (
                  <p className="text-foreground font-medium">
                    You are about to submit a financing application with
                    Denefits:
                  </p>
                ) : (
                  <p className="text-foreground font-medium">
                    You are about to start a 2-step setup process:
                  </p>
                )}

                <div className="space-y-3">
                  {paymentKey === "IntelligenceDownPayment" ? (
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-semibold text-xs">
                          <Mail className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-foreground flex items-center gap-2">
                          Check Your Email from Denefits
                        </p>
                        <p className="text-sm">
                          After clicking "Submit Application", you'll receive an
                          email from Denefits with a secure link to:
                        </p>
                        <ul className="mt-2 space-y-1 text-sm ml-4 list-disc">
                          <li>
                            Pay your {planDetails.downpayment} downpayment
                            securely
                          </li>
                          <li>Set up your remaining installments</li>
                          <li>Review and sign your financing agreement</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-3 items-start">
                        <div className="mt-0.5 flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs">
                            1
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Initial Downpayment
                          </p>
                          <p className="text-sm">
                            Securely pay your downpayment of{" "}
                            {planDetails.downpayment} today via Whop.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start">
                        <div className="mt-0.5 flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-semibold text-xs">
                            2
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4 text-green-600 dark:text-green-400" />
                            Check Your Email
                          </p>
                          <p className="text-sm">
                            {paymentKey === "AuditDownPayment" ? (
                              <>
                                You'll receive an email from Denefits with a
                                secure link to complete your financing
                                application and set up your installment plan.
                              </>
                            ) : (
                              <>
                                Within{" "}
                                <strong className="text-foreground">
                                  24 hours
                                </strong>
                                , you'll receive an email from Denefits with a
                                secure link to:
                              </>
                            )}
                          </p>
                          {paymentKey === "AcceleratorDownPayment" && (
                            <ul className="mt-2 space-y-1 text-sm ml-4 list-disc">
                              <li>Pay the $39 enrollment fee</li>
                              <li>Set up your remaining installments</li>
                              <li>Review and sign your financing agreement</li>
                            </ul>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-amber-900 dark:text-amber-200 mb-1">
                      Important: Check Your Inbox & Spam
                    </p>
                    <p className="text-amber-800 dark:text-amber-300">
                      Look for an email from <strong>Denefits</strong> to
                      complete your installment plan setup. Don't miss this step
                      to avoid any interruption in your enrollment!
                    </p>
                  </div>
                </div>

                {paymentKey !== "IntelligenceDownPayment" && (
                  <em className="block text-xs text-muted-foreground">
                    (Note: Financing includes a {planDetails.fee} convenience
                    fee for a total of {planDetails.total})
                  </em>
                )}
              </div>
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
                {paymentKey === "IntelligenceDownPayment"
                  ? "Submit Application"
                  : "Proceed to Payment"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
