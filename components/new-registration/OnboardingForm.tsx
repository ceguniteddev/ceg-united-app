"use client";

import { useEffect, useState } from "react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useNewRegistrationStore } from "@/store/new-registration-store";
import { Step1Welcome } from "./Step1Welcome";
import { Step4DocumentUpload } from "./Step4DocumentUpload";
import { ProgressBar } from "@/components/registration/ProgressBar";
import { documentUploadSchema } from "@/schema/new-registration";
import { toast } from "sonner";
import IconMenu from "@/components/icon-menu";
import { ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/provider/AuthContext";
import { useGetClientApplyFunding } from "@/hooks/apply-funding";
import Spinner from "@/components/Spinner";

interface OnboardingFormProps {
  onFinalSubmit: (data: any) => Promise<void>;
}

export function OnboardingForm({ onFinalSubmit }: OnboardingFormProps) {
  const { user } = useAuth();
  const { appliedFunding, isLoading: isFundingLoading } =
    useGetClientApplyFunding(user?.uid || "");

  const { currentStep, setStep, documentUploadData, updateDocumentUploadData } =
    useNewRegistrationStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fundingApp =
    appliedFunding && appliedFunding.length > 0 ? appliedFunding[0] : null;

  const formStep4 = useForm<any>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      ...documentUploadData,
      fundingType: fundingApp?.fundingType || "",
      interestedProduct: fundingApp?.interestedProduct || "",
    },
  });

  // Ensure step is 1 or 4 for this form (we treat 4 as step 2 of onboarding here)
  const displayStep = currentStep === 1 ? 1 : 2;

  // Sync loaded funding data into the form if not present
  useEffect(() => {
    if (fundingApp) {
      const currentVal = formStep4.getValues();
      if (!currentVal.interestedProduct) {
        formStep4.setValue("interestedProduct", fundingApp.interestedProduct);
        formStep4.setValue("fundingType", fundingApp.fundingType);
      }
    }
  }, [fundingApp, formStep4]);

  useEffect(() => {
    const subscription = formStep4.watch((value) => {
      updateDocumentUploadData(value);
    });
    return () => subscription.unsubscribe();
  }, [formStep4.watch, updateDocumentUploadData]);

  const progress = displayStep === 1 ? 50 : 100;

  const handleNextStep1 = () => {
    setStep(4);
  };

  const checkDocumentsUploaded = () => {
    const docs = formStep4.watch();
    const interestedProduct = docs.interestedProduct;
    const isBusiness =
      interestedProduct === "Business Funding" ||
      interestedProduct === "Personal & Business Funding";
    const isPersonal =
      interestedProduct === "Personal Funding" ||
      interestedProduct === "Personal & Business Funding";

    if (isBusiness) {
      if (
        !docs.businessDocs?.driverLicense?.uploaded ||
        (docs.businessDocs?.driverLicense?.count || 0) < 1
      )
        return false;
      if (
        !docs.businessDocs?.bankStatements?.uploaded ||
        (docs.businessDocs?.bankStatements?.count || 0) < 4
      )
        return false;
    }

    if (isPersonal) {
      const empType = docs.employmentType;
      if (empType === "W2 Employed") {
        if (
          !docs.personalW2Docs?.driverLicense?.uploaded ||
          (docs.personalW2Docs?.driverLicense?.count || 0) < 1
        )
          return false;
        if (
          !docs.personalW2Docs?.paystubs?.uploaded ||
          (docs.personalW2Docs?.paystubs?.count || 0) < 2
        )
          return false;
      } else if (empType === "Self Employed") {
        if (
          !docs.personalSelfEmployedDocs?.bankStatements?.uploaded ||
          (docs.personalSelfEmployedDocs?.bankStatements?.count || 0) < 3
        )
          return false;
        if (
          !docs.personalSelfEmployedDocs?.driverLicense?.uploaded ||
          (docs.personalSelfEmployedDocs?.driverLicense?.count || 0) < 1
        )
          return false;
      } else {
        return false;
      }
    }
    return true;
  };

  const isReadyToSubmit = checkDocumentsUploaded();

  const handleFinalSubmit = async () => {
    const docs = formStep4.getValues();
    const interestedProduct = docs.interestedProduct;
    const isBusiness =
      interestedProduct === "Business Funding" ||
      interestedProduct === "Personal & Business Funding";
    const isPersonal =
      interestedProduct === "Personal Funding" ||
      interestedProduct === "Personal & Business Funding";

    if (isBusiness) {
      if (
        !docs.businessDocs?.driverLicense?.uploaded ||
        (docs.businessDocs?.driverLicense?.count || 0) < 1
      ) {
        toast.warning("Driver's license is required", {
          description: "Please upload your Driver's License to proceed.",
        });
        return;
      }
      if (
        !docs.businessDocs?.bankStatements?.uploaded ||
        (docs.businessDocs?.bankStatements?.count || 0) < 4
      ) {
        toast.warning("Bank statements are required", {
          description:
            "Please upload at least 4 months of Bank Statements to proceed.",
        });
        return;
      }
    }

    if (isPersonal) {
      const empType = docs.employmentType;
      if (empType === "W2 Employed") {
        if (
          !docs.personalW2Docs?.driverLicense?.uploaded ||
          (docs.personalW2Docs?.driverLicense?.count || 0) < 1
        ) {
          toast.warning("Driver's license is required", {
            description: "Please upload your Driver's License to proceed.",
          });
          return;
        }
        if (
          !docs.personalW2Docs?.paystubs?.uploaded ||
          (docs.personalW2Docs?.paystubs?.count || 0) < 2
        ) {
          toast.warning("Paystubs are required", {
            description: "Please upload at least 2 recent Paystubs to proceed.",
          });
          return;
        }
      } else if (empType === "Self Employed") {
        if (
          !docs.personalSelfEmployedDocs?.bankStatements?.uploaded ||
          (docs.personalSelfEmployedDocs?.bankStatements?.count || 0) < 3
        ) {
          toast.warning("Bank statements are required", {
            description:
              "Please upload at least 3 months of Bank Statements to proceed.",
          });
          return;
        }
        if (
          !docs.personalSelfEmployedDocs?.driverLicense?.uploaded ||
          (docs.personalSelfEmployedDocs?.driverLicense?.count || 0) < 1
        ) {
          toast.warning("Driver's license is required", {
            description: "Please upload your Driver's License to proceed.",
          });
          return;
        }
      }
    }

    const isValid = await formStep4.trigger();
    if (isValid) {
      setIsSubmitting(true);
      try {
        updateDocumentUploadData(formStep4.getValues());
        const store = useNewRegistrationStore.getState();
        // Here we just submit documents and perhaps auth/funding if needed, but mostly documents
        const finalData = {
          documents: store.documentUploadData,
          funding: {
            fundingType: formStep4.getValues("fundingType"),
            interestedProduct: formStep4.getValues("interestedProduct"),
          },
        };
        await onFinalSubmit(finalData);
        toast.success("Application submitted successfully!");
      } catch (error) {
        toast.error("Submission failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const getFirstErrorMsg = (obj: any): string | null => {
        if (!obj || typeof obj !== "object") return null;
        if (obj.message && typeof obj.message === "string") return obj.message;
        for (const key in obj) {
          const msg = getFirstErrorMsg(obj[key]);
          if (msg) return msg;
        }
        return null;
      };

      const firstError = getFirstErrorMsg(formStep4.formState.errors);
      toast.error(
        firstError || "Please provide all required documents and information",
      );
    }
  };

  if (isFundingLoading) {
    return <Spinner displayText="Loading your application..." />;
  }

  return (
    <div className="w-full">
      <ProgressBar progress={progress} className="mb-6" />

      {displayStep === 1 && (
        <div className="space-y-6">
          <Step1Welcome />
          <div className="flex justify-end">
            <Button
              onClick={handleNextStep1}
              size="lg"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-6 transition-colors"
            >
              <IconMenu
                text="Continue to Application"
                iconLocation="right"
                icon={<ChevronRight className="ml-2 h-5 w-5" />}
              />
            </Button>
          </div>
        </div>
      )}

      {displayStep === 2 && (
        <Form {...formStep4}>
          <div className="space-y-6">
            <Step4DocumentUpload />
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                size="lg"
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleFinalSubmit}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-8 transition-colors disabled:opacity-50"
                disabled={isSubmitting || !isReadyToSubmit}
              >
                <IconMenu
                  text={isSubmitting ? "Submitting..." : "Submit Application"}
                  icon={<Save className="mr-2 h-5 w-5" />}
                />
              </Button>
            </div>
          </div>
        </Form>
      )}
    </div>
  );
}
