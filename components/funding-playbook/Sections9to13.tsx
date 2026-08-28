import React from "react";
import {
  CalendarClock,
  PhoneCall,
  MapPin,
  Clock,
  TrendingUp,
  UserRound,
  Mail,
  Sparkles,
  ArrowUpRight,
  Layers,
  GraduationCap,
  CalendarCheck,
  Info,
  ShieldAlert,
  FileWarning,
  MessageCircle,
  Wrench,
  Headphones,
} from "lucide-react";
import type { Playbook, CegRecommendation } from "@/types/funding-playbook";
import {
  SectionCard,
  Chip,
  RationaleBlock,
  ScriptBlock,
  ActionButton,
} from "./Primitives";
import { BranchMap } from "./BranchMap";
import { formatPhoneHref } from "./branch-utils";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// 08 — Nearest Branches
export function BranchesSection({
  pb,
  activeRank,
  onSelect,
}: {
  pb: Playbook;
  activeRank: number | null;
  onSelect: (rank: number) => void;
}) {
  const b = pb.section9_nearestBranches;

  const lenderDisplayName = pb.meta?.lenderDisplayName || "Lender";
  const branchCount = b?.branches?.length || 0;

  const locationLabel = (() => {
    const firstBranchAddr = b?.branches?.[0]?.address;
    if (firstBranchAddr) {
      const parts = firstBranchAddr.split(",").map((p) => p.trim());
      if (parts.length >= 3) {
        const city = parts[parts.length - 2];
        const stateZip = parts[parts.length - 1].split(" ")[0];
        if (city && stateZip) return `${city}, ${stateZip}`;
      }
    }
    return b?.zip ? `ZIP ${b.zip}` : "your area";
  })();

  const subtitle = `${branchCount} closest ${lenderDisplayName} location${
    branchCount === 1 ? "" : "s"
  } to ${locationLabel}`;

  return (
    <SectionCard
      n={10}
      id="branches"
      icon={MapPin}
      accent="brand"
      title="Nearest Branches"
      subtitle={subtitle}
      aside={<Chip tone="blue">Sorted by distance</Chip>}
    >
      <div className="space-y-4">
        <BranchMap
          branches={b?.branches || []}
          activeRank={activeRank}
          onSelect={onSelect}
        />
      </div>
    </SectionCard>
  );
}

// 09 — Reservation & Booking Assistance
export function BookingSection({
  pb,
  activeRank = 1,
  clientFirstName,
}: {
  pb: Playbook;
  activeRank?: number | null;
  clientFirstName?: string;
}) {
  const lenderDisplayName = pb.meta?.lenderDisplayName || "Lender";
  const branches = pb.section9_nearestBranches?.branches || [];

  // Branch selected in the map/list above (Section 10). Falls back to the
  // first branch when nothing is selected yet.
  const selectedBranch =
    (activeRank != null ? branches[activeRank - 1] : undefined) || branches[0];

  const clientDisplayName = (() => {
    if (clientFirstName) return clientFirstName;
    if (pb.meta?.clientName) return pb.meta.clientName;
    const id = pb.meta?.clientId?.trim();
    if (!id || (/^[a-zA-Z0-9_-]{15,}$/.test(id) && !id.includes(" ")))
      return "there";
    return id.split(" ")[0] || "there";
  })();

  const selectedBranchName = (() => {
    if (!selectedBranch?.name) return `${lenderDisplayName} — Local Branch`;
    const hasLender = selectedBranch.name
      .toLowerCase()
      .includes(lenderDisplayName.toLowerCase());
    const base = hasLender
      ? selectedBranch.name
      : `${lenderDisplayName} — ${selectedBranch.name}`;
    return selectedBranch.address ? `${base}, ${selectedBranch.address}` : base;
  })();

  const base = pb.booking || {
    available: true,
    primaryPhone:
      selectedBranch?.phone ||
      pb.section10_reconsiderationScript?.reconsiderationPhone ||
      "3523751161",
    primaryPhoneLabel:
      selectedBranch?.phone ||
      pb.section10_reconsiderationScript?.reconsiderationPhone ||
      "(352) 375-1161",
    branchName: selectedBranchName,
    onlineSchedulerUrl: selectedBranch?.googleMapsUrl || null,
    onlineSchedulerLabel: `Book with a ${lenderDisplayName} business banker`,
    bestTimeToCall:
      "Tuesday–Thursday, 10:00am–11:30am — lowest branch call volume",
    callScript: [
      `Hi, my name is ${clientDisplayName} — I've banked with ${lenderDisplayName} and want to discuss account options for my business.`,
      `I'd like to book 20 minutes with a business banker this week to review the ${pb.meta?.productDisplayName || "business card"} before I submit my application.`,
      `If the banker has any availability Tuesday through Thursday morning, that works best for me — and could you note on my profile that I came in through the business side?`,
    ],
    scriptGoal:
      "Goal of the call: get 20 minutes on the calendar with a business banker, not a general teller, and have them note your relationship before you apply.",
    unavailableNote: null,
  };

  // Booking details always follow the branch selected above. When a branch is
  // chosen, override the phone, label, name/address, and scheduler URL so the
  // displayed number and details track every card click.
  const b = {
    ...base,
    ...(selectedBranch
      ? {
          primaryPhone: selectedBranch.phone || base.primaryPhone,
          primaryPhoneLabel: selectedBranch.phone || base.primaryPhoneLabel,
          branchName: selectedBranchName,
          onlineSchedulerUrl:
            selectedBranch.googleMapsUrl || base.onlineSchedulerUrl,
        }
      : {}),
  };

  // Ensure raw UIDs in script lines are safely replaced with clean client display name
  const sanitizedCallScript = (b.callScript || []).map((line) =>
    line.replace(/\b[a-zA-Z0-9_-]{15,}\b/g, clientDisplayName),
  );

  const timeSlotChip = b.bestTimeToCall
    ? b.bestTimeToCall.split("—")[0].trim()
    : "Tuesday–Thursday, 10:00am–11:30am";

  return (
    <SectionCard
      n={9}
      id="booking"
      icon={CalendarClock}
      accent="brand"
      title="Reservation & Booking Assistance"
      subtitle="Call the branch, book the appointment, and know what to say"
      aside={
        <Chip tone="blue" icon={Clock}>
          {timeSlotChip}
        </Chip>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-blue-600/20 bg-blue-50/40 p-4 sm:p-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
              Call this number
            </div>
            <a
              href={formatPhoneHref(b.primaryPhone)}
              className="block font-mono text-[22px] sm:text-[28px] md:text-[32px] font-bold text-gray-900 tracking-tight leading-tight mt-2 hover:text-blue-700 transition-colors break-all sm:break-words"
            >
              {b.primaryPhoneLabel}
            </a>
            <p className="text-[12.5px] text-gray-600 mt-2 leading-snug">
              {b.branchName}
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 mt-4">
              <ActionButton
                href={formatPhoneHref(b.primaryPhone)}
                icon={PhoneCall}
                size="lg"
                className="w-full sm:w-auto flex-1 sm:flex-initial justify-center"
              >
                Tap to call
              </ActionButton>
              {b.onlineSchedulerUrl ? (
                <ActionButton
                  href={b.onlineSchedulerUrl}
                  external
                  variant="secondary"
                  icon={CalendarCheck}
                  size="lg"
                  className="w-full sm:w-auto flex-1 sm:flex-initial text-xs sm:text-sm text-center justify-center"
                >
                  {b.onlineSchedulerLabel || "Book with a business banker"}
                </ActionButton>
              ) : (
                <Chip tone="gray" icon={Info} className="self-center">
                  No online scheduler for this lender
                </Chip>
              )}
            </div>
          </div>

          {b.unavailableNote && (
            <RationaleBlock label="Note" tone="gray">
              {b.unavailableNote}
            </RationaleBlock>
          )}

          <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-3 sm:px-4">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-[12.5px] text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-800">
                Best time to call:
              </span>{" "}
              {b.bestTimeToCall}
            </p>
          </div>
        </div>

        <div>
          <ScriptBlock
            lines={sanitizedCallScript}
            goal={b.scriptGoal}
            label="3-sentence call script"
          />
        </div>
      </div>
    </SectionCard>
  );
}

// 11 — If You're Denied
const DENIAL_FREQUENCY_LABELS = [
  "Most common",
  "Common",
  "Occasional",
  "Less common",
];

const DENIAL_FIX_META: Record<
  CegRecommendation["service"],
  { header: string; label: string }
> = {
  tradelines: {
    header: "Denied for thin credit file",
    label: "CEG Tradelines",
  },
  credit_repair: {
    header: "Denied for derogatory marks",
    label: "CEG Credit Repair",
  },
  income_coaching: {
    header: "Denied for income verification or DTI",
    label: "CEG Income Coaching + Payroll Setup",
  },
  business_formation: {
    header: "Denied for weak business structure",
    label: "CEG Business Formation",
  },
};

function clampReconPct(n: number) {
  return Math.max(20, Math.min(90, Math.round(n)));
}

function reconOddsTone(pct: number) {
  if (pct >= 60) return { text: "text-emerald-600", bar: "bg-emerald-500" };
  if (pct >= 40) return { text: "text-amber-600", bar: "bg-amber-500" };
  return { text: "text-red-500", bar: "bg-red-500" };
}

export function DeniedSection({
  pb,
  clientFirstName,
}: {
  pb: Playbook;
  clientFirstName?: string;
}) {
  const d = pb.section7_denialPathReasoning;
  const recon = pb.section10_reconsiderationScript;
  const help = pb.section13_helpOptions;
  const recs = pb.section8_cegRecommendations?.recommendations || [];

  const lenderShortName = pb.meta?.lenderDisplayName || "Lender";
  const productName = pb.meta?.productDisplayName || "Product";

  const clientName = (() => {
    if (clientFirstName) return clientFirstName;
    if (pb.meta?.clientName) return pb.meta.clientName.split(" ")[0];
    return "you";
  })();

  const rawRate = d?.reconsiderationSuccessRateForProduct;
  const baseReconPct =
    typeof rawRate === "number"
      ? rawRate <= 1
        ? Math.round(rawRate * 100)
        : Math.round(rawRate)
      : 65;

  const combinedReasons = Array.from(
    new Set([
      ...(d?.lenderCommonDenialReasons || []),
      ...(d?.productSpecificDenialReasons || []),
    ]),
  );

  const clientRisks = d?.aiClientSpecificRisks || [];
  const mitigations = d?.aiMitigationSteps || [];

  // Build per-reason cards from this client's denial triggers, pairing each
  // with the AI mitigation step / client-specific risk as the "Your move"
  // guidance and deriving a per-reason recon-odds estimate from the product
  // base rate (higher-frequency reasons carry lower recovery odds).
  const reasonCards = combinedReasons.map((reason, idx) => {
    const frequencyLabel =
      DENIAL_FREQUENCY_LABELS[
        Math.min(idx, DENIAL_FREQUENCY_LABELS.length - 1)
      ];
    const odds = clampReconPct(baseReconPct + 6 - idx * 12);
    const move =
      mitigations[idx] ||
      clientRisks[idx] ||
      "Offer supporting documentation and ask the analyst for a manual review while on the call.";
    return { reason, frequencyLabel, odds, move };
  });

  const reversalsInTen = Math.max(
    1,
    Math.min(9, Math.round(baseReconPct / 10)),
  );

  const rawScript = recon?.aiPhoneScript || "";
  const scriptLines =
    rawScript
      .match(/[^.!?]+[.!?]+/g)
      ?.map((s) => s.trim())
      .filter(Boolean) || (rawScript ? [rawScript] : []);

  // CEG "fix the underlying issue" cards derived from this client's ranked
  // recommendations (Section 8).
  const uniqueFixRecommendations = recs
    .filter(
      (rec, index, recommendations) =>
        recommendations.findIndex(
          (candidate) => candidate.service === rec.service,
        ) === index,
    )
    .slice(0, 3);
  const fixCards = uniqueFixRecommendations.map((rec) => {
    const meta = DENIAL_FIX_META[rec.service];
    return {
      key: rec.service,
      header:
        meta?.header ||
        `Denied for ${rec.serviceLabel || rec.service.replace(/_/g, " ")}`,
      label:
        meta?.label ||
        `CEG ${rec.serviceLabel || rec.service.replace(/_/g, " ")}`,
      description: rec.aiApplicability,
    };
  });

  return (
    <SectionCard
      n={11}
      id="denied"
      icon={ShieldAlert}
      accent="danger"
      title="If You're Denied"
      subtitle="A six-step recovery path — most denials are reversible"
      aside={<Chip tone="amber">Reconsideration playbook</Chip>}
    >
      <div className="space-y-3">
        {/* Step 1 — read the denial letter */}
        <DenialStep
          n={1}
          title="Check your denial letter for the exact reason"
          icon={FileWarning}
        >
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {lenderShortName} sends an adverse-action letter by mail within 7–10
            days and often an email within 48 hours. Do not call reconsideration
            until you know the stated reason — the analyst will ask, and
            guessing wastes your one strong call.
          </p>
          <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11.5px] text-gray-600">
              Expect it in{" "}
              <span className="font-semibold text-gray-800">
                7–10 days by mail
              </span>{" "}
              · often 48 hours by email
            </span>
          </div>
        </DenialStep>

        {/* Step 2 — per-reason cards with recon odds + client move */}
        <DenialStep
          n={2}
          title={`Common denial reasons for ${lenderShortName} ${productName}`}
          icon={Layers}
        >
          {reasonCards.length > 0 ? (
            <div className="space-y-2.5">
              {reasonCards.map((card, idx) => {
                const tone = reconOddsTone(card.odds);
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-bold text-gray-900 leading-snug">
                          {card.reason}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {card.frequencyLabel}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className={cn(
                            "font-mono text-[16px] font-bold leading-none",
                            tone.text,
                          )}
                        >
                          {card.odds}%
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mt-1">
                          Recon odds
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", tone.bar)}
                        style={{ width: `${card.odds}%` }}
                      />
                    </div>

                    <p className="text-[12px] text-gray-600 mt-2.5 leading-relaxed">
                      <span className="font-semibold text-gray-800">
                        Your move:
                      </span>{" "}
                      {card.move}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12.5px] text-gray-500 italic">
              No denial triggers identified for this application.
            </p>
          )}
        </DenialStep>

        {/* Step 3 — call reconsideration */}
        <DenialStep
          n={3}
          title="Call the reconsideration department"
          icon={PhoneCall}
        >
          <div className="rounded-xl border-2 border-blue-600/20 bg-blue-50/40 p-4">
            <a
              href={formatPhoneHref(
                recon?.reconsiderationPhone || "1-800-555-0100",
              )}
              className="block font-mono text-[20px] sm:text-[26px] font-bold text-gray-900 tracking-tight leading-tight hover:text-blue-700 transition-colors break-all sm:break-words"
            >
              {recon?.reconsiderationPhone || "1-800-555-0100"}
            </a>
            {recon?.reconsiderationHours && (
              <p className="text-[11.5px] text-gray-600 mt-1.5">
                {recon.reconsiderationHours}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <ActionButton
                href={formatPhoneHref(
                  recon?.reconsiderationPhone || "1-800-555-0100",
                )}
                icon={PhoneCall}
                size="sm"
              >
                Tap to call reconsideration
              </ActionButton>
            </div>
          </div>
          <p className="text-[12px] text-gray-500 mt-2.5 leading-relaxed">
            CEG clients reverse roughly {reversalsInTen} in 10 {lenderShortName}{" "}
            {productName} denials on the first reconsideration call.
          </p>
          {recon?.reconsiderationTips && (
            <p className="text-[12px] text-gray-600 mt-1.5 leading-relaxed">
              <span className="font-semibold text-gray-800">Pro Tip:</span>{" "}
              {recon.reconsiderationTips}
            </p>
          )}
        </DenialStep>

        {/* Step 4 — reconsideration script */}
        <DenialStep
          n={4}
          title="Use this reconsideration script"
          icon={MessageCircle}
        >
          {scriptLines.length > 0 ? (
            <ScriptBlock
              lines={scriptLines}
              label={`${scriptLines.length}-sentence reconsideration script`}
              goal="Stay calm, be specific, and always offer a path the analyst can say yes to — a lower limit, a limit transfer, or documents you can send right now."
            />
          ) : (
            <p className="text-[12.5px] text-gray-500 italic">
              No personalized script generated for this application.
            </p>
          )}
        </DenialStep>

        {/* Step 5 — CEG fixes if recon fails */}
        <DenialStep
          n={5}
          title="If reconsideration fails — fix the underlying issue"
          icon={Wrench}
        >
          {fixCards.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {fixCards.map((card) => (
                <div
                  key={card.key}
                  className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col"
                >
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-gray-400">
                    {card.header}
                  </div>
                  <div className="text-[13.5px] font-bold text-blue-600 mt-1">
                    {card.label}
                  </div>
                  <p className="text-[12px] text-gray-600 mt-2 leading-relaxed flex-1">
                    {card.description}
                  </p>
                  <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-100">
                    <ActionButton
                      href={
                        card.key === "credit_repair"
                          ? "/client/credit-repair"
                          : card.key === "tradelines"
                            ? "/client/tradelines"
                            : "https://cegunited.com"
                      }
                      external={
                        card.key !== "credit_repair" &&
                        card.key !== "tradelines"
                      }
                      variant="ghost"
                      icon={ArrowUpRight}
                      size="sm"
                    >
                      Open
                    </ActionButton>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px] text-gray-500 italic">
              No CEG recommendations generated for this application.
            </p>
          )}
        </DenialStep>

        {/* Step 6 — talk to a coach */}
        <DenialStep n={6} title="Talk to a CEG coach" icon={Headphones} last>
          <div className="rounded-xl bg-gradient-to-r from-blue-900 to-[#2a4f7c] p-4 flex flex-col items-start gap-3">
            <div className="min-w-0 w-full">
              <p className="text-[13px] font-semibold text-white leading-snug">
                {help?.aiClosingNote ||
                  `A CEG coach will run the reconsideration call script with ${clientName} live, listen in, and tell you exactly what to say if the analyst pushes back.`}
              </p>
              <p className="text-[11.5px] text-white/70 mt-1">
                {help?.cegSupportPhone || "1-800-555-0100"} ·{" "}
                {help?.cegSupportEmail || "support@cegunited.com"}
              </p>
            </div>
            <ActionButton
              href={help?.scheduleConsultUrl || "https://cegunited.com"}
              external
              variant="secondary"
              icon={Headphones}
              size="lg"
              className="self-start"
            >
              Talk to a coach
            </ActionButton>
          </div>
        </DenialStep>
      </div>
    </SectionCard>
  );
}

function DenialStep({
  n,
  title,
  icon: Icon,
  children,
  last,
}: {
  n: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className="flex gap-3.5">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center font-mono text-[12px] font-bold">
          {n}
        </div>
        {!last && <div className="w-px flex-1 bg-gray-200 mt-1.5" />}
      </div>
      <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-4")}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <h3 className="text-[13.5px] font-bold text-gray-900 leading-snug">
            {title}
          </h3>
        </div>
        {children}
      </div>
    </div>
  );
}

// 12 — Improve Your Odds
const IMPROVER_ICON = {
  tradeline: Layers,
  repair: TrendingUp,
  income: GraduationCap,
  mentor: UserRound,
};

export function ImproveOddsSection({ pb }: { pb: Playbook }) {
  const resolveImproverHref = (imp: {
    title: string;
    cegProduct: string;
    icon: string;
    href?: string;
  }) => {
    if (imp.href && imp.href !== "https://cegunited.com") {
      return imp.href;
    }
    const combined = `${imp.title} ${imp.cegProduct}`.toLowerCase();
    if (combined.includes("credit monitoring")) {
      return "/client/my-credit";
    }
    if (
      imp.icon === "repair" ||
      combined.includes("credit repair") ||
      combined.includes("inquiry removal")
    ) {
      return "/client/credit-repair";
    }
    if (imp.icon === "tradeline" || combined.includes("tradeline")) {
      return "/client/tradelines";
    }
    return imp.href || "https://cegunited.com";
  };

  const improvers =
    pb.improvers && pb.improvers.length > 0
      ? pb.improvers
      : pb.section8_cegRecommendations.recommendations.map((rec, idx) => {
          const serviceName = rec.serviceLabel || rec.service.replace("_", " ");
          const isCreditMonitoring = serviceName
            .toLowerCase()
            .includes("credit monitoring");
          let href = "https://cegunited.com";
          if (isCreditMonitoring) {
            href = "/client/my-credit";
          } else if (rec.service === "credit_repair") {
            href = "/client/credit-repair";
          } else if (rec.service === "tradelines") {
            href = "/client/tradelines";
          }

          return {
            rank: rec.rank || idx + 1,
            title: `${serviceName} Strategy`,
            cegProduct: `CEG ${serviceName}`,
            description: rec.aiApplicability,
            impactScore: isCreditMonitoring
              ? "Monitoring only"
              : rec.curatedImpactEstimate,
            impactApproval: `+${rec.rank === 1 ? 35 : 20}% odds`,
            timeline: `${rec.estimatedTimeToImpactDays} days`,
            investment: "Program Service",
            ctaLabel: `Explore ${serviceName}`,
            href,
            icon: (rec.service === "tradelines"
              ? "tradeline"
              : rec.service === "income_coaching"
                ? "income"
                : rec.service === "business_formation"
                  ? "mentor"
                  : "repair") as "tradeline" | "repair" | "income" | "mentor",
          };
        });

  const lenderShortName = pb.meta.lenderDisplayName || "Lender";

  return (
    <SectionCard
      n={12}
      id="improve-odds"
      icon={TrendingUp}
      accent="success"
      title="Improve Your Odds"
      subtitle={`Ranked by impact on your ${lenderShortName} approval specifically`}
      aside={
        <Chip tone="green" icon={Sparkles}>
          {improvers.length} recommendations
        </Chip>
      }
    >
      <ul className="space-y-3">
        {improvers.map((imp, idx) => {
          const Icon = IMPROVER_ICON[imp.icon] || TrendingUp;
          return (
            <li
              key={`${imp.title}-${idx}`}
              className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-gray-300 transition-colors"
            >
              <div className="flex flex-wrap sm:flex-nowrap items-start gap-4 px-4 py-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[12px] font-bold",
                      imp.rank === 1
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-500",
                    )}
                  >
                    {imp.rank}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Icon className="w-[18px] h-[18px] text-blue-600" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[14px] font-bold text-gray-900 leading-snug">
                      {imp.title}
                    </h3>
                    {imp.rank === 1 && (
                      <Chip
                        tone="green"
                        className="!px-2 !py-0.5 !text-[9.5px]"
                      >
                        Highest impact
                      </Chip>
                    )}
                  </div>
                  <p className="text-[11.5px] font-semibold text-blue-600 mt-0.5">
                    {imp.cegProduct}
                  </p>
                  <p className="text-[12.5px] text-gray-600 mt-2 leading-relaxed">
                    {imp.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2.5 mt-3.5 pt-3.5 border-t border-gray-100">
                    <MetricCell
                      label="Score impact"
                      value={imp.impactScore}
                      tone="emerald"
                    />
                    <MetricCell
                      label="Approval lift"
                      value={imp.impactApproval}
                      tone="brand"
                    />
                    <MetricCell label="Timeline" value={imp.timeline} />
                    <MetricCell label="Investment" value={imp.investment} />
                  </div>
                </div>

                <div className="flex-shrink-0 w-full sm:w-auto sm:self-center">
                  {(() => {
                    const href = resolveImproverHref(imp);
                    return (
                      <ActionButton
                        href={href}
                        external={href.startsWith("http")}
                        icon={ArrowUpRight}
                        variant={imp.rank === 1 ? "success" : "secondary"}
                        className="w-full sm:w-auto"
                      >
                        {imp.ctaLabel}
                      </ActionButton>
                    );
                  })()}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

function MetricCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "brand";
}) {
  return (
    <div className="min-w-0">
      <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-gray-400 leading-none">
        {label}
      </div>
      <div
        className={cn(
          "text-[12px] font-semibold mt-1 leading-snug",
          tone === "emerald"
            ? "text-emerald-700"
            : tone === "brand"
              ? "text-blue-700"
              : "text-gray-700",
        )}
      >
        {value}
      </div>
    </div>
  );
}

// 13 — Need Help Now
export function NeedHelpSection({ pb }: { pb: Playbook }) {
  const h = pb.section13_helpOptions;

  return (
    <SectionCard
      n={13}
      id="need-help"
      icon={UserRound}
      accent="brand"
      title="Need Help Now"
      subtitle="CEG United advisor support options"
    >
      <div className="space-y-4">
        <RationaleBlock label="Advisor Closing Note" tone="brand">
          {h.aiClosingNote}
        </RationaleBlock>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <PhoneCall className="w-5 h-5 text-blue-600 mb-2" />
            <h4 className="text-[13px] font-bold text-gray-900">
              Support Phone
            </h4>
            <p className="text-[12px] font-mono text-gray-700 mt-1">
              {h.cegSupportPhone}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <Mail className="w-5 h-5 text-gray-600 mb-2" />
            <h4 className="text-[13px] font-bold text-gray-900">
              Support Email
            </h4>
            <p className="text-[12px] font-mono text-gray-700 mt-1 truncate">
              {h.cegSupportEmail}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col justify-between">
            <div>
              <UserRound className="w-5 h-5 text-gray-600 mb-2" />
              <h4 className="text-[13px] font-bold text-gray-900">
                Schedule Consultation
              </h4>
            </div>
            <ActionButton
              href={h.scheduleConsultUrl}
              external
              size="sm"
              className="mt-3"
            >
              Schedule
            </ActionButton>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
