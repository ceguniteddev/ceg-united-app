"use client";

import { useEffect, useState } from "react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useNewRegistrationStore } from "@/store/new-registration-store";
import { Step1Auth } from "./Step1Auth";
import { Step2BusinessDetails } from "./Step2BusinessDetails";
import { Step3Funding } from "./Step3FundingDocuments";
import { ProgressBar } from "@/components/registration/ProgressBar";
import {
  authSchema,
  businessDetailsSchema,
  documentUploadSchema,
  FundingType,
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
    documentUploadData,
    updateDocumentUploadData,
    resetRegistration,
    leadId,
    setLeadId,
  } = useNewRegistrationStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(useNewRegistrationStore.persist.hasHydrated());
    const unsub = useNewRegistrationStore.persist.onFinishHydration(() =>
      setIsHydrated(true),
    );
    return () => unsub();
  }, []);

  // If they were on onboarding steps (4+), reset to 1
  useEffect(() => {
    if (isHydrated && currentStep > 3) {
      setStep(1);
    }
  }, [currentStep, setStep, isHydrated]);

  const formStep1 = useForm<any>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      firstName: authData.firstName || "",
      middleName: authData.middleName || "",
      lastName: authData.lastName || "",
      ssn: authData.ssn || "",
      phoneNumber: authData.phoneNumber || "",
      email: authData.email || "",
      password: authData.password || "",
      consentConfirmTerms: authData.consentConfirmTerms || undefined,
      consentConfirmPrivacy: authData.consentConfirmPrivacy || undefined,
    },
  });

  const formStep2 = useForm<any>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: businessDetailsData,
  });

  const formStep3 = useForm<any>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      ...documentUploadData,
      fundingType: businessDetailsData.fundingType,
      employmentType: businessDetailsData.employmentType,
    },
  });

  // Hydrate forms once mounted
  useEffect(() => {
    if (isHydrated) {
      formStep1.reset({
        firstName: authData.firstName || "",
        middleName: authData.middleName || "",
        lastName: authData.lastName || "",
        ssn: authData.ssn || "",
        phoneNumber: authData.phoneNumber || "",
        email: authData.email || "",
        password: authData.password || "",
        consentConfirmTerms: authData.consentConfirmTerms || undefined,
        consentConfirmPrivacy: authData.consentConfirmPrivacy || undefined,
      });
      formStep2.reset(businessDetailsData);
      formStep3.reset({
        ...documentUploadData,
        fundingType: businessDetailsData.fundingType,
        employmentType: businessDetailsData.employmentType,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  // Sync business details to formStep3 when moving to step 3
  useEffect(() => {
    if (currentStep === 3) {
      formStep3.setValue("fundingType", businessDetailsData.fundingType);
      formStep3.setValue("employmentType", businessDetailsData.employmentType);
    }
  }, [
    currentStep,
    businessDetailsData.fundingType,
    businessDetailsData.employmentType,
    formStep3,
  ]);

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
      updateDocumentUploadData(value);
    });
    return () => subscription.unsubscribe();
  }, [formStep3.watch, updateDocumentUploadData]);

  const progress = Math.floor(Math.min(((currentStep - 1) / 3) * 100, 100));

  const handleNextStep1 = async () => {
    const isValid = await formStep1.trigger();
    if (isValid) {
      const authData = formStep1.getValues();
      updateAuthData(authData);

      try {
        const encodedData = btoa(JSON.stringify(authData));

        if (leadId) {
          // If we already have a leadId, just update the existing lead
          const response = await fetch("/api/leads", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadId, data: encodedData }),
          });

          if (response.ok) {
            setStep(2);
          } else {
            toast.error("Could not save progress. Please try again.");
          }
        } else {
          // If no leadId exists, create a new lead
          const response = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ authData: encodedData }),
          });

          if (response.ok) {
            const { leadId: newLeadId } = await response.json();
            setLeadId(newLeadId);
            setStep(2);
          } else {
            toast.error("Could not save progress. Please try again.");
          }
        }
      } catch (error) {
        toast.error("An error occurred. Please try again.");
      }
    } else {
      toast.error("Please fill all required fields correctly");
    }
  };

  const handleNextStep2 = async () => {
    const isValid = await formStep2.trigger();
    if (isValid) {
      const businessData = formStep2.getValues();

      // Conditional cleanup logic for business details
      if (businessData.fundingType === FundingType.Personal) {
        businessData.timeInBusiness = null;
        businessData.businessName = null;
        businessData.ein = null;
        businessData.businessIndustry = null;
      } else if (businessData.fundingType === FundingType.Business) {
        businessData.creditScore = null;
        businessData.employmentType = null;
      }

      updateBusinessDetailsData(businessData);

      try {
        const encodedData = btoa(JSON.stringify(businessData));
        const response = await fetch("/api/leads", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, data: encodedData }),
        });

        if (response.ok) {
          setStep(3);
        } else {
          toast.error("Could not save progress. Please try again.");
        }
      } catch (error) {
        toast.error("An error occurred. Please try again.");
      }
    } else {
      toast.error("Please fill all required fields");
    }
  };

  const handleReview = async () => {
    const isValid = await formStep3.trigger();
    if (isValid) {
      const documentsData = formStep3.getValues();
      updateDocumentUploadData(documentsData);
      setShowConfirmModal(true);
    } else {
      const errors = formStep3.formState.errors;
      const errorMessages: string[] = [];

      const collectErrors = (errObj: any) => {
        if (!errObj) return;
        if (errObj.message && typeof errObj.message === "string") {
          errorMessages.push(errObj.message);
        } else if (typeof errObj === "object") {
          for (const key in errObj) {
            collectErrors(errObj[key]);
          }
        }
      };

      collectErrors(errors);

      if (errorMessages.length > 0) {
        // Deduplicate messages in case of multiple issues
        const uniqueMessages = Array.from(new Set(errorMessages));
        toast.error(`Missing Documents: ${uniqueMessages.join(" | ")}`);
      } else {
        toast.error("Please provide all required documents");
      }
    }
  };

  const executeFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Ensure we have the absolute latest data from all forms
      const latestAuthData = formStep1.getValues();
      const latestBusinessData = formStep2.getValues();
      const latestDocumentData = formStep3.getValues();

      updateAuthData(latestAuthData);
      updateBusinessDetailsData(latestBusinessData);
      updateDocumentUploadData(latestDocumentData);

      // 1. Upload documents to Firebase Storage and update lead
      toast.info("Uploading documents...", { duration: 3000 });
      const uploadResponse = await fetch("/api/leads/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          documents: latestDocumentData,
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload documents");
      }

      const { documents: uploadedDocuments } = await uploadResponse.json();

      // 2. Finalize registration
      toast.info("Finalizing registration...", { duration: 3000 });
      const finalData = {
        leadId,
        auth: latestAuthData,
        business: latestBusinessData,
        documents: uploadedDocuments,
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNextStep1();
            }}
            className="space-y-6"
          >
            <Step1Auth />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={
                  !formStep1.watch("consentConfirmTerms") ||
                  !formStep1.watch("consentConfirmPrivacy")
                }
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-6 transition-colors disabled:opacity-50"
              >
                <IconMenu
                  text="Next"
                  iconLocation="right"
                  icon={<ChevronRight className="ml-2 h-5 w-5" />}
                />
              </Button>
            </div>
          </form>
        </Form>
      )}

      {currentStep === 2 && (
        <Form {...formStep2}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNextStep2();
            }}
            className="space-y-6"
          >
            <Step2BusinessDetails />
            <div className="flex justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                size="lg"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                type="submit"
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
          </form>
        </Form>
      )}

      {currentStep === 3 && (
        <Form {...formStep3}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleReview();
            }}
            className="space-y-6"
          >
            <Step3Funding />
            <div className="flex justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                size="lg"
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                type="submit"
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
          </form>
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
                  <span className="text-gray-500 font-medium">SSN:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {authData.ssn}
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
                Funding Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div>
                  <span className="text-gray-500 font-medium">
                    Funding Amount:
                  </span>{" "}
                  <span className="font-medium text-gray-900">
                    ${businessDetailsData.fundingAmount?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">
                    Funding Type:
                  </span>{" "}
                  <span className="font-medium text-gray-900">
                    {businessDetailsData.fundingType}
                  </span>
                </div>
                {(businessDetailsData.fundingType === FundingType.Personal ||
                  businessDetailsData.fundingType === FundingType.Both) && (
                  <>
                    <div>
                      <span className="text-gray-500 font-medium">
                        Est. Credit Score:
                      </span>{" "}
                      <span className="font-medium text-gray-900">
                        {businessDetailsData.creditScore}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">
                        Employment Type:
                      </span>{" "}
                      <span className="font-medium text-gray-900">
                        {businessDetailsData.employmentType}
                      </span>
                    </div>
                  </>
                )}
                {(businessDetailsData.fundingType === FundingType.Business ||
                  businessDetailsData.fundingType === FundingType.Both) && (
                  <>
                    <div>
                      <span className="text-gray-500 font-medium">
                        Business Name:
                      </span>{" "}
                      <span className="font-medium text-gray-900">
                        {businessDetailsData.businessName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">EIN:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {businessDetailsData.ein}
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
                        Business Industry:
                      </span>{" "}
                      <span className="font-medium text-gray-900">
                        {businessDetailsData.businessIndustry}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg border-b pb-2 mb-3">
                Documents Provided
              </h3>
              <div className="grid grid-cols-1 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-500 font-medium">
                    Driver's License:
                  </span>{" "}
                  <span className="font-medium text-gray-900">
                    {documentUploadData.driverLicense?.uploaded ? "Yes" : "No"}
                  </span>
                </div>
                {(businessDetailsData.fundingType === FundingType.Personal ||
                  businessDetailsData.fundingType === FundingType.Both) && (
                  <>
                    {businessDetailsData.employmentType === "W2" && (
                      <div>
                        <span className="text-gray-500 font-medium">
                          Paystubs:
                        </span>{" "}
                        <span className="font-medium text-gray-900">
                          {documentUploadData.personalDocs?.paystubs?.uploaded
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                    )}
                    {businessDetailsData.employmentType === "Self-employed" && (
                      <div>
                        <span className="text-gray-500 font-medium">
                          Bank Statements (Personal):
                        </span>{" "}
                        <span className="font-medium text-gray-900">
                          {documentUploadData.personalDocs?.bankStatements
                            ?.uploaded
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {(businessDetailsData.fundingType === FundingType.Business ||
                  businessDetailsData.fundingType === FundingType.Both) && (
                  <div>
                    <span className="text-gray-500 font-medium">
                      Bank Statements (Business):
                    </span>{" "}
                    <span className="font-medium text-gray-900">
                      {documentUploadData.businessDocs?.bankStatements?.uploaded
                        ? "Yes"
                        : "No"}
                    </span>
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
