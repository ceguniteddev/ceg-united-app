import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Home,
  Layers,
  Check,
  Copy,
  TrendingUp,
  Lock,
  Building2,
  User,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import type { Playbook } from "@/types/funding-playbook";
import { SectionCard, Chip, RationaleBlock } from "./Primitives";
import { ConfidenceBar } from "./ProgressRing";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function usd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        try {
          navigator.clipboard?.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // fallback
        }
      }}
      className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg px-2 py-1 hover:bg-blue-50 transition-colors"
      title="Copy value"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {value}
    </button>
  );
}

// 05 — Income Structuring Guidance
export function IncomeSection({ pb }: { pb: Playbook }) {
  const i = pb.section5_incomeStructuring;

  const biz = i.businessRevenue || {
    annualBusinessRevenue:
      i.aiRecommendedStatedIncome || i.currentStatedIncome || 240000,
    trailing3MonthRevenue: Math.round(
      (i.aiRecommendedStatedIncome || i.currentStatedIncome || 240000) / 4,
    ),
    annualizedRunRate:
      i.aiRecommendedStatedIncome || i.currentStatedIncome || 240000,
    documentableFrom: "Business checking deposits",
    reasoning:
      i.aiReasoning ||
      "Report your projected annual revenue based on current run-rate from business bank deposits.",
    fieldToEnter:
      i.aiRecommendedStatedIncome || i.currentStatedIncome || 240000,
  };

  const personal = i.personalHouseholdIncome || {
    householdTotal:
      i.currentVerifiableIncome || i.currentStatedIncome || 145000,
    yourIncome: Math.round(
      (i.currentVerifiableIncome || i.currentStatedIncome || 145000) * 0.65,
    ),
    additionalIncome: Math.round(
      (i.currentVerifiableIncome || i.currentStatedIncome || 145000) * 0.35,
    ),
    additionalIncomeSourceLabel: "Spouse / Additional income",
    reasoning:
      "Report your total annual household income as a personal guarantor on personal credit applications.",
    fieldToEnter: i.currentVerifiableIncome || i.currentStatedIncome || 145000,
  };

  const summary =
    i.whatToEnterSummary ||
    `${usd(biz.fieldToEnter)} business revenue · ${usd(personal.fieldToEnter)} personal household income`;

  return (
    <SectionCard
      n={5}
      id="income"
      icon={Wallet}
      accent="brand"
      title="Income Structuring Guidance"
      subtitle="Exactly what to put in the income fields — and why it's legitimate"
      aside={<Chip tone="blue">Business product</Chip>}
    >
      <div className="space-y-5">
        {/* Top 2 Cards: Business vs Personal */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Card 1: Business Products */}
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/20 p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-blue-700">
                  <Building2 className="w-3.5 h-3.5" /> FOR BUSINESS PRODUCTS
                </div>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded-full">
                  Applies to you
                </span>
              </div>

              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Annual business revenue
                </span>
                <span className="font-mono text-[26px] sm:text-[32px] font-extrabold text-blue-700 leading-tight block mt-0.5 tabular-nums break-words">
                  {usd(biz.annualBusinessRevenue)}
                </span>
              </div>

              <p className="text-[12px] text-slate-600 leading-relaxed mt-2.5">
                {biz.reasoning}
              </p>
            </div>

            <div className="border-t border-blue-100 pt-3 space-y-2 text-[12px]">
              <div className="flex items-center justify-between text-slate-600">
                <span>Trailing 3-month revenue</span>
                <span className="font-mono font-bold text-slate-900">
                  {usd(biz.trailing3MonthRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Annualized run-rate</span>
                <span className="font-mono font-bold text-slate-900">
                  {usd(biz.annualizedRunRate)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Documentable from</span>
                <span className="font-semibold text-slate-800">
                  {biz.documentableFrom}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-medium text-slate-700">
                  Enter in field
                </span>
                <CopyField value={String(biz.fieldToEnter)} />
              </div>
            </div>
          </div>

          {/* Card 2: Personal Products */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                  <User className="w-3.5 h-3.5" /> FOR PERSONAL PRODUCTS
                </div>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Reference
                </span>
              </div>

              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Household income
                </span>
                <span className="font-mono text-[26px] sm:text-[32px] font-extrabold text-slate-900 leading-tight block mt-0.5 tabular-nums break-words">
                  {usd(personal.householdTotal)}
                </span>
              </div>

              <p className="text-[12px] text-slate-600 leading-relaxed mt-2.5">
                {personal.reasoning}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-[12px]">
              <div className="flex items-center justify-between text-slate-600">
                <span>Your income</span>
                <span className="font-mono font-bold text-slate-900">
                  {usd(personal.yourIncome)}
                </span>
              </div>
              {personal.additionalIncome > 0 && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>
                    {personal.additionalIncomeSourceLabel ||
                      "Additional income"}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {usd(personal.additionalIncome)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-600">
                <span>Household total</span>
                <span className="font-mono font-bold text-slate-900">
                  {usd(personal.householdTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-medium text-slate-700">
                  Enter in field
                </span>
                <CopyField value={String(personal.fieldToEnter)} />
              </div>
            </div>
          </div>
        </div>

        {/* Dark Banner: WHAT TO ENTER ON THIS APPLICATION */}
        <div className="rounded-xl bg-[#0f172a] p-4 text-white space-y-1.5 shadow-sm">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            WHAT TO ENTER ON THIS APPLICATION
          </div>
          <div className="font-mono text-[12px] sm:text-[13px] font-semibold text-slate-200 bg-[#1e293b] px-3 py-1.5 rounded-md inline-block max-w-full break-words">
            {summary}
          </div>
        </div>

        {/* Regulation B Footnote */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 flex items-start gap-2.5 text-[11.5px] text-slate-600 leading-relaxed">
          <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800">
              Regulation B (CFPB).
            </span>{" "}
            {i.regulationBNote ||
              "Regulation B (12 CFR 1002) permits an applicant to include income from a spouse or partner that is regularly available to them for paying household expenses. Reporting household income on a personal credit application is legal and expressly contemplated by the CFPB. Report only income you can substantiate."}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// 06 — Rent / Mortgage Structuring
export function HousingSection({ pb }: { pb: Playbook }) {
  const h = pb.section6_housingStructuring;

  return (
    <SectionCard
      n={6}
      id="housing"
      icon={Home}
      accent="brand"
      title="Housing Payment & DTI Structuring"
      subtitle="Managing housing payments for DTI optimization"
      aside={
        <Chip tone="green">
          DTI {h.dtiImpactIfIncluded}% vs {h.dtiImpactIfExcluded}%
        </Chip>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-blue-600/20 bg-blue-50/40 px-4 py-4 sm:px-5 sm:py-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
              Monthly Housing Payment
            </div>
            <div className="font-mono text-[28px] sm:text-[34px] font-bold text-blue-700 mt-2 tabular-nums break-words">
              {usd(h.currentMonthlyHousingPayment)}
            </div>
            <p className="text-[12px] text-gray-500 mt-1">
              Reported on credit: {h.isReportedOnCreditReport ? "Yes" : "No"}
            </p>
          </div>

          <RationaleBlock label="Structuring Math">
            {h.aiStructuringMath}
          </RationaleBlock>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
            Recommendation
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3.5">
            <p className="text-[12.5px] text-emerald-900 leading-snug">
              {h.aiRecommendation}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// 07 — Estimated Approval Amount
export function ApprovalSection({ pb }: { pb: Playbook }) {
  const a = pb.section4_approvalEstimate;
  const [lo, hi] = a.aiPersonalizedRange;
  const [docLo, docHi] = a.lenderDocumentedRange || [5000, 50000];

  const lenderName = pb.meta?.lenderDisplayName || "Lender";
  const productName = pb.meta?.productDisplayName || "Product";

  // Compute slider track percentages relative to documented range
  const minLimit = docLo;
  const maxLimit = Math.max(docHi, hi * 1.05);
  const totalSpan = maxLimit - minLimit || 1;
  const leftPct = Math.max(
    0,
    Math.min(100, ((lo - minLimit) / totalSpan) * 100),
  );
  const widthPct = Math.max(
    5,
    Math.min(100 - leftPct, ((hi - lo) / totalSpan) * 100),
  );

  const midpoint = Math.round((lo + hi) / 2);

  const confidencePct =
    a.confidencePct ??
    (a.confidenceLevel === "high"
      ? 82
      : a.confidenceLevel === "medium"
        ? 65
        : 35);

  const drivers =
    a.topDrivers && a.topDrivers.length > 0
      ? a.topDrivers.slice(0, 3)
      : [
          {
            label: `${pb.section3_bureauPull?.clientScoreOnPrimaryBureau || 680} FICO (${pb.section3_bureauPull?.primaryBureau || "Primary Bureau"})`,
            detail: "Primary credit profile input",
            weightPct: 40,
            impact: "positive" as const,
          },
          {
            label: `${lenderName} banking & account tenure`,
            detail: "Relationship factors",
            weightPct: 35,
            impact: "positive" as const,
          },
          {
            label: "Revolving utilization & credit file depth",
            detail: "Underwriting factors",
            weightPct: 25,
            impact: "neutral" as const,
          },
        ];

  const noteText =
    a.estimateNote ||
    `${productName} has a ${usd(docLo)} minimum starting limit. Approvals in your profile band cluster at ${usd(lo)}–${usd(hi)}, with a tail up to ${usd(docHi)} for well-established profiles.`;

  return (
    <SectionCard
      n={7}
      id="approval"
      icon={Wallet}
      accent="brand"
      title="Estimated Approval Amount"
      subtitle={`What ${lenderName} is likely to extend on ${productName}`}
      aside={
        <Chip
          tone={
            a.confidenceLevel === "high"
              ? "green"
              : a.confidenceLevel === "medium"
                ? "amber"
                : "red"
          }
        >
          {a.confidenceLevel === "high"
            ? "High confidence"
            : a.confidenceLevel === "medium"
              ? "Medium confidence"
              : "Low confidence"}
        </Chip>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Dark Blue Estimated Approval Range Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#1b3459] px-4 py-5 sm:px-6 sm:py-6 text-white shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
              Estimated Approval Range
            </div>
            <div className="font-mono text-[28px] sm:text-[40px] md:text-[46px] font-bold tracking-tight leading-tight mt-2 tabular-nums break-words">
              {usd(lo)}{" "}
              <span className="text-slate-400 font-normal mx-1">–</span>{" "}
              {usd(hi)}
            </div>

            {/* Slider track visualization */}
            <div className="mt-6 space-y-2">
              <div className="relative h-2.5 w-full rounded-full bg-slate-700/70 overflow-hidden">
                <div
                  className="absolute h-full rounded-full bg-slate-200/90 shadow-sm"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono tabular-nums pt-1">
                <span>{usd(minLimit)} min</span>
                <span className="text-slate-300">midpoint {usd(midpoint)}</span>
                <span>{usd(maxLimit)} tail</span>
              </div>
            </div>
          </div>

          {/* Confidence Bar & Reasoning */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
            <ConfidenceBar pct={confidencePct} confidence={a.confidenceLevel} />
            <p className="text-[12.5px] text-gray-700 leading-relaxed pt-1">
              {a.aiReasoning}
            </p>
          </div>

          {/* Estimate Note Box */}
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <Layers className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-[12px] text-blue-900 leading-relaxed">
              {noteText}
            </p>
          </div>
        </div>

        {/* Right Column: Top 3 Inputs */}
        <div className="space-y-3">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-gray-400 px-0.5">
            Top 3 Inputs Driving This Estimate
          </div>

          <div className="space-y-2.5">
            {drivers.map((driver, idx) => {
              const isPos = driver.impact === "positive";
              const isNeg = driver.impact === "negative";
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-gray-200/80 bg-white p-3.5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="font-mono text-[11px] font-semibold text-gray-300 shrink-0 pt-0.5">
                        {idx + 1}
                      </span>
                      <h4 className="text-[12.5px] font-bold text-gray-900 leading-snug truncate">
                        {driver.label}
                      </h4>
                    </div>
                    <span className="font-mono text-[11px] font-medium text-gray-400 shrink-0">
                      {driver.weightPct}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={cn(
                        "font-semibold",
                        isPos
                          ? "text-emerald-700"
                          : isNeg
                            ? "text-red-600"
                            : "text-gray-600",
                      )}
                    >
                      {driver.detail}
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        isPos
                          ? "bg-emerald-500"
                          : isNeg
                            ? "bg-red-500"
                            : "bg-blue-500",
                      )}
                      style={{
                        width: `${Math.min(100, Math.max(5, driver.weightPct))}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// 08 — Double-Dip Strategy (Image #1 Design)
export function DoubleDipSection({ pb }: { pb: Playbook }) {
  const dd = pb.section8_doubleDip || {
    friendly: true,
    intro:
      "Submit multiple products back-to-back within the same session for the price of one hard credit inquiry.",
    howToRunSequence:
      "Submit your primary application first. Immediately after, in the same browser session, submit the second application.",
    products: [],
  };

  const friendly = dd.friendly ?? true;

  return (
    <SectionCard
      n={8}
      id="double-dip"
      icon={Layers}
      accent={friendly ? "success" : "default"}
      title="Double-Dip Potential"
      subtitle="Can you get more than one product from a single credit pull?"
      aside={
        <Chip
          tone={friendly ? "green" : "gray"}
          icon={friendly ? ShieldCheck : AlertTriangle}
        >
          {friendly ? "Double-dip friendly" : "Single pull unavailable"}
        </Chip>
      }
    >
      <div className="space-y-4">
        {/* Intro banner */}
        <div
          className={cn(
            "rounded-2xl border p-4 sm:p-5 space-y-2",
            friendly
              ? "border-emerald-200 bg-emerald-50/40"
              : "border-gray-200 bg-gray-50/60",
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider",
                friendly
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-700 text-white",
              )}
            >
              {friendly ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Double-dip friendly
                </>
              ) : (
                "Single pull not available"
              )}
            </span>
          </div>
          <p className="text-[12.5px] sm:text-[13px] text-gray-800 leading-relaxed pt-1">
            {dd.intro}
          </p>
        </div>

        {/* Grid of Product Cards */}
        {dd.products && dd.products.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dd.products.map((p, idx) => {
              const isRec = p.bundleRecommended;
              return (
                <div
                  key={`${p.productId}-${idx}`}
                  className={cn(
                    "rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all",
                    isRec
                      ? "border-emerald-300 bg-white ring-1 ring-emerald-100 shadow-2xs"
                      : "border-gray-200/80 bg-gray-50/50 opacity-90",
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-[13.5px] font-bold text-gray-900 leading-snug">
                        {p.displayName}
                      </h4>
                      {isRec ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-[12px] text-gray-600 mt-2 leading-relaxed">
                      {p.note}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      EST. LIMIT
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[14px] font-bold leading-tight block mt-0.5",
                        isRec
                          ? "text-emerald-700"
                          : "text-gray-400 font-normal text-[12px]",
                      )}
                    >
                      {isRec && (p.estLimitLow || p.estLimitHigh)
                        ? `${usd(p.estLimitLow || 5000)} – ${usd(p.estLimitHigh || 15000)}`
                        : "Not part of the double-dip"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How to run the double-dip sequence banner */}
        {dd.howToRunSequence && (
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4 space-y-2">
            <div className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-emerald-800">
              HOW TO RUN THE DOUBLE-DIP
            </div>
            <p className="text-[12.5px] text-gray-700 leading-relaxed">
              {dd.howToRunSequence}
            </p>
            {(dd.combinedExposureLow || dd.combinedExposureHigh) && (
              <p className="text-[12px] font-semibold text-emerald-900 pt-1">
                Total combined exposure potential:{" "}
                <span className="font-mono font-extrabold">
                  {usd(dd.combinedExposureLow || 0)} –{" "}
                  {usd(dd.combinedExposureHigh || 0)}
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// 09 — CEG Product Lift & Recommendations (Image #2 Design)
export function CegProductLiftSection({ pb }: { pb: Playbook }) {
  const c = pb.section8_cegRecommendations;

  return (
    <SectionCard
      n={9}
      id="ceg-lift"
      icon={TrendingUp}
      accent="success"
      title="CEG Product Lift & Recommendations"
      subtitle="Recommended services to maximize approval odds"
    >
      <div className="space-y-3">
        {c.recommendations.map((rec, idx) => {
          const displayTitle =
            rec.serviceLabel || rec.service.replace("_", " ");
          const isInquiryRemoval = displayTitle
            .toLowerCase()
            .includes("inquiry removal");
          const isCreditMonitoring = displayTitle
            .toLowerCase()
            .includes("credit monitoring");
          const impactDays = isInquiryRemoval
            ? 5
            : rec.estimatedTimeToImpactDays;
          return (
            <div
              key={`${rec.service}-${rec.rank || idx}`}
              className="rounded-xl border border-gray-200 bg-white p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-gray-900 capitalize">
                  #{rec.rank} - {displayTitle}
                </span>
                <Chip tone="blue">{impactDays} days impact</Chip>
              </div>
              <p className="text-[12.5px] text-gray-600 leading-relaxed">
                {rec.aiApplicability}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                {!isCreditMonitoring && rec.curatedImpactEstimate && (
                  <div className="text-[11.5px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
                    Lift: {rec.curatedImpactEstimate}
                  </div>
                )}
                {isInquiryRemoval && (
                  <Link
                    href="/client/credit-repair"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    Open Credit Repair
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
                {isCreditMonitoring && (
                  <Link
                    href="/client/my-credit"
                    className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    Open My Credit
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
