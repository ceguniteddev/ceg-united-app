import React, { useState } from "react";
import {
  Wallet,
  Home,
  Layers,
  Check,
  Copy,
  ArrowRight,
  Scale,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { Playbook } from "@/types/funding-playbook";
import {
  SectionCard,
  Chip,
  RationaleBlock,
  ComplianceNote,
  StatRow,
} from "./Primitives";
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

  return (
    <SectionCard
      n={5}
      id="income"
      icon={Wallet}
      accent="brand"
      title="Income Structuring Guidance"
      subtitle="Recommended stated income and reasoning"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-blue-300 bg-blue-50/40 p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
            Recommended Stated Annual Income
          </div>
          <div className="font-mono text-[27px] font-bold text-blue-700 mt-1 flex items-center gap-3">
            <span>{usd(i.aiRecommendedStatedIncome)}</span>
            <CopyField value={String(i.aiRecommendedStatedIncome)} />
          </div>
          <p className="text-[12.5px] text-gray-600 mt-2">{i.aiReasoning}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-3.5">
            <span className="text-[11px] text-gray-500">
              Current Stated Income
            </span>
            <p className="font-mono text-base font-bold text-gray-800 mt-0.5">
              {usd(i.currentStatedIncome)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3.5">
            <span className="text-[11px] text-gray-500">
              Verifiable Annual Income
            </span>
            <p className="font-mono text-base font-bold text-gray-800 mt-0.5">
              {usd(i.currentVerifiableIncome)}
            </p>
          </div>
        </div>

        {i.regulationBNote && (
          <ComplianceNote>
            <span className="font-semibold text-gray-700">
              Regulation B Guidance:
            </span>{" "}
            {i.regulationBNote}
          </ComplianceNote>
        )}
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
          <div className="rounded-2xl border-2 border-blue-600/20 bg-blue-50/40 px-5 py-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
              Monthly Housing Payment
            </div>
            <div className="font-mono text-[34px] font-bold text-blue-700 mt-2">
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

  return (
    <SectionCard
      n={7}
      id="approval"
      icon={Wallet}
      accent="brand"
      title="Personalized Approval Estimate"
      subtitle="Estimated credit limit range based on your profile"
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
          {a.confidenceLevel.toUpperCase()} Confidence
        </Chip>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 to-[#2a4f7c] px-5 py-6 text-white">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
              Estimated Personalized Range
            </div>
            <div className="font-mono text-[34px] sm:text-[44px] font-bold tracking-tight leading-none mt-2 tabular-nums">
              {usd(lo)} <span className="text-white/40 font-normal">–</span>{" "}
              {usd(hi)}
            </div>
            <div className="mt-3 text-[11px] text-white/70">
              Lender documented range: {usd(a.lenderDocumentedRange[0])} –{" "}
              {usd(a.lenderDocumentedRange[1])}
            </div>
          </div>

          <RationaleBlock label="Reasoning">{a.aiReasoning}</RationaleBlock>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
            FICO Requirement
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-gray-700">
                Minimum FICO
              </span>
              <span className="font-mono font-bold text-gray-900">
                {a.minFICORequired}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[12px] text-gray-500">
                You meet minimum
              </span>
              <Chip tone={a.clientMeetsMinFICO ? "green" : "red"}>
                {a.clientMeetsMinFICO ? "Yes" : "No"}
              </Chip>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// 08 — CEG Product Recommendations
export function DoubleDipSection({ pb }: { pb: Playbook }) {
  const c = pb.section8_cegRecommendations;

  return (
    <SectionCard
      n={8}
      id="double-dip"
      icon={TrendingUp}
      accent="success"
      title="CEG Product Lift & Recommendations"
      subtitle="Recommended services to maximize approval odds"
    >
      <div className="space-y-3">
        {c.recommendations.map((rec) => (
          <div
            key={rec.service}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-gray-900 capitalize">
                #{rec.rank} - {rec.service.replace("_", " ")}
              </span>
              <Chip tone="blue">
                {rec.estimatedTimeToImpactDays} days impact
              </Chip>
            </div>
            <p className="text-[12.5px] text-gray-600 mt-2">
              {rec.aiApplicability}
            </p>
            <div className="mt-2 text-[11.5px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
              Lift: {rec.curatedImpactEstimate}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
