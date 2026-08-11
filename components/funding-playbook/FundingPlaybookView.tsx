"use client";

import React, { useState, useEffect } from "react";
import type { Playbook } from "@/types/funding-playbook";
import { PlaybookSkeleton } from "./PlaybookSkeleton";
import { PlaybookTopBar, ClientIdentityBar } from "./PlaybookHeader";
import { SectionRail, SectionAccordionNav, SECTIONS } from "./SectionNav";
import {
  BestMethodSection,
  RelationshipSection,
  BankingRequirementSection,
  BureauSection,
} from "./Sections1to4";
import {
  IncomeSection,
  HousingSection,
  ApprovalSection,
  DoubleDipSection,
} from "./Sections5to8";
import {
  BookingSection,
  BranchesSection,
  DeniedSection,
  ImproveOddsSection,
  NeedHelpSection,
} from "./Sections9to13";
import { StickyHelpBar, ChatWidget } from "./StickyHelpBar";

export function FundingPlaybookView({
  playbook,
  isLoading = false,
  clientName,
  clientZip,
  onBack,
}: {
  playbook: Playbook | null;
  isLoading?: boolean;
  clientName?: string;
  clientZip?: string;
  onBack?: () => void;
}) {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const onScroll = () => {
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 180) current = s.id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading || !playbook) {
    return <PlaybookSkeleton lenderId={playbook?.meta.lenderId ?? "chase"} />;
  }

  const generatedDate = new Date(playbook.meta.generatedAt).toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50">
      <PlaybookTopBar pb={playbook} onBack={onBack} />
      <ClientIdentityBar
        pb={playbook}
        clientName={clientName}
        clientZip={clientZip}
      />

      <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 pt-5 pb-10">
        <SectionAccordionNav active={active} />

        <div className="flex gap-7 mt-3 lg:mt-1">
          <SectionRail active={active} />

          <div className="flex-1 min-w-0 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 py-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                Your Personalized Strategy Playbook
              </div>
              <h1 className="text-[20px] sm:text-[23px] font-bold text-gray-900 tracking-tight leading-tight mt-1.5 uppercase">
                {playbook.meta.lenderId} — {playbook.meta.productId}
              </h1>
              <p className="text-[13px] text-gray-600 mt-2.5 leading-relaxed">
                This strategy playbook is generated specifically from your
                credit reports, income profile, and curated lender data.
              </p>
              <div className="mt-3 text-[11.5px] text-gray-400 font-mono">
                Generated: {generatedDate} · Model:{" "}
                {playbook.meta.reasoningModel}
              </div>
            </div>

            <BestMethodSection pb={playbook} />
            <RelationshipSection pb={playbook} />
            <BankingRequirementSection pb={playbook} />
            <BureauSection pb={playbook} />
            <IncomeSection pb={playbook} />
            <HousingSection pb={playbook} />
            <ApprovalSection pb={playbook} />
            <DoubleDipSection pb={playbook} />
            <BookingSection pb={playbook} />
            <BranchesSection pb={playbook} />
            <DeniedSection pb={playbook} />
            <ImproveOddsSection pb={playbook} />
            <NeedHelpSection pb={playbook} />

            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                This playbook is personalized guidance prepared by CEG United
                and is not a formal credit decision or offer of credit.
              </p>
            </div>
          </div>
        </div>
      </main>

      <StickyHelpBar pb={playbook} />
      <ChatWidget pb={playbook} />
    </div>
  );
}
