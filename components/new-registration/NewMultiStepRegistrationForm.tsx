"use client";

import { useEffect, useState } from "react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useNewRegistrationStore } from "@/store/new-registration-store";
import { Step1Welcome } from "./Step1Welcome";
import { Step2BusinessDetails } from "./Step2BusinessDetails";
import { Step3Funding } from "./Step3Funding";
import { Step4DocumentUpload } from "./Step4DocumentUpload";
import { ProgressBar } from "@/components/registration/ProgressBar";
import {
  businessDetailsSchema,
  fundingPageSchema,
  documentUploadSchema,
} from "@/schema/new-registration";
import { toast } from "sonner";
import IconMenu from "@/components/icon-menu";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

interface NewMultiStepRegistrationFormProps {
  onFinalSubmit: (data: any) => Promise<void>;
}

export function NewMultiStepRegistrationForm({
  onFinalSubmit,
}: NewMultiStepRegistrationFormProps) {
  const {
    currentStep,
    setStep,
    businessDetailsData,
    updateBusinessDetailsData,
    fundingData,
    updateFundingData,
    documentUploadData,
    updateDocumentUploadData,
  } = useNewRegistrationStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // We use separate forms for validation at each step
  const formStep2 = useForm<any>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: businessDetailsData,
  });

  const formStep3 = useForm<any>({
    resolver: zodResolver(fundingPageSchema),
    defaultValues: fundingData,
  });

  const formStep4 = useForm<any>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      ...documentUploadData,
      fundingType: fundingData.fundingType, // Pass context for conditional validation
      interestedProduct: fundingData.interestedProduct,
    },
  });

  // Auto-save form 2, 3, and 4 to store on change so data isn't lost if the user leaves
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

  useEffect(() => {
    const subscription = formStep4.watch((value) => {
      updateDocumentUploadData(value);
    });
    return () => subscription.unsubscribe();
  }, [formStep4.watch, updateDocumentUploadData]);

  const progress = Math.floor(Math.min(((currentStep - 1) / 3) * 100, 100));

  const handleNextStep1 = () => {
    setStep(2);
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

  const handleNextStep3 = async () => {
    const isValid = await formStep3.trigger();
    if (isValid) {
      updateFundingData(formStep3.getValues());
      formStep4.setValue("fundingType", formStep3.getValues().fundingType);
      formStep4.setValue(
        "interestedProduct",
        formStep3.getValues().interestedProduct,
      );
      setStep(4);
    } else {
      toast.error("Please fill all required fields");
    }
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
      if (!docs.businessDocs?.driverLicense?.uploaded) return false;
      if (!docs.businessDocs?.bankStatements?.uploaded) return false;
    }

    if (isPersonal) {
      const empType = docs.employmentType;
      if (empType === "W2 Employed") {
        if (!docs.personalW2Docs?.driverLicense?.uploaded) return false;
        if (!docs.personalW2Docs?.paystubs?.uploaded) return false;
      } else if (empType === "Self Employed") {
        if (!docs.personalSelfEmployedDocs?.bankStatements?.uploaded)
          return false;
        if (!docs.personalSelfEmployedDocs?.driverLicense?.uploaded)
          return false;
      } else {
        return false;
      }
    }
    return true;
  };

  const isReadyToSubmit = checkDocumentsUploaded();

  const handleFinalSubmit = async () => {
    // Validate custom documents before triggering
    const docs = formStep4.getValues();
    const interestedProduct = docs.interestedProduct;
    const isBusiness =
      interestedProduct === "Business Funding" ||
      interestedProduct === "Personal & Business Funding";
    const isPersonal =
      interestedProduct === "Personal Funding" ||
      interestedProduct === "Personal & Business Funding";

    if (isBusiness) {
      if (!docs.businessDocs?.driverLicense?.uploaded) {
        toast.warning("Driver's license is required", {
          description: "Please upload your Driver's License to proceed.",
        });
        return;
      }
      if (!docs.businessDocs?.bankStatements?.uploaded) {
        toast.warning("Bank statements are required", {
          description:
            "Please upload your 4 months of Bank Statements to proceed.",
        });
        return;
      }
    }

    if (isPersonal) {
      const empType = docs.employmentType;
      if (empType === "W2 Employed") {
        if (!docs.personalW2Docs?.driverLicense?.uploaded) {
          toast.warning("Driver's license is required", {
            description: "Please upload your Driver's License to proceed.",
          });
          return;
        }
        if (!docs.personalW2Docs?.paystubs?.uploaded) {
          toast.warning("Paystubs are required", {
            description:
              "Please upload your Last 2 Recent Paystubs to proceed.",
          });
          return;
        }
      } else if (empType === "Self Employed") {
        if (!docs.personalSelfEmployedDocs?.bankStatements?.uploaded) {
          toast.warning("Bank statements are required", {
            description:
              "Please upload your 3 Months Bank Statements to proceed.",
          });
          return;
        }
        if (!docs.personalSelfEmployedDocs?.driverLicense?.uploaded) {
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
        // Compile all data
        const store = useNewRegistrationStore.getState();
        const finalData = {
          auth: store.authData,
          business: store.businessDetailsData,
          funding: store.fundingData,
          documents: store.documentUploadData,
        };
        await onFinalSubmit(finalData);
        toast.success("Application submitted successfully!");
      } catch (error) {
        toast.error("Submission failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Find the first error message to display
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

  return (
    <div className="w-full">
      <ProgressBar progress={progress} className="mb-6" />

      {currentStep === 1 && (
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
              <Button variant="outline" onClick={() => setStep(2)} size="lg">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleNextStep3}
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

      {currentStep === 4 && (
        <Form {...formStep4}>
          <div className="space-y-6">
            <Step4DocumentUpload />
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setStep(3)}
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
