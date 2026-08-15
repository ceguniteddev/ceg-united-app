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
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// 08 — Nearest Branches
export function BranchesSection({ pb }: { pb: Playbook }) {
  const b = pb.section9_nearestBranches;
  const [active, setActive] = useState<number | null>(1);

  return (
    <SectionCard
      n={8}
      id="branches"
      icon={MapPin}
      accent="brand"
      title="Nearest Branch Locations"
      subtitle="Google Places 5 nearest branch locations"
      aside={<Chip tone="blue">Sorted by distance</Chip>}
    >
      <div className="space-y-4">
        <BranchMap
          branches={b.branches}
          activeRank={active}
          onSelect={setActive}
        />
      </div>
    </SectionCard>
  );
}

// 09 — Reservation & Booking Assistance
export function BookingSection({ pb }: { pb: Playbook }) {
  const b = pb.booking || {
    available: true,
    primaryPhone:
      pb.section9_nearestBranches?.branches?.[0]?.phone ||
      pb.section10_reconsiderationScript?.reconsiderationPhone ||
      "3523751161",
    primaryPhoneLabel:
      pb.section9_nearestBranches?.branches?.[0]?.phone ||
      pb.section10_reconsiderationScript?.reconsiderationPhone ||
      "(352) 375-1161",
    branchName: pb.section9_nearestBranches?.branches?.[0]?.name
      ? `${pb.meta?.lenderDisplayName || "Lender"} — ${pb.section9_nearestBranches.branches[0].name}, ${pb.section9_nearestBranches.branches[0].address}`
      : `${pb.meta?.lenderDisplayName || "Lender"} — Local Branch`,
    onlineSchedulerUrl:
      pb.section9_nearestBranches?.branches?.[0]?.googleMapsUrl || null,
    onlineSchedulerLabel: `Book with a ${pb.meta?.lenderDisplayName || "Lender"} business banker`,
    bestTimeToCall:
      "Tuesday–Thursday, 10:00am–11:30am — lowest branch call volume",
    callScript: [
      `Hi, my name is ${pb.meta?.clientId || "Client"} — I've banked with ${pb.meta?.lenderDisplayName || "Lender"} and want to discuss account options for my business.`,
      `I'd like to book 20 minutes with a business banker this week to review the ${pb.meta?.productDisplayName || "business card"} before I submit my application.`,
      `If the banker has any availability Tuesday through Thursday morning, that works best for me — and could you note on my profile that I came in through the business side?`,
    ],
    scriptGoal:
      "Goal of the call: get 20 minutes on the calendar with a business banker, not a general teller, and have them note your relationship before you apply.",
    unavailableNote: null,
  };

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
          <div className="rounded-2xl border-2 border-blue-600/20 bg-blue-50/40 px-5 py-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
              Call this number
            </div>
            <a
              href={`tel:${b.primaryPhone.replace(/[^\d+]/g, "")}`}
              className="block font-mono text-[28px] sm:text-[32px] font-bold text-gray-900 tracking-tight leading-none mt-2 hover:text-blue-700 transition-colors"
            >
              {b.primaryPhoneLabel}
            </a>
            <p className="text-[12.5px] text-gray-600 mt-2 leading-snug">
              {b.branchName}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <ActionButton
                href={`tel:${b.primaryPhone.replace(/[^\d+]/g, "")}`}
                icon={PhoneCall}
                size="lg"
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

          <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
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
            lines={b.callScript}
            goal={b.scriptGoal}
            label="3-sentence call script"
          />
        </div>
      </div>
    </SectionCard>
  );
}

// 11 — Timing Strategy
export function DeniedSection({ pb }: { pb: Playbook }) {
  const t = pb.section11_timingStrategy;

  return (
    <SectionCard
      n={11}
      id="denied"
      icon={CalendarClock}
      accent="brand"
      title="Timing & Application Sequencing"
      subtitle="Best timing and application order to maximize approval"
    >
      <div className="space-y-4">
        <RationaleBlock label="Timing Rationale" tone="brand">
          {t.aiTimingRationale}
        </RationaleBlock>

        {t.threeDayRuleNotes && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <h4 className="text-[12.5px] font-bold text-amber-900">
              3-Day Velocity Rule Notes
            </h4>
            <p className="text-[12px] text-amber-800 mt-1 leading-relaxed">
              {t.threeDayRuleNotes}
            </p>
          </div>
        )}
      </div>
    </SectionCard>
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
