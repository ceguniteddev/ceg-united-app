import React, { useState } from "react";
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
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { Playbook } from "@/types/funding-playbook";
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
export function BranchesSection({ pb }: { pb: Playbook }) {
  const b = pb.section9_nearestBranches;
  const [active, setActive] = useState<number | null>(1);

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
          activeRank={active}
          onSelect={setActive}
        />
      </div>
    </SectionCard>
  );
}

// 09 — Reservation & Booking Assistance
export function BookingSection({ pb }: { pb: Playbook }) {
  const lenderDisplayName = pb.meta?.lenderDisplayName || "Lender";
  const firstBranch = pb.section9_nearestBranches?.branches?.[0];

  const clientDisplayName = (() => {
    if (pb.meta?.clientName) return pb.meta.clientName;
    const id = pb.meta?.clientId?.trim();
    if (!id || (/^[a-zA-Z0-9_-]{15,}$/.test(id) && !id.includes(" ")))
      return "Client";
    return id.split(" ")[0] || "Client";
  })();

  const defaultBranchName = (() => {
    if (!firstBranch?.name) return `${lenderDisplayName} — Local Branch`;
    const hasLender = firstBranch.name
      .toLowerCase()
      .includes(lenderDisplayName.toLowerCase());
    const base = hasLender
      ? firstBranch.name
      : `${lenderDisplayName} — ${firstBranch.name}`;
    return firstBranch.address ? `${base}, ${firstBranch.address}` : base;
  })();

  const b = pb.booking || {
    available: true,
    primaryPhone:
      firstBranch?.phone ||
      pb.section10_reconsiderationScript?.reconsiderationPhone ||
      "3523751161",
    primaryPhoneLabel:
      firstBranch?.phone ||
      pb.section10_reconsiderationScript?.reconsiderationPhone ||
      "(352) 375-1161",
    branchName: defaultBranchName,
    onlineSchedulerUrl: firstBranch?.googleMapsUrl || null,
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
              className="block font-mono text-[24px] sm:text-[28px] md:text-[32px] font-bold text-gray-900 tracking-tight leading-none mt-2 hover:text-blue-700 transition-colors break-words"
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
export function DeniedSection({ pb }: { pb: Playbook }) {
  const d = pb.section7_denialPathReasoning;
  const recon = pb.section10_reconsiderationScript;
  const timing = pb.section11_timingStrategy;
  const help = pb.section13_helpOptions;

  const lenderShortName = pb.meta?.lenderDisplayName || "Lender";
  const productName = pb.meta?.productDisplayName || "Product";

  const rawRate = d?.reconsiderationSuccessRateForProduct;
  const reconRatePct =
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

  const rawScript = recon?.aiPhoneScript || "";
  const scriptLines =
    rawScript
      .match(/[^.!?]+[.!?]+/g)
      ?.map((s) => s.trim())
      .filter(Boolean) || (rawScript ? [rawScript] : []);

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
        {/* Step 1 */}
        <DenialStep
          n={1}
          title="Check your adverse action notice for exact reasons"
          icon={FileWarning}
        >
          <p className="text-[13px] text-gray-600 leading-relaxed">
            By law under Regulation B, lenders must issue an Adverse Action
            Notice detailing the principal reasons for a decline or counteroffer
            within 30 days. Review the letter upon arrival to confirm which
            credit factors triggered the decision.
          </p>
        </DenialStep>

        {/* Step 2 */}
        <DenialStep
          n={2}
          title={`Common denial factors & risks for ${lenderShortName} ${productName}`}
          icon={Layers}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-3">
              <div className="text-[12px] font-semibold text-gray-700">
                Typical reconsideration success rate on this product
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[16px] font-bold text-emerald-600">
                  {reconRatePct}%
                </span>
                <Chip tone="green" className="!px-1.5 !py-0.5 !text-[9.5px]">
                  Recon Odds
                </Chip>
              </div>
            </div>

            {combinedReasons.length > 0 && (
              <div>
                <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Lender & Product Denial Triggers
                </h4>
                <ul className="space-y-1.5">
                  {combinedReasons.map((reason, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-[12.5px] text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {clientRisks.length > 0 && (
              <div>
                <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Your Profile Specific Risks
                </h4>
                <ul className="space-y-1.5">
                  {clientRisks.map((risk, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-[12.5px] text-gray-700 bg-red-50/50 border border-red-100 rounded-lg px-3 py-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DenialStep>

        {/* Step 3 */}
        <DenialStep
          n={3}
          title="Fix underlying issues & application timing"
          icon={Wrench}
        >
          <div className="space-y-3">
            {mitigations.length > 0 && (
              <ul className="space-y-1.5">
                {mitigations.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-[12.5px] text-gray-700 bg-emerald-50/40 border border-emerald-100 rounded-lg px-3 py-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}

            {timing?.aiTimingRationale && (
              <RationaleBlock label="Timing Strategy" tone="brand">
                {timing.aiTimingRationale}
              </RationaleBlock>
            )}

            {timing?.threeDayRuleNotes && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
                <h4 className="text-[12px] font-bold text-amber-900">
                  3-Day Velocity Rule Notes
                </h4>
                <p className="text-[12px] text-amber-800 mt-1 leading-relaxed">
                  {timing.threeDayRuleNotes}
                </p>
              </div>
            )}
          </div>
        </DenialStep>

        {/* Step 4 */}
        <DenialStep
          n={4}
          title="Call the reconsideration department"
          icon={PhoneCall}
        >
          <div className="rounded-xl border-2 border-blue-600/20 bg-blue-50/40 p-4">
            <a
              href={formatPhoneHref(
                recon?.reconsiderationPhone || "1-800-555-0100",
              )}
              className="font-mono text-[22px] sm:text-[26px] font-bold text-gray-900 tracking-tight leading-none hover:text-blue-700 transition-colors"
            >
              {recon?.reconsiderationPhone || "1-800-555-0100"}
            </a>
            {recon?.reconsiderationHours && (
              <p className="text-[11.5px] text-gray-600 mt-1.5">
                Hours: {recon.reconsiderationHours}
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
          {recon?.reconsiderationTips && (
            <p className="text-[12px] text-gray-600 mt-2.5 leading-relaxed">
              <span className="font-semibold text-gray-800">Pro Tip:</span>{" "}
              {recon.reconsiderationTips}
            </p>
          )}
        </DenialStep>

        {/* Step 5 */}
        <DenialStep
          n={5}
          title="Use this reconsideration script"
          icon={MessageCircle}
        >
          {scriptLines.length > 0 ? (
            <ScriptBlock
              lines={scriptLines}
              label="Reconsideration Call Script"
              goal="Goal: Stay calm, be specific, and highlight your existing relationship, deposit history, or compensating factors."
            />
          ) : (
            <p className="text-[12.5px] text-gray-500 italic">
              No personalized script generated for this application.
            </p>
          )}
        </DenialStep>

        {/* Step 6 */}
        <DenialStep
          n={6}
          title="Talk to a CEG coach before reapplying"
          icon={Headphones}
          last
        >
          <div className="rounded-xl bg-gradient-to-r from-blue-900 to-[#2a4f7c] p-4 flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white leading-snug">
                {help?.aiClosingNote ||
                  "Our funding strategists can review your file and help present your compensating factors to underwriting."}
              </p>
              <p className="text-[11.5px] text-white/70 mt-1">
                Support: {help?.cegSupportPhone || "1-800-555-0100"} ·{" "}
                {help?.cegSupportEmail || "support@cegunited.com"}
              </p>
            </div>
            {help?.scheduleConsultUrl && (
              <ActionButton
                href={help.scheduleConsultUrl}
                external
                variant="secondary"
                icon={Headphones}
                size="lg"
              >
                Talk to a coach
              </ActionButton>
            )}
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
  const improvers =
    pb.improvers && pb.improvers.length > 0
      ? pb.improvers
      : pb.section8_cegRecommendations.recommendations.map((rec, idx) => ({
          rank: rec.rank || idx + 1,
          title: `${rec.serviceLabel || rec.service.replace("_", " ")} Strategy`,
          cegProduct: `CEG ${rec.serviceLabel || rec.service.replace("_", " ")}`,
          description: rec.aiApplicability,
          impactScore: rec.curatedImpactEstimate,
          impactApproval: `+${rec.rank === 1 ? 35 : 20}% odds`,
          timeline: `${rec.estimatedTimeToImpactDays} days`,
          investment: "Program Service",
          ctaLabel: `Explore ${rec.serviceLabel || rec.service.replace("_", " ")}`,
          href: "https://cegunited.com",
          icon: (rec.service === "tradelines"
            ? "tradeline"
            : rec.service === "income_coaching"
              ? "income"
              : rec.service === "business_formation"
                ? "mentor"
                : "repair") as "tradeline" | "repair" | "income" | "mentor",
        }));

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
                  <ActionButton
                    href={imp.href}
                    external={imp.href.startsWith("http")}
                    icon={ArrowUpRight}
                    variant={imp.rank === 1 ? "success" : "secondary"}
                    className="w-full sm:w-auto"
                  >
                    {imp.ctaLabel}
                  </ActionButton>
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
