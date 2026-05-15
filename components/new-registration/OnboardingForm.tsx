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
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  FileText,
} from "lucide-react";
import { useAuth } from "@/provider/AuthContext";
import Spinner from "@/components/Spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OnboardingFormProps {
  onFinalSubmit: (data: any) => Promise<void>;
}

export function OnboardingForm({ onFinalSubmit }: OnboardingFormProps) {
  const { user, userData, loading: authLoading } = useAuth();

  const {
    currentStep,
    setStep,
    documentUploadData,
    updateDocumentUploadData,
    updateFundingData,
    updateBusinessDetailsData,
  } = useNewRegistrationStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // We read the stored registration data from the user document
  const fundingDetails = (userData as any)?.fundingDetails || null;
  const businessDetails = (userData as any)?.businessDetails || null;

  useEffect(() => {
    if (fundingDetails) {
      updateFundingData(fundingDetails);
    }
    if (businessDetails) {
      updateBusinessDetailsData(businessDetails);
    }
  }, [
    fundingDetails,
    businessDetails,
    updateFundingData,
    updateBusinessDetailsData,
  ]);

  const formStep4 = useForm<any>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      ...documentUploadData,
      fundingType: fundingDetails?.fundingType || "",
      interestedProduct: fundingDetails?.interestedProduct || "",
    },
  });

  // Ensure step is 1 or 4 for this form (we treat 4 as step 2 of onboarding here)
  const displayStep = currentStep === 1 ? 1 : 2;

  // Sync loaded funding data into the form
  useEffect(() => {
    if (fundingDetails) {
      const currentVal = formStep4.getValues();
      if (
        currentVal.interestedProduct !== fundingDetails.interestedProduct ||
        currentVal.fundingType !== fundingDetails.fundingType
      ) {
        formStep4.setValue(
          "interestedProduct",
          fundingDetails.interestedProduct,
        );
        formStep4.setValue("fundingType", fundingDetails.fundingType);
      }
    }
  }, [fundingDetails, formStep4]);

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

    if (isBusiness || isPersonal) {
      if (!docs.ssn || docs.ssn.length < 9) return false;
      if (
        !docs.addressStreet ||
        !docs.addressCity ||
        !docs.addressState ||
        !docs.addressPostal
      )
        return false;
      if (!docs.driverLicense?.uploaded || (docs.driverLicense?.count || 0) < 1)
        return false;
    }

    if (isBusiness) {
      if (!docs.businessDocs?.ein) return false;
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
          !docs.personalDocs?.paystubs?.uploaded ||
          (docs.personalDocs?.paystubs?.count || 0) < 2
        )
          return false;
      } else if (empType === "Self Employed") {
        if (
          !docs.personalDocs?.bankStatements?.uploaded ||
          (docs.personalDocs?.bankStatements?.count || 0) < 3
        )
          return false;
      } else {
        return false;
      }
    }
    return true;
  };

  const isReadyToSubmit = checkDocumentsUploaded();

  const handleReview = async () => {
    const docs = formStep4.getValues();
    const interestedProduct = docs.interestedProduct;
    const isBusiness =
      interestedProduct === "Business Funding" ||
      interestedProduct === "Personal & Business Funding";
    const isPersonal =
      interestedProduct === "Personal Funding" ||
      interestedProduct === "Personal & Business Funding";

    if (isBusiness || isPersonal) {
      if (
        !docs.driverLicense?.uploaded ||
        (docs.driverLicense?.count || 0) < 1
      ) {
        toast.warning("Driver's license is required", {
          description: "Please upload your Driver's License to proceed.",
        });
        return;
      }
    }

    if (isBusiness) {
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
          !docs.personalDocs?.paystubs?.uploaded ||
          (docs.personalDocs?.paystubs?.count || 0) < 2
        ) {
          toast.warning("Paystubs are required", {
            description: "Please upload at least 2 recent Paystubs to proceed.",
          });
          return;
        }
      } else if (empType === "Self Employed") {
        if (
          !docs.personalDocs?.bankStatements?.uploaded ||
          (docs.personalDocs?.bankStatements?.count || 0) < 3
        ) {
          toast.warning("Bank statements are required", {
            description:
              "Please upload at least 3 months of Bank Statements to proceed.",
          });
          return;
        }
      }
    }

    const isValid = await formStep4.trigger();
    if (isValid) {
      updateDocumentUploadData(formStep4.getValues());
      setShowConfirmModal(true);
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

  const executeFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const store = useNewRegistrationStore.getState();
      const finalData = {
        documents: store.documentUploadData,
        funding: {
          fundingType: formStep4.getValues("fundingType"),
          interestedProduct: formStep4.getValues("interestedProduct"),
        },
      };
      await onFinalSubmit(finalData);
      setShowConfirmModal(false);
      // The parent handles the success toast and redirect
    } catch (error) {
      toast.error("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <Spinner displayText="Loading your application..." />;
  }

  const currentDocs = formStep4.getValues();

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
                onClick={handleReview}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-8 transition-colors disabled:opacity-50"
                disabled={isSubmitting || !isReadyToSubmit}
              >
                <IconMenu
                  text="Review Application"
                  iconLocation="right"
                  icon={<ChevronRight className="ml-2 h-5 w-5" />}
                />
              </Button>
            </div>
          </div>
        </Form>
      )}

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Your Documents</DialogTitle>
            <DialogDescription>
              Please verify the information you entered before submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-3">
                Identity & Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-gray-500 font-medium">SSN:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {currentDocs.ssn}
                  </span>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-gray-500 font-medium">Address:</span>{" "}
                  <span className="font-medium text-gray-900 block">
                    {currentDocs.addressStreet}{" "}
                    {currentDocs.houseNumber && `#${currentDocs.houseNumber}`}
                    <br />
                    {currentDocs.addressCity}, {currentDocs.addressState}{" "}
                    {currentDocs.addressPostal}
                  </span>
                </div>
              </div>
            </div>

            {(currentDocs.interestedProduct === "Business Funding" ||
              currentDocs.interestedProduct ===
                "Personal & Business Funding") && (
              <div>
                <h3 className="font-semibold text-lg border-b pb-2 mb-3">
                  Business Requirements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-gray-500 font-medium">EIN:</span>{" "}
                    <span className="font-medium text-gray-900">
                      {currentDocs.businessDocs?.ein}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {(currentDocs.interestedProduct === "Personal Funding" ||
              currentDocs.interestedProduct ===
                "Personal & Business Funding") && (
              <div>
                <h3 className="font-semibold text-lg border-b pb-2 mb-3">
                  Personal Requirements
                </h3>
                <div className="grid grid-cols-1 gap-y-2 gap-x-4 text-sm">
                  <div>
                    <span className="text-gray-500 font-medium">
                      Employment Status:
                    </span>{" "}
                    <span className="font-medium text-gray-900">
                      {currentDocs.employmentType}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-3">
                Uploaded Documents
              </h3>
              <ul className="space-y-2 text-sm">
                {currentDocs.driverLicense?.count > 0 && (
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>
                      Driver's License ({currentDocs.driverLicense.count})
                    </span>
                  </li>
                )}
                {currentDocs.businessDocs?.bankStatements?.count > 0 && (
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>
                      Business Bank Statements (
                      {currentDocs.businessDocs.bankStatements.count})
                    </span>
                  </li>
                )}
                {currentDocs.personalDocs?.bankStatements?.count > 0 && (
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>
                      Personal Bank Statements (
                      {currentDocs.personalDocs.bankStatements.count})
                    </span>
                  </li>
                )}
                {currentDocs.personalDocs?.paystubs?.count > 0 && (
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>
                      Paystubs ({currentDocs.personalDocs.paystubs.count})
                    </span>
                  </li>
                )}
              </ul>
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
                text={isSubmitting ? "Submitting..." : "Confirm & Submit"}
                icon={
                  isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
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
