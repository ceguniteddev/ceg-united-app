"use client";

import { useEffect, useState } from "react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useNewRegistrationStore } from "@/store/new-registration-store";
import { Step1Auth } from "./Step1Auth";
import { Step2BusinessDetails } from "./Step2BusinessDetails";
import { Step3Funding } from "./Step3Funding";
import { ProgressBar } from "@/components/registration/ProgressBar";
import {
  authSchema,
  businessDetailsSchema,
  fundingPageSchema,
} from "@/schema/new-registration";
import { toast } from "sonner";
import IconMenu from "@/components/icon-menu";
import { ChevronLeft, ChevronRight, UserPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PublicRegistrationForm() {
  const router = useRouter();
  const {
    currentStep,
    setStep,
    authData,
    updateAuthData,
    businessDetailsData,
    updateBusinessDetailsData,
    fundingData,
    updateFundingData,
    resetRegistration,
  } = useNewRegistrationStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // If they were on onboarding steps (4+), reset to 1
  useEffect(() => {
    if (currentStep > 3) {
      setStep(1);
    }
  }, [currentStep, setStep]);

  const formStep1 = useForm<any>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      firstName: authData.firstName || "",
      middleName: authData.middleName || "",
      lastName: authData.lastName || "",
      phoneNumber: authData.phoneNumber || "",
      email: authData.email || "",
      password: authData.password || "",
    },
  });

  const formStep2 = useForm<any>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: businessDetailsData,
  });

  const formStep3 = useForm<any>({
    resolver: zodResolver(fundingPageSchema),
    defaultValues: fundingData,
  });

  // Auto-save form 1, 2, 3 to store on change
  useEffect(() => {
    const subscription = formStep1.watch((value) => {
      updateAuthData(value);
    });
    return () => subscription.unsubscribe();
  }, [formStep1.watch, updateAuthData]);

  useEffect(() => {
    const subscription = formStep2.watch((value) => {
      updateBusinessDetailsData(value);
    });
    return () => subscription.unsubscribe();
  }, [formStep2.watch, updateBusinessDetailsData]);

  useEffect(() => {
    const subscription = formStep3.watch((value) => {
      updateFundingData(value);
    });
    return () => subscription.unsubscribe();
  }, [formStep3.watch, updateFundingData]);

  const progress = Math.floor(Math.min(((currentStep - 1) / 3) * 100, 100));

  const handleNextStep1 = async () => {
    const isValid = await formStep1.trigger();
    if (isValid) {
      updateAuthData(formStep1.getValues());
      setStep(2);
    } else {
      toast.error("Please fill all required fields correctly");
    }
  };

  const handleNextStep2 = async () => {
    const isValid = await formStep2.trigger();
    if (isValid) {
      updateBusinessDetailsData(formStep2.getValues());
      setStep(3);
    } else {
      toast.error("Please fill all required fields");
    }
  };

  const handleReview = async () => {
    const isValid = await formStep3.trigger();
    if (isValid) {
      updateFundingData(formStep3.getValues());
      setShowConfirmModal(true);
    } else {
      toast.error("Please provide all required funding information");
    }
  };

  const executeFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const store = useNewRegistrationStore.getState();
      const finalData = {
        auth: store.authData,
        business: store.businessDetailsData,
        funding: store.fundingData,
      };

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Registration failed");
      }

      toast.success(
        "Registration successful! Please check your email to verify your account.",
      );
      resetRegistration();
      setShowConfirmModal(false);
      router.push("/");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[95vw] sm:max-w-[900px] lg:max-w-[1000px] mx-auto">
      <ProgressBar progress={progress} className="mb-6" />

      {currentStep === 1 && (
        <Form {...formStep1}>
          <div className="space-y-6">
            <Step1Auth />
            <div className="flex justify-end">
              <Button
                onClick={handleNextStep1}
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-6 transition-colors"
              >
                <IconMenu
                  text="Next"
                  iconLocation="right"
                  icon={<ChevronRight className="ml-2 h-5 w-5" />}
                />
              </Button>
            </div>
          </div>
        </Form>
      )}

      {currentStep === 2 && (
        <Form {...formStep2}>
          <div className="space-y-6">
            <Step2BusinessDetails />
            <div className="flex justify-between gap-4">
              <Button variant="outline" onClick={() => setStep(1)} size="lg">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleNextStep2}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-8 transition-colors"
              >
                <IconMenu
                  text="Next"
                  iconLocation="right"
                  icon={<ChevronRight className="ml-2 h-5 w-5" />}
                />
              </Button>
            </div>
          </div>
        </Form>
      )}

      {currentStep === 3 && (
        <Form {...formStep3}>
          <div className="space-y-6">
            <Step3Funding />
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                size="lg"
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleReview}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-8 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                <IconMenu
                  text="Review Application"
                  icon={<ChevronRight className="mr-2 h-5 w-5" />}
                  iconLocation="right"
                />
              </Button>
            </div>
          </div>
        </Form>
      )}

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Your Information</DialogTitle>
            <DialogDescription>
              Please verify the details you entered before submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-3">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div>
                  <span className="text-gray-500 font-medium">First Name:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {authData.firstName}
                  </span>
                </div>
                {authData.middleName && (
                  <div>
                    <span className="text-gray-500 font-medium">
                      Middle Name:
                    </span>{" "}
                    <span className="font-medium text-gray-900">
                      {authData.middleName}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 font-medium">Last Name:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {authData.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Email:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {authData.email}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Phone:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {authData.phoneNumber}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-3">
                Business Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div>
                  <span className="text-gray-500 font-medium">
                    Monthly Deposit:
                  </span>{" "}
                  <span className="font-medium text-gray-900">
                    ${businessDetailsData.monthlyDeposit?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">
                    Time in Business:
                  </span>{" "}
                  <span className="font-medium text-gray-900">
                    {businessDetailsData.timeInBusiness}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">
                    Est. Credit Score:
                  </span>{" "}
                  <span className="font-medium text-gray-900">
                    {businessDetailsData.creditScore}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-3">
                Funding Needs
              </h3>
              <div className="grid grid-cols-1 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-500 font-medium">
                    Type of Funding:
                  </span>{" "}
                  <span className="font-medium text-gray-900">
                    {fundingData.interestedProduct}
                  </span>
                </div>
                {fundingData.businessName && (
                  <div>
                    <span className="text-gray-500 font-medium">
                      Business Name:
                    </span>{" "}
                    <span className="font-medium text-gray-900">
                      {fundingData.businessName}
                    </span>
                  </div>
                )}
                {fundingData.fundingProducts &&
                  fundingData.fundingProducts.length > 0 && (
                    <div>
                      <span className="text-gray-500 font-medium">
                        Interested Products:
                      </span>
                      <ul className="list-disc list-inside ml-5 mt-1 font-medium text-gray-900">
                        {fundingData.fundingProducts.map((p: any) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmitting}
            >
              Back to Edit
            </Button>
            <Button
              onClick={executeFinalSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              <IconMenu
                text={isSubmitting ? "Creating account..." : "Confirm & Join!"}
                icon={
                  isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )
                }
              />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
