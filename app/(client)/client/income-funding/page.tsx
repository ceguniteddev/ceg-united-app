"use client";

import { Bot } from "lucide-react";
import { ProgressStepper } from "@/components/income-funding/ProgressStepper";
import { DemoToolbar } from "@/components/income-funding/DemoToolbar";
import { PreApprovalView } from "@/components/income-funding/PreApprovalView";
import { DocumentCollectionView } from "@/components/income-funding/DocumentCollectionView";
import { SubmittedView } from "@/components/income-funding/SubmittedView";
import { OffersView } from "@/components/income-funding/OffersView";
import { AcceptanceView } from "@/components/income-funding/AcceptanceView";
import { CompleteView } from "@/components/income-funding/CompleteView";
import { useIncomeFundingState } from "@/hooks/useIncomeFundingState";
import { mockUser } from "@/lib/income-funding-mock";

export default function IncomeFunding() {
  const {
    deal,
    setStatus,
    uploadDocument,
    submitForUnderwriting,
    selectOffer,
    acceptOffer,
    skipOffer,
    reset,
    isSubmitting,
  } = useIncomeFundingState();

  const selectedOffer =
    deal.offers.find((o) => o.id === deal.selectedOfferId) || deal.offers[0];

  const renderView = () => {
    switch (deal.status) {
      case "prequalified":
        return (
          <PreApprovalView
            deal={deal}
            onContinue={() => setStatus("collecting-documents")}
          />
        );
      case "collecting-documents":
        return (
          <DocumentCollectionView
            deal={deal}
            onUpload={uploadDocument}
            onSubmit={submitForUnderwriting}
            isSubmitting={isSubmitting}
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

  return (
    <div className="flex flex-col h-full w-full">
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          {/* Page heading */}
          <div className="mb-5 animate-fade-in-up">
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
