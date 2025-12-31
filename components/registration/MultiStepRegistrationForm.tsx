"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
  ChevronLeft,
  ChevronRight,
  CircleX,
  Loader2Icon,
  SaveIcon,
} from "lucide-react";
import { Step1PersonalInfo } from "./Step1PersonalInfo";
import { Step2FundingInfo } from "./Step2FundingInfo";
import { ProgressBar } from "./ProgressBar";
import {
  ClientApplicationForm,
  clientApplicationSchema,
} from "@/schema/client-application";
import { ApplyFunding, applyFundingSchema } from "@/schema/apply-funding";
import { toast } from "sonner";
import IconMenu from "../icon-menu";
import { useRegistrationStore } from "@/store/registration-store";
import { useAuth } from "@/provider/AuthContext";

// Combined type for both steps
type MultiStepFormData = ClientApplicationForm & Partial<ApplyFunding>;

interface MultiStepRegistrationFormProps {
  onSubmit: (
    step1Data: ClientApplicationForm,
    step2Data: ApplyFunding
  ) => Promise<void>;
  isSubmitting?: boolean;
  onClose?: () => void;
}

export function MultiStepRegistrationForm({
  onSubmit,
  isSubmitting = false,
  onClose,
}: MultiStepRegistrationFormProps) {
  const { user } = useAuth();
  const {
    updateStep1,
    updateStep2,
    updateCurrentStep,
    clearRegistration,
    getRegistration,
  } = useRegistrationStore();

  const savedDraft = user ? getRegistration(user.uid) : undefined;

  const [currentStep, setCurrentStep] = useState(savedDraft?.currentStep || 1);
  const [progress, setProgress] = useState(() => {
    if (!savedDraft) return 0;
    if (savedDraft.currentStep === 2 && savedDraft.step1) return 50;
    if (savedDraft.currentStep === 1 && savedDraft.step1) return 0;
    return 0;
  });
  const [step1Data, setStep1Data] = useState<ClientApplicationForm | null>(
    savedDraft?.step1 && Object.keys(savedDraft.step1).length > 0
      ? (savedDraft.step1 as ClientApplicationForm)
      : null
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const defaultValuesStep1 = useMemo(() => {
    if (savedDraft?.step1 && Object.keys(savedDraft.step1).length > 0) {
      const restored = { ...savedDraft.step1 };
      if (typeof restored.birthdate === "string") {
        restored.birthdate = new Date(restored.birthdate);
      }
      if (typeof restored.registrationDate === "string") {
        restored.registrationDate = new Date(restored.registrationDate);
      }
      return restored;
    }
    return {
      middleName: "",
    };
  }, [savedDraft?.step1]);

  const defaultValuesStep2 = useMemo(() => {
    if (savedDraft?.step2 && Object.keys(savedDraft.step2).length > 0) {
      const restored = { ...savedDraft.step2 };
      if (typeof restored.appliedDate === "string") {
        restored.appliedDate = new Date(restored.appliedDate);
      }
      return restored;
    }
    return {
      appliedDate: new Date(),
      status: "New" as const,
      fundingType: "Personal" as const,
      employmentStatus: "",
      personalTaxesStatus: "",
      businessTaxesStatus: "",
      userId: "",
      interestedProduct: "",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressPostal: "",
    };
  }, [savedDraft?.step2]);

  // Form for Step 1
  const form1 = useForm<ClientApplicationForm>({
    resolver: zodResolver(clientApplicationSchema),
    mode: "onChange",
    defaultValues: defaultValuesStep1,
  });

  // Form for Step 2
  const form2 = useForm<ApplyFunding>({
    resolver: zodResolver(applyFundingSchema),
    mode: "onChange",
    defaultValues: defaultValuesStep2,
  });

  const { isDirty: isDirty1, dirtyFields: dirtyFields1 } = form1.formState;
  const { isDirty: isDirty2, dirtyFields: dirtyFields2 } = form2.formState;

  // Reset forms when defaultValues change
  useEffect(() => {
    if (
      savedDraft?.step1 &&
      Object.keys(savedDraft.step1).length > 0 &&
      !isDirty1
    ) {
      const restored = { ...savedDraft.step1 };
      if (restored.birthdate && typeof restored.birthdate === "string") {
        restored.birthdate = new Date(restored.birthdate);
      }
      if (
        restored.registrationDate &&
        typeof restored.registrationDate === "string"
      ) {
        restored.registrationDate = new Date(restored.registrationDate);
      }
      form1.reset(restored);
      // Update step1Data state with restored data
      setStep1Data(restored as ClientApplicationForm);
    }
  }, [savedDraft?.step1, form1, isDirty1]);

  useEffect(() => {
    if (
      savedDraft?.step2 &&
      Object.keys(savedDraft.step2).length > 0 &&
      !isDirty2
    ) {
      const restored = { ...savedDraft.step2 };
      if (restored.appliedDate && typeof restored.appliedDate === "string") {
        restored.appliedDate = new Date(restored.appliedDate);
      }
      form2.reset(restored);
    }
  }, [savedDraft?.step2, form2, isDirty2]);

  // Auto-save Step 1 with debounce
  const lastSavedStep1Ref = useRef<string>("");

  useEffect(() => {
    if (
      user &&
      isDirty1 &&
      Object.keys(dirtyFields1).length > 0 &&
      !isSubmitting
    ) {
      const timeoutId = setTimeout(() => {
        const formValues = form1.getValues();
        const formValuesStr = JSON.stringify(formValues);

        if (formValuesStr !== lastSavedStep1Ref.current) {
          const hasValues = Object.values(formValues).some(
            (val) => val !== "" && val !== undefined && val !== null
          );
          if (hasValues) {
            updateStep1(user.uid, formValues);
            lastSavedStep1Ref.current = formValuesStr;
          }
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    form1.formState,
    user,
    isDirty1,
    dirtyFields1,
    isSubmitting,
    updateStep1,
    form1,
  ]);

  // Auto-save Step 2 with debounce
  const lastSavedStep2Ref = useRef<string>("");

  useEffect(() => {
    if (
      user &&
      isDirty2 &&
      Object.keys(dirtyFields2).length > 0 &&
      !isSubmitting
    ) {
      const timeoutId = setTimeout(() => {
        const formValues = form2.getValues();
        const formValuesStr = JSON.stringify(formValues);

        if (formValuesStr !== lastSavedStep2Ref.current) {
          const hasValues = Object.values(formValues).some(
            (val) => val !== "" && val !== undefined && val !== null
          );
          if (hasValues) {
            updateStep2(user.uid, formValues);
            lastSavedStep2Ref.current = formValuesStr;
          }
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    form2.formState,
    user,
    isDirty2,
    dirtyFields2,
    isSubmitting,
    updateStep2,
    form2,
  ]);

  // Save current step
  useEffect(() => {
    if (user) {
      updateCurrentStep(user.uid, currentStep);
    }
  }, [currentStep, user, updateCurrentStep]);

  const handleNext = async () => {
    // Validate Step 1
    const isValid = await form1.trigger();

    if (!isValid) {
      toast.error("Please fill in all required fields correctly.");
      setProgress(0);
      return;
    }

    // If validation passes, move to step 2
    const values = form1.getValues();
    // console.log("Step 1 Values:", values);
    setStep1Data(values);
    setProgress(50);
    setCurrentStep(2);

    // Pre-fill step 2 address fields from step 1
    // form2.setValue("addressStreet", values.addressStreet);
    // form2.setValue("addressCity", values.addressCity);
    // form2.setValue("addressState", values.addressState);
    // form2.setValue("addressPostal", values.addressPostal);
    // form2.setValue("houseNumber", values.houseNumber || "");

    // Save to store
    if (user) {
      updateStep1(user.uid, values);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setProgress(step1Data ? 50 : 0);
  };

  const handleApplyClick = async () => {
    if (!step1Data) {
      toast.error("Please complete Step 1 first");
      return;
    }

    // Validate Step 2
    const isValid = await form2.trigger();

    if (!isValid) {
      // Debug logging
      console.info("Validation Result:", isValid);
      console.info("Form State isValid:", form2.formState.isValid);
      console.info("Form State Errors:", form2.formState.errors);
      console.info("Form Values:", form2.getValues());
      // Wait a tick for errors to update
      setTimeout(() => {
        console.info(
          "Step 2 Validation Errors (after tick):",
          form2.formState.errors
        );
      }, 0);

      toast.error(
        "Please fill in all required fields correctly in the funding application."
      );
      setProgress(50);
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleSubmit = async () => {
    if (!step1Data) {
      return;
    }

    const step2Values = form2.getValues();
    // console.log("Step 2 Values:", step2Values);
    setProgress(100);

    try {
      await onSubmit(step1Data, step2Values);
      // Close dialog and clear saved draft after successful submission
      setShowConfirmDialog(false);
      if (user) {
        clearRegistration(user.uid);
      }
      form1.reset();
      form2.reset();
    } catch (error) {
      console.error("Submit Error:", error);
      setProgress(50);
      setShowConfirmDialog(false); // Close dialog on error too
      // Data remains in Zustand and forms, so user can retry
      throw error;
    }
  };

  return (
    <div className="w-full max-w-full mx-auto px-4">
      <ProgressBar progress={progress} />

      <div>
        {currentStep === 1 && (
          <Form {...form1}>
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset disabled={isSubmitting}>
                <div className="space-y-6">
                  <Step1PersonalInfo />
                </div>
              </fieldset>
            </form>
          </Form>
        )}

        {currentStep === 2 && (
          <Form {...form2}>
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset disabled={isSubmitting}>
                <div className="space-y-6">
                  <Step2FundingInfo userId={step1Data?.email || ""} />
                </div>
              </fieldset>
            </form>
          </Form>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? onClose : handleBack}
            disabled={isSubmitting}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            {currentStep === 1 ? (
              <IconMenu text="Close" icon={<CircleX className="h-4 w-4" />} />
            ) : (
              <IconMenu
                text="Back"
                icon={<ChevronLeft className="h-4 w-4" />}
              />
            )}
          </Button>

          {currentStep < 2 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white order-1 sm:order-2"
            >
              <IconMenu
                text="Next"
                iconLocation="right"
                icon={<ChevronRight className="h-4 w-4" />}
              />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleApplyClick}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white order-1 sm:order-2"
            >
              {isSubmitting ? (
                <IconMenu
                  text="Submitting..."
                  icon={<Loader2Icon className="h-4 w-4 animate-spin" />}
                />
              ) : (
                <IconMenu
                  text="Apply"
                  icon={<SaveIcon className="h-4 w-4" />}
                />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Application Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this funding application? Please
              review all information carefully before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-500 hover:bg-green-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Confirm & Submit"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
