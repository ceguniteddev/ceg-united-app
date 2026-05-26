"use client";

import { Bot, Loader2, AlertCircle } from "lucide-react";
import { ProgressStepper } from "@/components/income-funding/ProgressStepper";
import { PreApprovalView } from "@/components/income-funding/PreApprovalView";
import { DocumentCollectionView } from "@/components/income-funding/DocumentCollectionView";
import { SubmittedView } from "@/components/income-funding/SubmittedView";
import { OffersView } from "@/components/income-funding/OffersView";
import { AcceptanceView } from "@/components/income-funding/AcceptanceView";
import { CompleteView } from "@/components/income-funding/CompleteView";
import FundingPathways from "@/components/income-funding/FundingPathways";
import { useIncomeFundingState } from "@/hooks/useIncomeFundingState";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function IncomeFunding() {
  const [selectedReference, setSelectedReference] = useState<string>("");
  const [showPathways, setShowPathways] = useState(false);
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>("income_based");

  const {
    deal,
    realDeal,
    incomeFundingApps,
    isLoadingApplications,
    setStatus,
    uploadDocument,
    submitForUnderwriting,
    selectOffer,
    acceptOffer,
    skipOffer,
    reset,
    isSubmitting,
    isCalculating,
    calculateIncomePreApproval,
  } = useIncomeFundingState(selectedReference);

  const referenceOptions = useMemo(() => {
    if (!incomeFundingApps || incomeFundingApps.length === 0) return [];

    // Get unique reference numbers with their applied dates
    const uniqueReferences = incomeFundingApps
      .filter((app) => app.referenceNumber) // Only include items with reference numbers
      .reduce(
        (acc, app) => {
          if (!acc.find((item) => item.value === app.referenceNumber)) {
            acc.push({
              value: app.referenceNumber!,
              label: `${format(new Date(app.appliedDate), "MMM d, yyyy")} - ${app.interestedProduct}`,
              date: new Date(app.appliedDate),
            });
          }
          return acc;
        },
        [] as Array<{ value: string; label: string; date: Date }>,
      );

    // Sort by date descending (newest first)
    return uniqueReferences.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [incomeFundingApps]);

  // Update selected reference when reference options change
  useEffect(() => {
    if (referenceOptions.length > 0 && !selectedReference) {
      setSelectedReference(referenceOptions[0].value);
    }
  }, [referenceOptions, selectedReference]);

  const selectedOffer =
    deal.offers.find((o) => o.id === deal.selectedOfferId) || deal.offers[0];

  let hasMissingComputation =
    realDeal && !(realDeal as any).businessIncomeComputation;
  const renderView = () => {
    if (
      hasMissingComputation &&
      deal.status !== "prequalified" &&
      deal.status !== "collecting-documents"
    ) {
      return (
        <div className="bg-white rounded-2xl border border-red-100 shadow-card p-10 text-center flex flex-col items-center justify-center animate-fade-in-up">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Action Required: Calculate Business Income
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            We noticed that your business income computation is missing. Please
            calculate your pre-approved business income to proceed with your
            application.
          </p>
          <button
            onClick={calculateIncomePreApproval}
            disabled={isCalculating}
            className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCalculating
              ? "Calculating..."
              : "Calculate Pre-Approved Business Income"}
          </button>
        </div>
      );
    }

    switch (deal.status) {
      case "prequalified":
        if (showPathways) {
          return (
            <FundingPathways
              realDeal={realDeal}
              onContinue={(pathway) => {
                setSelectedPathwayId(pathway.id);
                setStatus("collecting-documents");
                setShowPathways(false);
              }}
              onBack={() => setShowPathways(false)}
            />
          );
        }
        return (
          <PreApprovalView
            deal={deal}
            realDeal={realDeal}
            onContinue={() => setShowPathways(true)}
          />
        );
      case "collecting-documents":
        return (
          <DocumentCollectionView
            deal={deal}
            realDeal={realDeal}
            onUpload={uploadDocument}
            onSubmit={submitForUnderwriting}
            onBack={() => {
              setStatus("prequalified");
              setShowPathways(true);
            }}
            isSubmitting={isSubmitting}
            selectedPathwayId={selectedPathwayId}
          />
        );
      case "under-review":
        return <SubmittedView deal={deal} />;
      case "offers-ready":
        return (
          <OffersView deal={deal} onSelect={selectOffer} onSkip={skipOffer} />
        );
      case "accepting":
        return (
          <AcceptanceView
            offer={selectedOffer}
            onBack={() => setStatus("offers-ready")}
            onAccept={(signature) =>
              acceptOffer(
                signature,
                selectedOffer.fundingAmount,
                selectedOffer.percentageFee ?? 15,
              )
            }
            isSubmitting={isSubmitting}
          />
        );
      case "complete":
        return (
          <CompleteView deal={deal} offer={selectedOffer} onReturn={reset} />
        );
    }
  };

  if (isLoadingApplications) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-10">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-4" />
        <p className="text-sm text-gray-500 font-medium">
          Loading your funding details...
        </p>
      </div>
    );
  }

  if (!realDeal) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-6 sm:p-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            You do not currently have an active application for "Business Income
            Based Funding". Please apply for this funding product to access this
            page.
          </p>
          <Link
            href="/client/home"
            className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition"
          >
            Go to Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          {/* Page heading */}
          <div className="mb-5 animate-fade-in-up flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                Income-Based Funding
              </div>
              <h1 className="text-xl font-bold text-gray-900 mt-0.5">
                My Funding
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Cash-flow funding from $5K–$500K, no hard credit pull required.
              </p>
            </div>

            {/* Reference Number Filter */}
            {referenceOptions.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 shrink-0">
                <label
                  htmlFor="reference-filter"
                  className="text-sm font-medium text-gray-900 whitespace-nowrap"
                >
                  Filter by Application:
                </label>
                <Select
                  value={selectedReference}
                  onValueChange={setSelectedReference}
                >
                  <SelectTrigger
                    className="w-full sm:w-[300px] border-gray-200 focus:border-brand-600 focus:ring-brand-600 bg-white"
                    id="reference-filter"
                  >
                    <SelectValue placeholder="Select application date" />
                  </SelectTrigger>
                  <SelectContent>
                    {referenceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Progress Stepper */}
          <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-card p-4 sm:p-5 animate-fade-in-up stagger-1">
            <ProgressStepper status={deal.status} />
          </div>

          {/* Active view */}
          <div key={deal.status} className="animate-fade-in">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}
