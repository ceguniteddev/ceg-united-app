"use client";

import React, { useEffect, useState } from "react";

// -------------------------- Types --------------------------

export type PathwayId =
  | "income_based"
  | "business_credit_card_stacking"
  | "business_lines_of_credit"
  | "personal_loan"
  | "personal_credit_card";

export interface FundingPathway {
  id: PathwayId;
  title: string;
  maxAmount: number; // dollars, e.g. 300000
  tagline: string; // one-line "what is it"
  bestFor: string; // who it's best for
  fundingTime: string; // "24–72 hours"
  pullType: string; // "No hard pull" | "Soft pull first" | etc.
  badge?: string; // optional "Most popular" / "Fastest" / etc.
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
  /** Fires every time the selection changes (useful for analytics). */
  onSelect?: (pathway: FundingPathway) => void;
  /** The currently selected pathway ID from parent state, if any */
  selectedPathwayId?: string;
}

// -------------------------- Icons (inline SVG, currentColor) --------------------------

const IconCashflow: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 6h18M3 12h18M3 18h12" />
    <path d="M17 16l3 2-3 2" />
  </svg>
);
const IconCard: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
    <path d="M2.5 10h19M6 15.5h4" />
  </svg>
);
const IconBank: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 10l9-6 9 6" />
    <path d="M5 10v8M9 10v8M15 10v8M19 10v8" />
    <path d="M3 19h18" />
  </svg>
);
const IconUser: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="8" r="3.75" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);

const IconArrowRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

const IconCheck: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.25}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
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
    fundingTime: "24-72 hours",
    pullType: "No hard pull",
    badge: "Fastest",
    Icon: IconCashflow,
    route: "/funding/income-based/offers",
  },
  {
    id: "business_credit_card_stacking",
    title: "Business Credit Card Stacking",
    maxAmount: 200_000,
    tagline: "0% intro APR business cards stacked for maximum capital",
    bestFor: "700+ personal credit, established business",
    fundingTime: "7-14 days",
    pullType: "Soft pull first",
    Icon: IconCard,
    route: "/funding/credit-card-stacking/offers",
  },
  {
    id: "business_lines_of_credit",
    title: "Business Lines of Credit",
    maxAmount: 300_000,
    tagline: "Revolving credit you draw on as needed",
    bestFor: "6+ months in business with documented revenue",
    fundingTime: "3-7 days",
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
    fundingTime: "1-5 days",
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
    fundingTime: "7-14 days",
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
  onSelect,
  selectedPathwayId,
}) => {
  const [selectedId, setSelectedId] = useState<PathwayId | null>(
    selectedPathwayId as PathwayId,
  );

  const computationFromBackend = realDeal?.businessIncomeComputation || {};

  useEffect(() => {
    if (!selectedPathwayId) {
      setSelectedId("income_based");
    }
  }, [selectedPathwayId]);

  // Extract dynamically calculated maximums from backend data
  const getAmountFromBackend = (
    pathwayId: PathwayId,
    defaultAmount: number,
  ) => {
    switch (pathwayId) {
      case "income_based":
        return typeof computationFromBackend.estimatedApprovalAmount ===
          "object" && computationFromBackend.estimatedApprovalAmount !== null
          ? computationFromBackend.estimatedApprovalAmount.amount
          : (computationFromBackend.estimatedApprovalAmount ?? defaultAmount);
      case "business_credit_card_stacking":
        return typeof computationFromBackend.businessCreditCardStackingEstimatedApprovalAmount ===
          "object" &&
          computationFromBackend.businessCreditCardStackingEstimatedApprovalAmount !==
            null
          ? computationFromBackend
              .businessCreditCardStackingEstimatedApprovalAmount.amount
          : (computationFromBackend.businessCreditCardStackingEstimatedApprovalAmount ??
              defaultAmount);
      case "business_lines_of_credit":
        return typeof computationFromBackend.businessLineOfCreditEstimatedApprovalAmount ===
          "object" &&
          computationFromBackend.businessLineOfCreditEstimatedApprovalAmount !==
            null
          ? computationFromBackend.businessLineOfCreditEstimatedApprovalAmount
              .amount
          : (computationFromBackend.businessLineOfCreditEstimatedApprovalAmount ??
              defaultAmount);
      case "personal_loan":
        return typeof computationFromBackend.personalLoanEstimatedApprovalAmount ===
          "object" &&
          computationFromBackend.personalLoanEstimatedApprovalAmount !== null
          ? computationFromBackend.personalLoanEstimatedApprovalAmount.amount
          : (computationFromBackend.personalLoanEstimatedApprovalAmount ??
              defaultAmount);
      case "personal_credit_card":
        return typeof computationFromBackend.personalCreditCardEstimatedApprovalAmount ===
          "object" &&
          computationFromBackend.personalCreditCardEstimatedApprovalAmount !==
            null
          ? computationFromBackend.personalCreditCardEstimatedApprovalAmount
              .amount
          : (computationFromBackend.personalCreditCardEstimatedApprovalAmount ??
              defaultAmount);
      default:
        return defaultAmount;
    }
  };

  // Map over the pathways to inject the updated amounts
  const dynamicPathways = pathways.map((p) => ({
    ...p,
    maxAmount: getAmountFromBackend(p.id, p.maxAmount),
  }));

  const dynamicSelected =
    dynamicPathways.find((p) => p.id === selectedId) || null;

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
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10">
        {/* Headline */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {clientFirstName ? `${clientFirstName}, c` : "C"}hoose your funding
            path
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
            {`You've been pre-approved across `}
            <span className="font-semibold text-slate-900">
              {pathways.length} funding categories
            </span>
            {`. Select the one you'd like to pursue first — you can always come
            back for the others.`}
          </p>
        </div>

        {/* Pathway cards */}
        <ul
          role="radiogroup"
          aria-label="Funding pathway options"
          className="mt-8 space-y-3"
        >
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
                    "group relative flex w-full flex-col sm:flex-row items-stretch gap-4 sm:gap-5 rounded-2xl border p-4 sm:p-6 text-left transition-all overflow-hidden",
                    isSelected
                      ? "border-blue-600 bg-blue-50/60 shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-4 sm:flex-none">
                    {/* Radio dot */}
                    <span
                      aria-hidden
                      className={[
                        "flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 transition-colors",
                        isSelected
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300 bg-white group-hover:border-slate-400",
                      ].join(" ")}
                    >
                      {isSelected && (
                        <IconCheck className="h-3 w-3 text-white" />
                      )}
                    </span>

                    {/* Icon */}
                    <span
                      className={[
                        "hidden h-12 w-12 flex-none items-center justify-center rounded-xl sm:flex",
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      <p.Icon className="h-6 w-6" />
                    </span>

                    {/* Mobile Title (hidden on SM and above) */}
                    <div className="min-w-0 flex-1 sm:hidden">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900 leading-tight">
                          {p.title}
                        </h3>
                        {realDeal?.appliedPathways?.some(
                          (ap: any) => ap.pathwayId === p.id,
                        ) ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Applied
                          </span>
                        ) : p.badge ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            {p.badge}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex flex-col sm:flex-row flex-1 min-w-0">
                    <div className="flex-1 min-w-0 pl-[36px] sm:pl-0">
                      {/* Desktop Title & Tags */}
                      <div className="hidden sm:flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {p.title}
                        </h3>
                        {realDeal?.appliedPathways?.some(
                          (ap: any) => ap.pathwayId === p.id,
                        ) ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            Applied
                          </span>
                        ) : p.badge ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            {p.badge}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-0.5 text-sm text-slate-600 hidden sm:block">
                        {p.tagline}
                      </p>

                      {/* Mobile Tagline */}
                      <p className="text-sm text-slate-600 sm:hidden">
                        {p.tagline}
                      </p>

                      <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-2 text-xs text-slate-500">
                        <div>
                          <dt className="font-medium text-slate-400 uppercase tracking-wide">
                            Best for
                          </dt>
                          <dd className="text-slate-700">{p.bestFor}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-400 uppercase tracking-wide">
                            Funding time
                          </dt>
                          <dd className="text-slate-700">{p.fundingTime}</dd>
                        </div>
                        <div className="col-span-2 sm:col-span-1 hidden sm:block">
                          <dt className="font-medium text-slate-400 uppercase tracking-wide">
                            Credit check
                          </dt>
                          <dd className="text-slate-700">{p.pullType}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Amount Block */}
                    <div className="flex flex-none items-end sm:items-center sm:justify-end pl-[36px] sm:pl-4 mt-3 sm:mt-0">
                      <div className="flex flex-col sm:items-end w-full sm:w-auto">
                        <div className="flex justify-between items-end sm:flex-col sm:justify-center w-full">
                          <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 sm:hidden">
                            Up to
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="hidden sm:block text-[10px] font-medium uppercase tracking-widest text-slate-400">
                              Up to
                            </span>
                            <span
                              className={[
                                "font-mono font-bold leading-none text-right",
                                isSelected ? "text-blue-700" : "text-slate-900",
                                "text-2xl sm:text-3xl",
                              ].join(" ")}
                              style={{
                                fontFamily:
                                  "'JetBrains Mono', ui-monospace, monospace",
                              }}
                            >
                              {formatMoney(p.maxAmount)}
                            </span>
                          </div>
                        </div>
                        <span className="mt-1 text-[11px] text-slate-500 hidden sm:block text-right">
                          {formatMoneyFull(p.maxAmount)}
                        </span>
                      </div>
                    </div>
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
                <span className="font-semibold text-slate-900">
                  {dynamicSelected.title}
                </span>{" "}
                <span className="text-slate-500">
                  · up to {formatMoneyFull(dynamicSelected.maxAmount)}
                </span>
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
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
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
          Pre-approval valid for 30 days · No hard credit pull required to view
          offers
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
