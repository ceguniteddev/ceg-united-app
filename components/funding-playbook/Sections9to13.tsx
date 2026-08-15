import React, { useState } from "react";
import {
  CalendarClock,
  PhoneCall,
  MapPin,
  Clock,
  ShieldAlert,
  Wrench,
  Headphones,
  TrendingUp,
  UserRound,
  Mail,
  HelpCircle,
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

// 09 — Nearest Branches
export function BookingSection({ pb }: { pb: Playbook }) {
  const b = pb.section9_nearestBranches;
  const [active, setActive] = useState<number | null>(1);

  return (
    <SectionCard
      n={9}
      id="booking"
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

// 10 — Reconsideration Script & Phone
export function BranchesSection({ pb }: { pb: Playbook }) {
  const r = pb.section10_reconsiderationScript;

  return (
    <SectionCard
      n={10}
      id="branches"
      icon={PhoneCall}
      accent="brand"
      title="Phone Reconsideration Script & Contacts"
      subtitle="What to say when calling the lender's reconsideration line"
      aside={<Chip tone="amber">{r.reconsiderationPhone}</Chip>}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-blue-600/20 bg-blue-50/40 p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
            Reconsideration Phone Number
          </div>
          <a
            href={`tel:${r.reconsiderationPhone}`}
            className="block font-mono text-[28px] font-bold text-gray-900 tracking-tight leading-none mt-2 hover:text-blue-700 transition-colors"
          >
            {r.reconsiderationPhone}
          </a>
          <p className="text-[12px] text-gray-600 mt-2">
            Hours: {r.reconsiderationHours}
          </p>
        </div>

        <ScriptBlock
          lines={[r.aiPhoneScript]}
          label="Personalized Reconsideration Script"
          goal="Read this 4-sentence script nearly verbatim when speaking with an analyst."
        />

        <RationaleBlock label="Reconsideration Tips" tone="amber">
          {r.reconsiderationTips}
        </RationaleBlock>
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

// 12 — Alternatives
export function ImproveOddsSection({ pb }: { pb: Playbook }) {
  const a = pb.section12_alternatives;

  return (
    <SectionCard
      n={12}
      id="improve-odds"
      icon={TrendingUp}
      accent="brand"
      title="Alternative Products"
      subtitle="Backup or alternative products at this lender"
    >
      <div className="space-y-3">
        {a.alternatives.length === 0 ? (
          <p className="text-[12.5px] text-gray-500 italic">
            No alternative products specified for this path.
          </p>
        ) : (
          a.alternatives.map((alt, idx) => (
            <div
              key={`${alt.productId}-${idx}`}
              className="rounded-xl border border-gray-200 p-3.5 bg-white"
            >
              <h4 className="text-[13px] font-bold text-gray-900">
                {alt.displayName}
              </h4>
              <p className="text-[12px] text-gray-600 mt-1">
                {alt.whyConsidered}
              </p>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

// 13 — Help Options
export function NeedHelpSection({ pb }: { pb: Playbook }) {
  const h = pb.section13_helpOptions;

  return (
    <SectionCard
      n={13}
      id="need-help"
      icon={Headphones}
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
