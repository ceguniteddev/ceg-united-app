// FundingPathways.tsx
// CEG United — Funding Pathways Selection Page
//
// Shown immediately AFTER the "Congratulations, you've been pre-approved" screen.
// The client picks ONE pathway and clicks Continue, which routes them into the
// offers list for that specific funding type.
//
// Visual design matches the existing CEG application:
//   - Light premium fintech style, NO dark mode
//   - Brand-600 blue (#2563eb) primary
//   - Green "Pre-approval complete" pill chip (matches the previous screen)
//   - Inter for body, JetBrains Mono for monetary amounts
//
// Developer integration notes:
//   1. Drop into your existing React (Vite) + Tailwind project.
//   2. Replace the `onContinue` handler with your real router push to each
//      pathway's offers page. The route map at the bottom of this file is the
//      single source of truth for where each pathway sends the client.
//   3. Pre-approval amounts come from props (`pathways` array) so the back-end
//      can override per-client. Defaults match the user's spec: 300/200/300/400.
//   4. The selected pathway is also returned via `onSelect` so you can persist
//      it to Firestore / your API before the redirect.
//
// Author: Built for Julian (CEG United) — May 22, 2026

import React, { useState } from "react";

// -------------------------- Types --------------------------

export type PathwayId =
  | "income_based"
  | "credit_card_stacking"
  | "business_loc"
  | "personal_loan"
  | "personal_credit_card";

export interface FundingPathway {
  id: PathwayId;
  title: string;
  maxAmount: number;            // dollars, e.g. 300000
  tagline: string;              // one-line "what is it"
  bestFor: string;              // who it's best for
  fundingTime: string;          // "24–72 hours"
  pullType: string;             // "No hard pull" | "Soft pull first" | etc.
  badge?: string;               // optional "Most popular" / "Fastest" / etc.
  Icon: React.FC<{ className?: string }>;
  /** Route the user is sent to when they pick this pathway + click Continue. */
  route: string;
}

interface FundingPathwaysProps {
  /** Optional override list; otherwise the 4 defaults are used. */
  pathways?: FundingPathway[];
  /** The real deal object containing computation from backend. */
  realDeal?: any;
  /** Client's first name, used in the subhead. */
  clientFirstName?: string;
  /** Callback when user clicks Continue. Receives the selected pathway. */
  onContinue?: (pathway: FundingPathway) => void;
  /** Callback when user clicks Back. */
  onBack?: () => void;
  /** Fires every time the selection changes (useful for analytics). */
  onSelect?: (pathway: FundingPathway) => void;
  /** The currently selected pathway ID from parent state, if any */
  selectedPathwayId?: string;
}

// -------------------------- Icons (inline SVG, currentColor) --------------------------

const IconCashflow: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
       strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18M3 12h18M3 18h12" />
    <path d="M17 16l3 2-3 2" />
  </svg>
);
const IconCard: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
       strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
    <path d="M2.5 10h19M6 15.5h4" />
  </svg>
);
const IconBank: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
       strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 10l9-6 9 6" />
    <path d="M5 10v8M9 10v8M15 10v8M19 10v8" />
    <path d="M3 19h18" />
  </svg>
);
const IconUser: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
       strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="8" r="3.75" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);

// Sparkle icon for the "Pre-approval complete" chip
const IconSparkle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
       strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </svg>
);
const IconArrowRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
       strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);
const IconArrowLeft: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
       strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 12H5M11 19l-7-7 7-7" />
  </svg>
);
const IconCheck: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25}
       strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.5 12.5l5 5L20 7" />
  </svg>
);

// -------------------------- Defaults --------------------------

const DEFAULT_PATHWAYS: FundingPathway[] = [
  {
    id: "income_based",
    title: "Income-Based Lenders",
    maxAmount: 300_000,
    tagline: "Funding based on your business cash flow",
    bestFor: "Businesses doing $20K+/month in revenue",
    fundingTime: "24–72 hours",
    pullType: "No hard pull",
    badge: "Fastest",
    Icon: IconCashflow,
    route: "/funding/income-based/offers",
  },
  {
    id: "credit_card_stacking",
    title: "Business Credit Card Stacking",
    maxAmount: 200_000,
    tagline: "0% intro APR business cards stacked for maximum capital",
    bestFor: "700+ personal credit, established business",
    fundingTime: "7–14 days",
    pullType: "Soft pull first",
    Icon: IconCard,
    route: "/funding/credit-card-stacking/offers",
  },
  {
    id: "business_loc",
    title: "Business Lines of Credit",
    maxAmount: 300_000,
    tagline: "Revolving credit you draw on as needed",
    bestFor: "6+ months in business with documented revenue",
    fundingTime: "3–7 days",
    pullType: "Soft pull first",
    Icon: IconBank,
    route: "/funding/business-line-of-credit/offers",
  },
  {
    id: "personal_loan",
    title: "Personal Loans",
    maxAmount: 400_000,
    tagline: "Fixed-term installment loans, predictable payments",
    bestFor: "Strong personal credit, W-2 or 1099 income",
    fundingTime: "1–5 days",
    pullType: "Hard pull on funding",
    Icon: IconUser,
    route: "/funding/personal-loans/offers",
  },
  {
    id: "personal_credit_card",
    title: "Personal Credit Cards",
    maxAmount: 150_000,
    tagline: "High-limit personal cards with rewards",
    bestFor: "Strong personal credit, lower limits than business",
    fundingTime: "7–14 days",
    pullType: "Soft pull first",
    Icon: IconCard,
    route: "/funding/personal-credit-cards/offers",
  },
];

// -------------------------- Helpers --------------------------

const formatMoney = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toLocaleString()}`;

const formatMoneyFull = (n: number) => `$${n.toLocaleString()}`;

// -------------------------- Component --------------------------

const FundingPathways: React.FC<FundingPathwaysProps> = ({
  pathways = DEFAULT_PATHWAYS,
  realDeal,
  clientFirstName,
  onContinue,
  onBack,
  onSelect,
  selectedPathwayId,
}) => {
  const [selectedId, setSelectedId] = useState<PathwayId | null>(selectedPathwayId as PathwayId || "income_based");
  const selected = pathways.find((p) => p.id === selectedId) || null;

  const computationFromBackend = realDeal?.businessIncomeComputation || {};

  // Extract dynamically calculated maximums from backend data
  const getAmountFromBackend = (pathwayId: PathwayId, defaultAmount: number) => {
    switch (pathwayId) {
      case "income_based":
        return typeof computationFromBackend.estimatedApprovalAmount === 'object' && computationFromBackend.estimatedApprovalAmount !== null
          ? computationFromBackend.estimatedApprovalAmount.amount
          : (computationFromBackend.estimatedApprovalAmount ?? defaultAmount);
      case "credit_card_stacking":
        return typeof computationFromBackend.businessCreditCardStackingEstimatedApprovalAmount === 'object' && computationFromBackend.businessCreditCardStackingEstimatedApprovalAmount !== null
          ? computationFromBackend.businessCreditCardStackingEstimatedApprovalAmount.amount
          : (computationFromBackend.businessCreditCardStackingEstimatedApprovalAmount ?? defaultAmount);
      case "business_loc":
        return typeof computationFromBackend.businessLineOfCreditEstimatedApprovalAmount === 'object' && computationFromBackend.businessLineOfCreditEstimatedApprovalAmount !== null
          ? computationFromBackend.businessLineOfCreditEstimatedApprovalAmount.amount
          : (computationFromBackend.businessLineOfCreditEstimatedApprovalAmount ?? defaultAmount);
      case "personal_loan":
        return typeof computationFromBackend.personalLoanEstimatedApprovalAmount === 'object' && computationFromBackend.personalLoanEstimatedApprovalAmount !== null
          ? computationFromBackend.personalLoanEstimatedApprovalAmount.amount
          : (computationFromBackend.personalLoanEstimatedApprovalAmount ?? defaultAmount);
      case "personal_credit_card":
        return typeof computationFromBackend.personalCreditCardEstimatedApprovalAmount === 'object' && computationFromBackend.personalCreditCardEstimatedApprovalAmount !== null
          ? computationFromBackend.personalCreditCardEstimatedApprovalAmount.amount
          : (computationFromBackend.personalCreditCardEstimatedApprovalAmount ?? defaultAmount);
      default:
        return defaultAmount;
    }
  };

  // Map over the pathways to inject the updated amounts
  const dynamicPathways = pathways.map(p => ({
    ...p,
    maxAmount: getAmountFromBackend(p.id, p.maxAmount)
  }));

  const dynamicSelected = dynamicPathways.find((p) => p.id === selectedId) || null;

  const handleSelect = (p: FundingPathway) => {
    setSelectedId(p.id);
    onSelect?.(p);
  };

  const handleContinue = () => {
    if (!dynamicSelected) return;
    onContinue?.(dynamicSelected);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 px-4 py-8 sm:px-6 lg:px-8">
      {/* Progress bar (decorative — keep parity with prior screens) */}
      <div className="mx-auto mb-6 max-w-3xl">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
          <span className="text-emerald-600">● Pre-Qualified</span>
          <span className="text-slate-400">─── Submitted ───</span>
          <span className="text-slate-400">Ready</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/3 rounded-full bg-emerald-500" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10">
        {/* Pre-approval complete chip */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            <IconSparkle className="h-4 w-4" />
            Pre-approval complete
          </span>
        </div>

        {/* Headline */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {clientFirstName ? `${clientFirstName}, c` : "C"}hoose your funding path
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
            You've been pre-approved across{" "}
            <span className="font-semibold text-slate-900">{pathways.length} funding categories</span>.
            Select the one you'd like to pursue first — you can always come back for the others.
          </p>
        </div>

        {/* Pathway cards */}
        <ul role="radiogroup" aria-label="Funding pathway options" className="mt-8 space-y-3">
          {dynamicPathways.map((p) => {
            const isSelected = selectedId === p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelect(p)}
                  className={[
                    "group relative flex w-full items-stretch gap-4 rounded-2xl border p-5 text-left transition-all sm:gap-5 sm:p-6",
                    isSelected
                      ? "border-blue-600 bg-blue-50/60 shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
                  ].join(" ")}
                >
                  {/* Radio dot */}
                  <span
                    aria-hidden
                    className={[
                      "mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 transition-colors",
                      isSelected
                        ? "border-blue-600 bg-blue-600"
                        : "border-slate-300 bg-white group-hover:border-slate-400",
                    ].join(" ")}
                  >
                    {isSelected && <IconCheck className="h-3 w-3 text-white" />}
                  </span>

                  {/* Icon */}
                  <span
                    className={[
                      "flex h-12 w-12 flex-none items-center justify-center rounded-xl",
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700",
                    ].join(" ")}
                  >
                    <p.Icon className="h-6 w-6" />
                  </span>

                  {/* Text block */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                        {p.title}
                      </h3>
                      {p.badge && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{p.tagline}</p>
                    <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-slate-500 sm:grid-cols-3">
                      <div>
                        <dt className="font-medium text-slate-400 uppercase tracking-wide">Best for</dt>
                        <dd className="text-slate-700">{p.bestFor}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-400 uppercase tracking-wide">Funding time</dt>
                        <dd className="text-slate-700">{p.fundingTime}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-400 uppercase tracking-wide">Credit check</dt>
                        <dd className="text-slate-700">{p.pullType}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Amount */}
                  <div className="flex flex-none flex-col items-end justify-center pl-2 text-right">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                      Up to
                    </span>
                    <span
                      className={[
                        "font-mono text-2xl font-bold leading-none sm:text-3xl",
                        isSelected ? "text-blue-700" : "text-slate-900",
                      ].join(" ")}
                      style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                    >
                      {formatMoney(p.maxAmount)}
                    </span>
                    <span className="mt-1 text-[11px] text-slate-500">{formatMoneyFull(p.maxAmount)}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Selected summary */}
        <div
          className={[
            "mt-6 flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors",
            dynamicSelected
              ? "border-blue-200 bg-blue-50 text-slate-800"
              : "border-slate-200 bg-slate-50 text-slate-500",
          ].join(" ")}
          aria-live="polite"
        >
          {dynamicSelected ? (
            <>
              <span>
                <span className="font-medium text-slate-500">Selected:</span>{" "}
                <span className="font-semibold text-slate-900">{dynamicSelected.title}</span>{" "}
                <span className="text-slate-500">· up to {formatMoneyFull(dynamicSelected.maxAmount)}</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
              >
                Clear
              </button>
            </>
          ) : (
            <span>Select a pathway above to continue.</span>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <IconArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            disabled={!dynamicSelected}
            onClick={handleContinue}
            className={[
              "cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all",
              dynamicSelected
                ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                : "cursor-not-allowed bg-slate-300",
            ].join(" ")}
          >
            Continue to Offers
            <IconArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Reassurance footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Pre-approval valid for 30 days · No hard credit pull required to view offers
        </p>
      </div>
    </div>
  );
};

export default FundingPathways;

// -------------------------- Route map (single source of truth) --------------------------
//
// When the user clicks Continue, route them to the matching offers page below.
// Update these paths to match your router setup (React Router v6 / Next / etc).
//
//   income_based           → /funding/income-based/offers
//   credit_card_stacking   → /funding/credit-card-stacking/offers
//   business_loc           → /funding/business-line-of-credit/offers
//   personal_loan          → /funding/personal-loans/offers
//
// Example with React Router v6:
//
//   import { useNavigate } from "react-router-dom";
//   const navigate = useNavigate();
//   <FundingPathways onContinue={(p) => navigate(p.route)} />
//
// Example with Next.js App Router:
//
//   import { useRouter } from "next/navigation";
//   const router = useRouter();
//   <FundingPathways onContinue={(p) => router.push(p.route)} />
