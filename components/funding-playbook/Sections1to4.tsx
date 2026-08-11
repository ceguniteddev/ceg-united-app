import React from "react";
import {
  Globe,
  Building,
  Phone,
  ArrowUpRight,
  Link2,
  Landmark,
  CheckCircle2,
  Circle,
  Fingerprint,
  AlertTriangle,
  ShieldCheck,
  TrendingDown,
  Clock,
  Info,
} from "lucide-react";
import type { Playbook } from "@/types/funding-playbook";
import {
  SectionCard,
  Chip,
  RationaleBlock,
  EmptyState,
  ActionButton,
} from "./Primitives";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// 01 — Best Application Method
export function BestMethodSection({ pb }: { pb: Playbook }) {
  const m = pb.section1_bestMethod;
  const isBranch = m.recommendedChannel === "in_branch";

  return (
    <SectionCard
      n={1}
      id="best-method"
      icon={isBranch ? Building : Globe}
      accent="brand"
      title="Best Application Method"
      subtitle={`How to submit your application for this product`}
      aside={
        <Chip tone="blue" icon={Clock}>
          Online or Branch
        </Chip>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-5 text-white">
            <div className="relative">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                Recommended method
              </div>
              <div className="flex items-center gap-2.5 mt-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  {isBranch ? (
                    <Building className="w-5 h-5" />
                  ) : (
                    <Globe className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xl font-bold tracking-tight capitalize">
                  {m.recommendedChannel.replace("_", " ")}
                </span>
              </div>
              <p className="text-[13.5px] font-medium text-white/90 mt-2.5 leading-snug max-w-md">
                {m.reasoning}
              </p>
            </div>
          </div>

          <RationaleBlock label="Personalized note" tone="brand">
            {m.aiPersonalizedNote}
          </RationaleBlock>

          <ul className="space-y-2">
            <li className="flex gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-[1px] flex-shrink-0" />
              <span className="text-[13px] text-gray-600 leading-relaxed">
                Direct link:{" "}
                <a
                  href={m.applicationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  {m.applicationUrl}
                </a>
              </span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
            Channel details
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-semibold text-gray-700">
                In-Branch Recommended
              </span>
              <Chip
                tone={m.inBranchRecommended ? "amber" : "gray"}
                className="ml-auto"
              >
                {m.inBranchRecommended ? "Yes" : "No"}
              </Chip>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// 02 — Existing Relationship + Direct Link
export function RelationshipSection({ pb }: { pb: Playbook }) {
  const r = pb.section2_relationship;

  return (
    <SectionCard
      n={2}
      id="relationship"
      icon={Link2}
      accent={r.hasExistingRelationship ? "success" : "default"}
      title="Your Relationship with Lender"
      subtitle="Existing accounts and your direct application link"
      aside={
        r.hasExistingRelationship ? (
          <Chip tone="green" icon={ShieldCheck}>
            {r.relationshipDepthAssessment} relationship
          </Chip>
        ) : (
          <Chip tone="gray">No relationship on file</Chip>
        )
      }
    >
      <div className="space-y-4">
        {r.hasExistingRelationship && r.relationshipDetails ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3.5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[13px] font-bold text-gray-900 leading-snug">
                {r.relationshipDetails.lenderDisplayName} (
                {r.relationshipDetails.relationshipType})
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            </div>
            <p className="font-mono text-[11.5px] text-gray-500 mt-1">
              Account age: {r.relationshipDetails.accountAgeMonths} months
            </p>
          </div>
        ) : (
          <EmptyState
            icon={Link2}
            title="No existing lender relationship on file"
            body="Applying as a new customer. Building a checking or deposit relationship can boost future approval odds."
          />
        )}

        <RationaleBlock
          label="How relationship helps approval"
          tone={r.hasExistingRelationship ? "green" : "gray"}
        >
          {r.howRelationshipHelpsApproval}
        </RationaleBlock>

        <div className="rounded-2xl border-2 border-blue-600/20 bg-blue-50/40 p-4 flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
              Application link
            </div>
            <p className="font-mono text-[11px] text-gray-500 mt-1 truncate">
              {pb.section1_bestMethod.applicationUrl}
            </p>
          </div>
          <ActionButton
            href={pb.section1_bestMethod.applicationUrl}
            external
            icon={ArrowUpRight}
            size="lg"
          >
            Open application
          </ActionButton>
        </div>
      </div>
    </SectionCard>
  );
}

// 03 — Banking Relationship Requirements
export function BankingRequirementSection({ pb }: { pb: Playbook }) {
  const b = pb.section2_relationship;

  return (
    <SectionCard
      n={3}
      id="banking-requirements"
      icon={Landmark}
      accent="default"
      title="Banking Relationship Requirements"
      subtitle="What this lender expects before they approve you"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-4">
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {b.howRelationshipHelpsApproval}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

// 04 — Bureau Pulled + Inquiry Count
export function BureauSection({ pb }: { pb: Playbook }) {
  const b = pb.section3_bureauPull;

  return (
    <SectionCard
      n={4}
      id="bureau"
      icon={Fingerprint}
      accent="brand"
      title="Bureau Pulled & Credit Rules"
      subtitle="Which credit file this application will hit"
      aside={<Chip tone="blue">{b.primaryBureau.toUpperCase()}</Chip>}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/60 px-5 py-5">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
                Primary bureau
              </div>
              <div className="text-[30px] sm:text-[34px] font-extrabold text-gray-900 tracking-tight leading-none mt-1.5 capitalize">
                {b.primaryBureau}
              </div>
              {b.secondaryBureau && (
                <div className="text-[12px] text-gray-600 mt-1">
                  Secondary: {b.secondaryBureau}
                </div>
              )}
            </div>
            <div className="sm:ml-auto text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
                Your score on {b.primaryBureau}
              </div>
              <div className="font-mono text-[38px] font-bold leading-none tabular-nums text-blue-700 mt-1.5">
                {b.clientScoreOnPrimaryBureau ?? "N/A"}
              </div>
            </div>
          </div>
        </div>

        <RationaleBlock label="Bureau pull notes" tone="brand">
          {b.bureauPullNotes}
        </RationaleBlock>

        {b.doubleDipRules && (
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-[12.5px] text-amber-900 leading-relaxed">
              <span className="font-semibold">Double-dip rules:</span>{" "}
              {b.doubleDipRules}
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
