"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { SelectedLenderCard } from "@/components/funding/v2/SelectedLenderCard";
import {
  MethodSelectionCard,
  ApplicationMethod,
} from "@/components/funding/v2/MethodSelectionCard";
import { InstructionSteps } from "@/components/funding/v2/InstructionSteps";
import { DynamicOddsCard } from "@/components/funding/v2/DynamicOddsCard";
import { RedirectStateCard } from "@/components/funding/v2/RedirectStateCard";
import { useClientMappedFundingDetailsQuery } from "@/hooks/admin/funding-application/fund-mapping";
import { useApprovedMappedFundsMutation } from "@/hooks/admin/funding-application/fund-mapping";
import { useAuth } from "@/provider/AuthContext";
import Spinner from "@/components/Spinner";
import type { ApprovedBankFormData } from "@/schema/bank-products";

// Instruction steps for online application
const onlineSteps = [
  {
    title: "Visit Bank Website",
    description:
      "You're being directed to the bank's secure website to complete your application.",
  },
  {
    title: "Pre-Filled Application",
    description:
      "Your information will be automatically pre-filled into the bank application form for convenience.",
  },
  {
    title: "Review & Submit",
    description:
      "Review your details, provide any additional required information, and submit your application online.",
  },
];

// Instruction steps for specialist assistance
const specialistSteps = [
  {
    title: "Request Submitted",
    description:
      "Your request has been submitted. A specialist from the bank will be reaching out to you shortly.",
  },
  {
    title: "Banker Outreach",
    description:
      "A dedicated banker will contact you within 1-2 business days to discuss your funding options.",
  },
  {
    title: "Prepare Your Documents",
    description:
      "Have your business documents, bank statements, and tax returns ready for a faster process.",
  },
  {
    title: "Complete Guided Application",
    description:
      "The banker will walk you through the application, answer questions, and help you submit.",
  },
];

export default function FundingApplyPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const fundMappingApprovedId = params.fundMappingApprovedId as string;

  const [showRedirect, setShowRedirect] = useState(false);

  const { mappedFund = [], isLoading } = useClientMappedFundingDetailsQuery({
    userId: user?.uid,
  });

  const { applyApprovedMappedFund, isApplying } =
    useApprovedMappedFundsMutation();

  // Find the specific lender from the mapped funds
  const lender = mappedFund.find(
    (fund: ApprovedBankFormData) =>
      fund.fundMappingApprovedId === fundMappingApprovedId,
  );

  // Check if bank supports online applications
  const supportsOnlineApplication =
    lender?.products?.some((product: any) =>
      product.applicationMethod?.includes("Online"),
    ) ?? false;

  // Set default method based on bank support
  const [method, setMethod] = useState<ApplicationMethod>(
    supportsOnlineApplication ? "online" : "specialist",
  );

  const isOnline = method === "online";
  const stepsTitle = isOnline
    ? "Your Steps to Apply Online"
    : "Your Steps with a Specialist";
  const steps = isOnline ? onlineSteps : specialistSteps;

  // Update method when lender changes
  useEffect(() => {
    if (lender && !supportsOnlineApplication && method === "online") {
      setMethod("specialist");
    }
  }, [lender, supportsOnlineApplication, method]);

  const handleApplyNow = async () => {
    if (!lender) return;

    // Update application status with selected method
    await applyApprovedMappedFund({
      fundMappingApprovedId: lender.fundMappingApprovedId,
      referenceNumber: lender.referenceNumber,
      applicationMethod: method, // Pass the selected method
    });

    if (isOnline) {
      // Show redirect modal for online applications
      setShowRedirect(true);
    } else {
      // For specialist, just navigate back with success message
      router.push("/client/my-funding");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!lender) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Lender Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The funding application you&apos;re looking for doesn&apos;t exist
            or has been removed.
          </p>
          <Button onClick={() => router.push("/client/my-funding")}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Funding
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/client/my-funding")}
        className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium mb-4 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to applications
      </button>

      {/* Page heading */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-xl font-bold text-gray-900">
          You&apos;ve Started Your Application
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Next, choose how you&apos;d like to apply for funding from{" "}
          {lender.bankName}.
        </p>
      </div>

      {/* TOP ROW: Lender card + Method selection cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 animate-fade-in-up stagger-1">
        {/* Lender summary */}
        <SelectedLenderCard
          lender={lender}
          applicationId={lender.referenceNumber}
        />

        <RadioGroup
          value={method}
          onValueChange={(value) => setMethod(value as ApplicationMethod)}
          className={`lg:col-span-2 grid grid-cols-1 gap-4 ${supportsOnlineApplication ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}
        >
          {/* Talk to a Specialist - Always shown */}
          <MethodSelectionCard method="specialist" selected={method} />

          {/* Apply Online - Only shown if bank supports it */}
          {supportsOnlineApplication && (
            <MethodSelectionCard method="online" selected={method} />
          )}
        </RadioGroup>
      </div>

      {/* BOTTOM: Steps + Odds card */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left: Instruction steps */}
        <InstructionSteps title={stepsTitle} steps={steps} />

        {/* Right: Dynamic odds card */}
        <DynamicOddsCard
          lender={lender}
          method={method}
          onApplyNow={handleApplyNow}
          isLoading={isApplying}
        />
      </div>

      {/* Floating assistant button */}
      <button className="fixed bottom-6 right-6 size-12 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 hover:shadow-xl transition-all flex items-center justify-center z-30">
        <Bot className="size-5" />
      </button>

      {/* Redirect overlay */}
      {showRedirect && (
        <RedirectStateCard
          lenderName={lender.bankName}
          applicationUrl={lender.applicationUrl}
          onBack={() => setShowRedirect(false)}
        />
      )}
    </div>
  );
}
