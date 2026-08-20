import React from "react";
import {
  Globe,
  Building,
  Phone,
  Smartphone,
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
import type { Playbook, ApplicationChannel } from "@/types/funding-playbook";
import {
  SectionCard,
  Chip,
  RationaleBlock,
  EmptyState,
  ActionButton,
} from "./Primitives";

// ── Channel display helpers ──────────────────────────────────────────
const CHANNEL_ICON: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  online: Globe,
  in_branch: Building,
  phone: Phone,
  mobile_app: Smartphone,
};

const CHANNEL_LABEL: Record<string, string> = {
  online: "Online",
  in_branch: "In branch",
  phone: "By phone",
  mobile_app: "Mobile app",
};

const CHANNEL_ACTION: Record<ApplicationChannel, string> = {
  online: "Apply online",
  in_branch: "Apply in branch",
  phone: "Apply by phone",
  mobile_app: "Apply in app",
};

// 01 — Best Application Method
export function BestMethodSection({ pb }: { pb: Playbook }) {
  const m = pb.section1_bestMethod;
  const channel = m.recommendedChannel;
  const RecommendedIcon = CHANNEL_ICON[channel] ?? Globe;

  const productName =
    pb.meta.productDisplayName || pb.meta.productId || "this product";

  return (
    <SectionCard
      n={1}
      id="best-method"
      icon={RecommendedIcon}
      accent="brand"
      title="Best Application Method"
      subtitle={`How to submit your ${productName} application`}
      aside={
        <Chip tone="blue" icon={Clock}>
          1–3 Days Decision
        </Chip>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-5 text-white">
            {/* decorative watermark icon */}
            <RecommendedIcon className="pointer-events-none absolute -right-4 -top-4 w-40 h-40 text-white/10" />
            <div className="relative">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                Recommended method
              </div>
              <div className="flex items-center gap-2.5 mt-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <RecommendedIcon className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  {CHANNEL_ACTION[channel] ?? "Apply"}
                </span>
              </div>
              {m.recommendedHeadline && (
                <p className="text-[13.5px] font-medium text-white/90 mt-2.5 leading-snug max-w-md">
                  {m.recommendedHeadline}
                </p>
              )}
            </div>
          </div>

          <RationaleBlock label="Why this method" tone="brand">
            {m.reasoning}
          </RationaleBlock>

          {m.keyTakeaways && m.keyTakeaways.length > 0 && (
            <ul className="space-y-2">
              {m.keyTakeaways.map((takeaway, i) => (
                <li key={i} className="flex gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-[1px] flex-shrink-0" />
                  <span className="text-[13px] text-gray-600 leading-relaxed">
                    {takeaway}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Right column: other channels + decision speed ───────── */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
            Other channels
          </div>

          {m.otherChannels && m.otherChannels.length > 0 ? (
            m.otherChannels.map((oc, idx) => {
              const OcIcon = CHANNEL_ICON[oc.channel] ?? Globe;
              return (
                <div
                  key={`${oc.channel}-${idx}`}
                  className="rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 py-3"
                >
                  <div className="flex items-center gap-2">
                    <OcIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-[12.5px] font-semibold text-gray-700">
                      {CHANNEL_LABEL[oc.channel] ?? oc.channel}
                    </span>
                    <Chip
                      tone={oc.recommended ? "green" : "gray"}
                      className="ml-auto"
                    >
                      {oc.recommended ? "Recommended" : "Not recommended"}
                    </Chip>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-2 leading-relaxed">
                    {oc.note}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 py-3">
              <p className="text-[12px] text-gray-500 leading-relaxed">
                No alternative channels documented for this product.
              </p>
            </div>
          )}

          {m.decisionSpeedNote && (
            <div className="rounded-xl bg-gray-900 px-4 py-3.5 text-white">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                Expected decision speed
              </div>
              <p className="text-[12.5px] font-semibold text-white/90 mt-1.5 leading-snug">
                {m.decisionSpeedNote}
              </p>
            </div>
          )}
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
      title={`Your Relationship with ${r.lenderDisplayName}`}
      subtitle="Existing accounts and your direct application link"
      aside={
        r.hasExistingRelationship ? (
          <Chip tone="green" icon={ShieldCheck}>
            {r.yearsWithLender && r.yearsWithLender > 0
              ? `${r.yearsWithLender}-year customer`
              : "Existing customer"}
          </Chip>
        ) : (
          <Chip tone="gray">No relationship on file</Chip>
        )
      }
    >
      <div className="space-y-4">
        {r.hasExistingRelationship && r.accounts.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {r.accounts.map((a, i) => (
              <div
                key={`${a.label}-${i}`}
                className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-bold text-gray-900 leading-snug">
                    {a.label}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                </div>
                <p className="font-mono text-[11.5px] text-gray-500 mt-1">
                  {a.detail}
                </p>
                <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-emerald-200/60">
                  {a.openedYear && (
                    <span className="text-[11px] text-gray-500">
                      Opened{" "}
                      <span className="font-mono font-semibold text-gray-700">
                        {a.openedYear}
                      </span>
                    </span>
                  )}
                  <span className="text-[11px] text-gray-500">
                    {a.balanceOrLimit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Link2}
            title={`No existing ${r.lenderDisplayName} relationship on file`}
            body="Applying as a new customer. Building a checking or deposit relationship can boost future approval odds."
          />
        )}

        <RationaleBlock
          label={
            r.hasExistingRelationship
              ? "Why this matters"
              : "How relationship helps approval"
          }
          tone={r.hasExistingRelationship ? "green" : "gray"}
        >
          {r.hasExistingRelationship
            ? r.whyThisMatters
            : r.howRelationshipHelpsApproval}
        </RationaleBlock>

        <div className="rounded-2xl border-2 border-blue-600/20 bg-blue-50/40 p-4 flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
              {r.hasExistingRelationship
                ? "Your pre-filled application"
                : "Application link"}
            </div>
            <p className="text-[13px] font-semibold text-gray-900 mt-1 leading-snug">
              {r.applicationUrlLabel}
            </p>
            <p className="font-mono text-[11px] text-gray-400 mt-1 truncate">
              {pb.section1_bestMethod.applicationUrl}
            </p>
          </div>
          <ActionButton
            href={pb.section1_bestMethod.applicationUrl}
            external
            icon={ArrowUpRight}
            size="lg"
          >
            {r.hasExistingRelationship
              ? "Open pre-filled application"
              : "Open application"}
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

// ── Bureau risk tone helpers ─────────────────────────────────────────
const BUREAU_TONE: Record<
  "optimal" | "caution" | "high-risk",
  { chip: "green" | "amber" | "red"; ring: string; text: string }
> = {
  optimal: {
    chip: "green",
    ring: "border-emerald-200 bg-emerald-50/60",
    text: "text-emerald-700",
  },
  caution: {
    chip: "amber",
    ring: "border-amber-200 bg-amber-50/60",
    text: "text-amber-700",
  },
  "high-risk": {
    chip: "red",
    ring: "border-red-200 bg-red-50/60",
    text: "text-red-700",
  },
};

// 04 — Bureau Pulled + Inquiry Count
export function BureauSection({ pb }: { pb: Playbook }) {
  const b = pb.section3_bureauPull;
  const bureauInquiries = b.bureauInquiries ?? [];
  const primaryRiskTier = b.primaryRiskTier ?? "optimal";
  const primaryRiskLabel = b.primaryRiskLabel ?? "—";
  const primaryBureauInquiries = b.primaryBureauInquiries ?? 0;
  const tone = BUREAU_TONE[primaryRiskTier] ?? BUREAU_TONE.optimal;
  const lenderName = pb.meta.lenderDisplayName || "This lender";
  const ourRead =
    b.ourRead ||
    b.bureauPullNotes ||
    "This lender pulls the bureau shown above.";

  return (
    <SectionCard
      n={4}
      id="bureau"
      icon={Fingerprint}
      accent={b.favorable ? "success" : "warning"}
      title="Bureau Pulled & Your Inquiry Count"
      subtitle="Which credit file this application will hit"
      aside={
        <Chip tone={tone.chip} icon={b.favorable ? ShieldCheck : AlertTriangle}>
          {primaryRiskLabel}
        </Chip>
      }
    >
      <div className="space-y-5">
        <div
          className={`rounded-2xl border-2 px-4 py-4 sm:px-5 sm:py-5 ${tone.ring}`}
        >
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-x-8 gap-y-4">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
                {lenderName} typically pulls
              </div>
              <div className="text-[26px] sm:text-[34px] font-extrabold text-gray-900 tracking-tight leading-none mt-1.5 capitalize break-words">
                {b.primaryBureau}
              </div>
              <p className="text-[11.5px] text-gray-500 mt-2 max-w-sm leading-snug">
                {b.bureauPullNotes || "Standard bureau pull."}
              </p>
            </div>
            <div className="sm:ml-auto text-left sm:text-right min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
                Your {b.primaryBureau} inquiries
              </div>
              <div className="flex items-baseline gap-2 justify-start sm:justify-end mt-1.5 flex-wrap">
                <span
                  className={`font-mono text-[32px] sm:text-[38px] font-bold leading-none tabular-nums ${tone.text}`}
                >
                  {primaryBureauInquiries}
                </span>
                <Chip tone={tone.chip}>{primaryRiskLabel}</Chip>
              </div>
              <p className="text-[10.5px] text-gray-400 mt-2 font-mono">
                0–3 optimal · 4–6 caution · 7+ high risk
              </p>
            </div>
          </div>
        </div>

        {/* All 3 bureaus */}
        {bureauInquiries.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {bureauInquiries.map((bureau) => {
              const t = BUREAU_TONE[bureau.riskTier] ?? BUREAU_TONE.optimal;
              return (
                <div
                  key={bureau.bureau}
                  className={`rounded-xl border p-3.5 ${
                    bureau.isPrimary
                      ? "border-blue-300 bg-blue-50/40 ring-1 ring-blue-200"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[13px] font-bold text-gray-900 capitalize">
                      {bureau.bureau}
                    </span>
                    {bureau.isPrimary && (
                      <Chip
                        tone="blue"
                        className="!px-2 !py-0.5 !text-[9.5px] font-bold"
                      >
                        This pull
                      </Chip>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                        Credit Score
                      </span>
                      <span className="font-mono text-[22px] font-extrabold text-blue-600 leading-none tabular-nums">
                        {bureau.score ?? "N/A"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                        Inquiries (6mo)
                      </span>
                      <span
                        className={`font-mono text-[22px] font-extrabold leading-none tabular-nums ${t.text}`}
                      >
                        {bureau.inquiries6mo}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <RationaleBlock
          label={b.favorable ? "Our read" : "Our read — watch this bureau"}
          tone={b.favorable ? "green" : "amber"}
        >
          {ourRead}
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
