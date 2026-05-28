"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { SelectedLenderCard } from "@/components/funding/v2/SelectedLenderCard";
import {
  MethodSelectionCard,
  ApplicationMethod,
} from "@/components/funding/v2/MethodSelectionCard";
import { InstructionSteps } from "@/components/funding/v2/InstructionSteps";
import { DynamicOddsCard } from "@/components/funding/v2/DynamicOddsCard";
import { useClientMappedFundingDetailsQuery } from "@/hooks/admin/funding-application/fund-mapping";
import { useApprovedMappedFundsMutation } from "@/hooks/admin/funding-application/fund-mapping";
import { useAuth } from "@/provider/AuthContext";
import Spinner from "@/components/Spinner";
import type { ApprovedBankFormData } from "@/schema/bank-products";

// Instruction steps for online application
const onlineSteps = [
  {
    title: "Application Data Preparation",
    description:
      "We securely package your application data instead of submitting sensitive data directly to the bank.",
  },
  {
    title: "Check Email & WhatsApp",
    description:
      "You will receive your application data via email and WhatsApp messages for your records.",
  },
  {
    title: "Guided Online Application",
    description:
      "A funding specialist will provide assistance to help you complete your online application securely.",
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

  const [isSubmitted, setIsSubmitted] = useState(false);

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

    setIsSubmitted(true);
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
            The funding application you're looking for doesn't exist or has been
            removed.
          </p>
          <Button onClick={() => router.push("/client/income-funding")}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Funding
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-lg p-8 sm:p-12 text-center animate-fade-in-up max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="size-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Application Registered Successfully!
          </h1>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Your application for funding with{" "}
            <span className="font-semibold text-gray-900">
              {lender.bankName}
            </span>{" "}
            has been securely recorded in our system. A team member will reach
            out to schedule the appointment with the banker.
          </p>

          {/* <div className="bg-blue-50/50 rounded-xl p-6 sm:p-8 max-w-2xl mx-auto border border-blue-100 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-5 text-lg border-b border-blue-100 pb-3">
              Next Steps
            </h3>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="flex-shrink-0 mt-0.5 bg-blue-100 p-2.5 rounded-lg text-blue-700 h-fit">
                  <Mail className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-base">
                    Check Your Email
                  </p>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                    Please check your inbox periodically for updates. We've sent
                    your complete application data to your registered email
                    address for your records.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 mt-0.5 bg-green-100 p-2.5 rounded-lg text-green-700 h-fit">
                  <MessageSquare className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-base">
                    Watch for a WhatsApp Message
                  </p>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                    A team member will reach out via WhatsApp shortly to
                    schedule the appointment with the banker and provide further
                    assistance.
                  </p>
                </div>
              </li>
            </ul>
          </div> */}

          <Button
            onClick={() => {
              window.location.href = "/client/income-funding";
            }}
            size="lg"
            className="bg-brand-600 hover:bg-brand-700 text-white px-10 py-6 text-base shadow-md hover:shadow-lg transition-all"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/client/income-funding")}
        className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium mb-4 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to applications
      </button>

      {/* Page heading */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-xl font-bold text-gray-900">
          You've Started Your Application
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Next, choose how you'd like to apply for funding from{" "}
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
    </div>
  );
}
