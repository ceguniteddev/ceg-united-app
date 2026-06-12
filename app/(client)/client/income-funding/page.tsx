"use client";

import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
// import { ProgressStepper } from "@/components/income-funding/ProgressStepper";
import { PreApprovalView } from "@/components/income-funding/PreApprovalView";
import { DocumentCollectionView } from "@/components/income-funding/DocumentCollectionView";
import { SubmittedView } from "@/components/income-funding/SubmittedView";
import { OffersView } from "@/components/income-funding/OffersView";
import { AcceptanceView } from "@/components/income-funding/AcceptanceView";
import { CompleteView } from "@/components/income-funding/CompleteView";
import FundingPathways from "@/components/income-funding/FundingPathways";
import { useIncomeFundingState } from "@/hooks/useIncomeFundingState";
import { FundingBankProducts } from "../my-funding/_funding/ApplyFundingList";
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

import { useSearchParams } from "next/navigation";
import { ComputationActionRequired } from "@/components/income-funding/ComputationActionRequired";
import { Suspense } from "react";

export default function IncomeFundingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-full w-full p-10">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-4" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      }
    >
      <IncomeFundingContent />
    </Suspense>
  );
}

export function IncomeFundingContent() {
  const searchParams = useSearchParams();
  const initialPathwayId = searchParams.get("pathwayId") || "income_based";

  const [selectedReference, setSelectedReference] = useState<string>("");
  const [showPathways, setShowPathways] = useState(
    searchParams.get("showPathways") === "true",
  );
  const [selectedPathwayId, setSelectedPathwayId] =
    useState<string>(initialPathwayId);

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
  } = useIncomeFundingState(selectedReference, selectedPathwayId);

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

  // If returning from applying, automatically set status to show offers
  useEffect(() => {
    const fromApply = searchParams.get("fromApply") === "true";
    if (fromApply) {
      setStatus("offers-ready");
    }
  }, [searchParams, setStatus]);

  const selectedOffer =
    deal.offers.find((o) => o.id === deal.selectedOfferId) || deal.offers[0];

  const requestedAmount =
    Number((realDeal as any)?.personalAmountFunding || 0) +
    Number((realDeal as any)?.businessAmountFunding || 0);

  const hasMissingComputation =
    realDeal &&
    !(realDeal as any).businessIncomeComputation &&
    requestedAmount === 0;

  const renderView = () => {
    if (
      hasMissingComputation &&
      deal.status !== "prequalified" &&
      deal.status !== "collecting-documents"
    ) {
      return (
        <ComputationActionRequired
          realDeal={realDeal as any}
          isCalculating={isCalculating}
          onCalculate={calculateIncomePreApproval}
        />
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
                const appliedPathways =
                  (realDeal as any)?.appliedPathways || [];
                const appliedPathway = appliedPathways.find(
                  (p: any) => p.pathwayId === pathway.id,
                );

                if (appliedPathway) {
                  let nextStatus = "under-review";
                  const pathwayStatus = appliedPathway.status;
                  const globalStatus = realDeal?.status;

                  const relevantStatus = pathwayStatus || globalStatus;

                  if (
                    relevantStatus === "Pre-Approved" ||
                    relevantStatus === "Offer Accepted"
                  ) {
                    nextStatus = "offers-ready";
                  } else if (relevantStatus === "Approved") {
                    nextStatus = "complete";
                  } else {
                    nextStatus = "under-review";
                  }

                  setStatus(nextStatus as any);
                } else {
                  setStatus("collecting-documents");
                }
                setShowPathways(false);
              }}
              selectedPathwayId={selectedPathwayId}
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
            onSubmit={() => submitForUnderwriting(selectedPathwayId)}
            isSubmitting={isSubmitting}
            selectedPathwayId={selectedPathwayId}
          />
        );
      case "under-review":
        return (
          <SubmittedView
            deal={deal}
            realDeal={realDeal}
            selectedPathwayId={selectedPathwayId}
            onRetry={() => setStatus("collecting-documents")}
          />
        );
      case "offers-ready":
        if (selectedPathwayId !== "income_based") {
          return (
            <div className="space-y-6 animate-fade-in-up">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Available Offers
                </h2>
                <p className="text-sm text-gray-500">
                  Review and select from your approved funding products.
                </p>
              </div>
              <section className="flex w-full flex-col gap-6">
                <FundingBankProducts
                  selectedReference={selectedReference}
                  selectedPathwayId={selectedPathwayId}
                />
              </section>
            </div>
          );
        }
        return (
          <OffersView
            deal={deal}
            realDeal={realDeal}
            selectedPathwayId={selectedPathwayId}
            onSelect={selectOffer}
            onSkip={skipOffer}
          />
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

  if (!realDeal && !isLoadingApplications) {
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
            {`You do not currently have an active application for "Business Income
            Based Funding". Please apply for this funding product to access this
            page.`}
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
    <div className="flex flex-col w-full">
      <main className="flex-1 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          {/* Page heading */}
          <div className="mb-5 animate-fade-in-up flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {/* <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                Income-Based Funding
              </div> */}
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
          {/* <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-card p-4 sm:p-5 animate-fade-in-up stagger-1">
            <ProgressStepper status={deal.status} />
          </div> */}

          {/* Back button container - conditionally rendered */}
          {(deal.status === "collecting-documents" ||
            deal.status === "under-review" ||
            (deal.status === "offers-ready" &&
              selectedPathwayId !== "income_based")) && (
            <div className="mb-4 animate-fade-in-up">
              <button
                onClick={() => {
                  setStatus("prequalified");
                  setShowPathways(true);
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to pathways
              </button>
            </div>
          )}

          {deal.status === "prequalified" && showPathways && (
            <div className="mb-4 animate-fade-in-up">
              <button
                onClick={() => setShowPathways(false)}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to pre-approval
              </button>
            </div>
          )}

          {/* Active view */}
          <div key={deal.status} className="animate-fade-in">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}
