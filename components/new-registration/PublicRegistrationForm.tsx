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
import { RegistrationPurposeStep } from "./RegistrationPurposeStep";
import { ProgressBar } from "@/components/registration/ProgressBar";
import {
  authSchema,
  businessDetailsSchema,
  documentUploadSchema,
  FundingType,
  RegistrationPurpose,
} from "@/schema/new-registration";
import { toast } from "sonner";
import IconMenu from "@/components/icon-menu";
import {
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Loader2,
  CheckCircle,
  CircleCheckBigIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { updateExistingLeadPurpose } from "@/lib/registration-lead";
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
    registrationPurpose,
    setRegistrationPurpose,
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

  const isFinancialEducation =
    registrationPurpose === RegistrationPurpose.FinancialEducation;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "success"
  >("idle");
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = isFinancialEducation
    ? [
        "Saving personal information...",
        "Securing identity details...",
        "Uploading driver's license...",
        "Finalizing registration...",
      ]
    : [
        "Saving personal information...",
        "Securing business details...",
        "Uploading documents...",
        "Finalizing registration...",
      ];

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
    defaultValues: {
      ...businessDetailsData,
      businessPhoneNumber: businessDetailsData.businessPhoneNumber || "",
    },
  });

  const formStep3 = useForm<any>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      ...documentUploadData,
      registrationPurpose: registrationPurpose ?? undefined,
      fundingType: isFinancialEducation
        ? undefined
        : businessDetailsData.fundingType,
      employmentType: isFinancialEducation
        ? undefined
        : businessDetailsData.employmentType,
    },
  });

  // Hydrate the shared auth form once. Purpose changes must not reset or
  // rewrite authData because these fields belong to both registration paths.
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
    }
  }, [isHydrated, formStep1]);

  // Purpose-specific forms are reset whenever the selected path changes.
  useEffect(() => {
    if (isHydrated) {
      formStep2.reset(businessDetailsData);
      formStep3.reset({
        ...documentUploadData,
        registrationPurpose: registrationPurpose ?? undefined,
        fundingType: isFinancialEducation
          ? undefined
          : businessDetailsData.fundingType,
        employmentType: isFinancialEducation
          ? undefined
          : businessDetailsData.employmentType,
      });
    }
  }, [isHydrated, registrationPurpose, formStep2, formStep3]);

  // Sync business details to formStep3 when moving to step 3
  useEffect(() => {
    if (currentStep === 3) {
      formStep3.setValue(
        "registrationPurpose",
        registrationPurpose ?? undefined,
      );
      formStep3.setValue(
        "fundingType",
        isFinancialEducation ? undefined : businessDetailsData.fundingType,
      );
      formStep3.setValue(
        "employmentType",
        isFinancialEducation ? undefined : businessDetailsData.employmentType,
      );
    }
  }, [
    currentStep,
    registrationPurpose,
    isFinancialEducation,
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
      const businessData = { ...value };
      if (businessData.fundingType === FundingType.Personal) {
        businessData.timeInBusiness = null;
        businessData.businessName = null;
        businessData.businessPhoneNumber = null;
        businessData.ein = null;
        businessData.businessIndustry = null;
        businessData.businessCreditScore = null;
        businessData.businessStreetAddress = null;
        businessData.businessCityAddress = null;
        businessData.businessStateAddress = null;
        businessData.businessPostalAddress = null;
      } else if (businessData.fundingType === FundingType.Business) {
        businessData.creditScore = null;
        businessData.employmentType = null;
        businessData.statedAnnualIncomeCorrected = null;
        businessData.additionalMonthlyIncome = null;
        businessData.additionalIncomeSource = null;
      } else if (businessData.fundingType === FundingType.Both) {
        businessData.businessCreditScore = null;
      }
      updateBusinessDetailsData(businessData);
    });
    return () => subscription.unsubscribe();
  }, [formStep2.watch, updateBusinessDetailsData]);

  useEffect(() => {
    const subscription = formStep3.watch((value) => {
      updateDocumentUploadData(value);
    });
    return () => subscription.unsubscribe();
  }, [formStep3.watch, updateDocumentUploadData]);

  const progress = isFinancialEducation
    ? currentStep === 1
      ? 50
      : 100
    : Math.floor(Math.min((currentStep / 3) * 100, 100));

  const handleRegistrationPurposeSelect = async (
    purpose: RegistrationPurpose,
  ) => {
    setRegistrationPurpose(purpose);

    // A lead created by the other registration path belongs to the same
    // person. Reuse it and update only the path; shared auth data remains
    // untouched in both the store and the existing lead.
    if (!leadId) return;

    try {
      const response = await updateExistingLeadPurpose(leadId, purpose);

      if (!response.ok) {
        toast.error("Could not update registration type. Please try again.");
      }
    } catch {
      toast.error("Could not update registration type. Please try again.");
    }
  };

  const handleNextStep1 = async () => {
    const isValid = await formStep1.trigger();
    if (isValid) {
      const authData = formStep1.getValues();
      updateAuthData(authData);

      try {
        const encodedData = btoa(
          JSON.stringify({ ...authData, registrationPurpose }),
        );

        if (leadId) {
          // If we already have a leadId, just update the existing lead
          const response = await fetch("/api/leads", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadId, data: encodedData }),
          });

          if (response.ok) {
            setStep(isFinancialEducation ? 3 : 2);
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
            setStep(isFinancialEducation ? 3 : 2);
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
        businessData.businessPhoneNumber = null;
        businessData.ein = null;
        businessData.businessIndustry = null;
        businessData.businessCreditScore = null;
        businessData.businessStreetAddress = null;
        businessData.businessCityAddress = null;
        businessData.businessStateAddress = null;
        businessData.businessPostalAddress = null;
      } else if (businessData.fundingType === FundingType.Business) {
        businessData.creditScore = null;
        businessData.employmentType = null;
        businessData.statedAnnualIncomeCorrected = null;
        businessData.additionalMonthlyIncome = null;
        businessData.additionalIncomeSource = null;
      } else if (businessData.fundingType === FundingType.Both) {
        businessData.businessCreditScore = null;
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
        toast.error("Missing Documents", {
          description: (
            <ul className="list-disc pl-4">
              {uniqueMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ),
        });
      } else {
        toast.error("Please provide all required documents");
      }
    }
  };

  const executeFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmissionStatus("submitting");
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4000);

    try {
      // Use the store's data which contains both form inputs AND any OCR updates
      const storeState = useNewRegistrationStore.getState();

      // We must merge formStep1 with the store, because OCR might have added address fields
      // but formStep1.getValues() won't have them if they weren't rendered.
      // Alternatively, the store already has the latest from watch() + OCR.
      const latestAuthData = {
        ...formStep1.getValues(),
        ...storeState.authData,
      };
      const latestBusinessData = { ...formStep2.getValues() };

      if (latestBusinessData.fundingType === FundingType.Personal) {
        latestBusinessData.timeInBusiness = null;
        latestBusinessData.businessName = null;
        latestBusinessData.businessPhoneNumber = null;
        latestBusinessData.ein = null;
        latestBusinessData.businessIndustry = null;
        latestBusinessData.businessCreditScore = null;
        latestBusinessData.businessStreetAddress = null;
        latestBusinessData.businessCityAddress = null;
        latestBusinessData.businessStateAddress = null;
        latestBusinessData.businessPostalAddress = null;
      } else if (latestBusinessData.fundingType === FundingType.Business) {
        latestBusinessData.creditScore = null;
        latestBusinessData.employmentType = null;
      } else if (latestBusinessData.fundingType === FundingType.Both) {
        latestBusinessData.businessCreditScore = null;
      }

      const latestDocumentData = formStep3.getValues();
      const submittedDocumentData = isFinancialEducation
        ? {
            registrationPurpose,
            driverLicense: latestDocumentData.driverLicense,
          }
        : latestDocumentData;

      updateAuthData(latestAuthData);
      updateBusinessDetailsData(latestBusinessData);
      updateDocumentUploadData(latestDocumentData);

      const finalData = {
        leadId,
        registrationPurpose,
        auth: latestAuthData,
        business: isFinancialEducation ? undefined : latestBusinessData,
        documents: submittedDocumentData,
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

      clearInterval(interval);
      setSubmissionStatus("success");
    } catch (error: any) {
      clearInterval(interval);
      console.error(error);
      setIsSubmitting(false);
      setSubmissionStatus("idle");
      toast.error(error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-[95vw] sm:max-w-[900px] lg:max-w-[1000px] mx-auto">
      {!registrationPurpose && (
        <RegistrationPurposeStep onSelect={handleRegistrationPurposeSelect} />
      )}

      {registrationPurpose && (
        <>
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
                <div className="flex justify-between gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRegistrationPurpose(null)}
                    size="lg"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
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

          {!isFinancialEducation && currentStep === 2 && (
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
                    onClick={() => setStep(isFinancialEducation ? 1 : 2)}
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
                      text={
                        isFinancialEducation
                          ? "Review Registration"
                          : "Review Application"
                      }
                      icon={<ChevronRight className="mr-2 h-5 w-5" />}
                      iconLocation="right"
                    />
                  </Button>
                </div>
              </form>
            </Form>
          )}

          <Dialog
            open={showConfirmModal}
            onOpenChange={(open) => {
              if (submissionStatus === "idle") {
                setShowConfirmModal(open);
              }
            }}
          >
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              {submissionStatus === "idle" && (
                <>
                  <DialogHeader>
                    <DialogTitle>Review Your Information</DialogTitle>
                    <DialogDescription>
                      Please verify the details you entered before submitting.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm">
                      <span className="font-medium text-blue-900">
                        Registration purpose:
                      </span>{" "}
                      <span className="text-blue-800">
                        {registrationPurpose}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg border-b pb-2 mb-3">
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                        <div>
                          <span className="text-gray-500 font-medium">
                            First Name:
                          </span>{" "}
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
                          <span className="text-gray-500 font-medium">
                            Last Name:
                          </span>{" "}
                          <span className="font-medium text-gray-900">
                            {authData.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">
                            SSN:
                          </span>{" "}
                          <span className="font-medium text-gray-900">
                            {authData.ssn}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">
                            Email:
                          </span>{" "}
                          <span className="font-medium text-gray-900">
                            {authData.email}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-medium">
                            Phone:
                          </span>{" "}
                          <span className="font-medium text-gray-900">
                            {authData.phoneNumber}
                          </span>
                        </div>
                        {authData.addressStreet && (
                          <div className="col-span-1 sm:col-span-2">
                            <span className="text-gray-500 font-medium">
                              Address:
                            </span>{" "}
                            <span className="font-medium text-gray-900 block">
                              {authData.addressStreet}
                              <br />
                              {authData.addressCity}, {authData.addressState}{" "}
                              {authData.addressPostal}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isFinancialEducation && (
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
                              $
                              {businessDetailsData.fundingAmount?.toLocaleString()}
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
                          {(businessDetailsData.fundingType ===
                            FundingType.Personal ||
                            businessDetailsData.fundingType ===
                              FundingType.Both) && (
                            <>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Est. Credit Score (Personal):
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
                          {(businessDetailsData.fundingType ===
                            FundingType.Business ||
                            businessDetailsData.fundingType ===
                              FundingType.Both) && (
                            <>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Est. Credit Score (Business):
                                </span>{" "}
                                <span className="font-medium text-gray-900">
                                  {businessDetailsData.businessCreditScore}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Business Name:
                                </span>{" "}
                                <span className="font-medium text-gray-900">
                                  {businessDetailsData.businessName}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Business Contact Number:
                                </span>{" "}
                                <span className="font-medium text-gray-900">
                                  {businessDetailsData.businessPhoneNumber}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium">
                                  EIN:
                                </span>{" "}
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
                              {businessDetailsData.businessStreetAddress && (
                                <div className="col-span-1 sm:col-span-2">
                                  <span className="text-gray-500 font-medium">
                                    Business Address:
                                  </span>{" "}
                                  <span className="font-medium text-gray-900 block">
                                    {businessDetailsData.businessStreetAddress}
                                    <br />
                                    {
                                      businessDetailsData.businessCityAddress
                                    },{" "}
                                    {businessDetailsData.businessStateAddress}{" "}
                                    {businessDetailsData.businessPostalAddress}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-lg border-b pb-2 mb-3">
                        Documents Provided
                      </h3>
                      <div className="grid grid-cols-1 gap-y-2 text-sm">
                        <div>
                          <span className="text-gray-500 font-medium">
                            {`Driver's License:`}
                          </span>{" "}
                          <span className="font-medium text-gray-900">
                            {documentUploadData.driverLicense?.uploaded
                              ? "Yes"
                              : "No"}
                          </span>
                        </div>
                        {(businessDetailsData.fundingType ===
                          FundingType.Personal ||
                          businessDetailsData.fundingType ===
                            FundingType.Both) && (
                          <>
                            {businessDetailsData.employmentType === "W2" && (
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Paystubs:
                                </span>{" "}
                                <span className="font-medium text-gray-900">
                                  {documentUploadData.personalDocs?.paystubs
                                    ?.uploaded
                                    ? "Yes"
                                    : "No"}
                                </span>
                              </div>
                            )}
                            {businessDetailsData.employmentType ===
                              "Self-employed" && (
                              <div>
                                <span className="text-gray-500 font-medium">
                                  Bank Statements (Personal):
                                </span>{" "}
                                <span className="font-medium text-gray-900">
                                  {documentUploadData.personalDocs
                                    ?.bankStatements?.uploaded
                                    ? "Yes"
                                    : "No"}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {(businessDetailsData.fundingType ===
                          FundingType.Business ||
                          businessDetailsData.fundingType ===
                            FundingType.Both) && (
                          <div>
                            <span className="text-gray-500 font-medium">
                              Bank Statements (Business):
                            </span>{" "}
                            <span className="font-medium text-gray-900">
                              {documentUploadData.businessDocs?.bankStatements
                                ?.uploaded
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
                        text={"Confirm & Join!"}
                        icon={<UserPlus className="mr-2 h-4 w-4" />}
                      />
                    </Button>
                  </DialogFooter>
                </>
              )}

              {submissionStatus === "submitting" && (
                <div className="flex flex-col items-center justify-center py-8 w-full mx-auto">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-6" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                    Processing Registration
                  </h3>
                  <p className="text-gray-500 text-sm text-center mb-8 animate-pulse min-h-[1.5rem] font-medium">
                    {loadingSteps[loadingStep]}
                  </p>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
                      style={{
                        width: `${Math.min(((loadingStep + 1) / loadingSteps.length) * 100, 95)}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    This may take a moment...
                  </p>
                </div>
              )}

              {submissionStatus === "success" && (
                <div className="flex flex-col items-center justify-center py-8 w-full mx-auto text-center">
                  <div className="bg-blue-100 rounded-full p-4 mb-4">
                    <CheckCircle className="h-16 w-16 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-blue-700 mb-4">
                    Thank You!
                  </h3>
                  <p className="text-gray-700 text-lg mb-8 max-w-md">
                    Your registration was successful. Please check your email
                    and verify your email address to continue.
                  </p>
                  <Button
                    onClick={() => {
                      setShowConfirmModal(false);
                      resetRegistration();
                      router.push("/");
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg w-full max-w-xs"
                  >
                    <IconMenu
                      text="OK"
                      icon={<CircleCheckBigIcon className="h-4 w-4" />}
                    />
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
