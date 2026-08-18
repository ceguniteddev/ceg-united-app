"use client";

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import type { Playbook } from "@/types/funding-playbook";
import { useBankProductsQueryById } from "@/hooks/admin/bank-products";
import { PlaybookSkeleton } from "./PlaybookSkeleton";
import { ClientIdentityBar } from "./PlaybookHeader";
import { SectionRail, SectionAccordionNav, SECTIONS } from "./SectionNav";
import { BestMethodSection, BureauSection } from "./Sections1to4";
import {
  IncomeSection,
  HousingSection,
  ApprovalSection,
  DoubleDipSection,
  CegProductLiftSection,
} from "./Sections5to8";
import {
  BookingSection,
  BranchesSection,
  DeniedSection,
  ImproveOddsSection,
  NeedHelpSection,
} from "./Sections9to13";
import { StickyHelpBar } from "./StickyHelpBar";

export function FundingPlaybookView({
  playbook,
  isLoading = false,
  clientName,
  clientZip,
  selectedFundingPath,
}: {
  playbook: Playbook | null;
  isLoading?: boolean;
  clientName?: string;
  clientZip?: string;
  selectedFundingPath?: string;
}) {
  const [active, setActive] = useState(SECTIONS[0].id);
  const [activeBranchRank, setActiveBranchRank] = useState<number | null>(1);

  useEffect(() => {
    // The client layout uses a div with overflow-y-auto as the scroll
    // container (not window). Walk up from the first section element to
    // find the nearest scrollable ancestor.
    const findScrollParent = (
      node: HTMLElement | null,
    ): HTMLElement | Window => {
      let el = node?.parentElement ?? null;
      while (el) {
        const style = getComputedStyle(el);
        if (/(auto|scroll)/.test(style.overflowY)) return el;
        el = el.parentElement;
      }
      return window;
    };

    const firstSection = document.getElementById(SECTIONS[0].id);
    const scrollContainer = findScrollParent(firstSection);

    const onScroll = () => {
      const threshold = 180;
      let current = SECTIONS[0].id;

      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= threshold) {
          current = s.id;
        }
      }

      setActive(current);
    };

    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scrollContainer.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading || !playbook) {
    return <PlaybookSkeleton lenderId={playbook?.meta.lenderId ?? "chase"} />;
  }

  const { products: bankProductData } = useBankProductsQueryById(
    playbook.meta.productId,
  );

  const lenderName =
    playbook.meta.lenderDisplayName ||
    bankProductData?.bankName ||
    playbook.meta.lenderId;

  const productName =
    playbook.meta.productDisplayName ||
    bankProductData?.products?.[0]?.productName ||
    (bankProductData as any)?.displayName ||
    playbook.meta.productId;

  const fullTitle = productName.toLowerCase().includes(lenderName.toLowerCase())
    ? productName
    : `${lenderName} ${productName}`;

  const rawClientName = clientName || playbook.meta.clientName;
  const clientFirstName = (() => {
    if (!rawClientName) return "there";
    const trimmed = rawClientName.trim();
    if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed) && !trimmed.includes(" "))
      return "there";
    const first = trimmed.split(" ")[0];
    if (/^[a-zA-Z0-9_-]{15,}$/.test(first)) return "there";
    return first || "there";
  })();

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50">
      <ClientIdentityBar
        pb={playbook}
        clientName={clientName}
        clientZip={clientZip}
        selectedFundingPath={selectedFundingPath}
      />

      <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 pt-5 pb-10">
        <SectionAccordionNav active={active} />

        <div className="flex gap-7 mt-3 lg:mt-1">
          <SectionRail active={active} />

          <div className="flex-1 min-w-0 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                  YOUR FUNDING PLAYBOOK
                </div>
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>CEG BRAIN</span>
                </div>
              </div>

              <h1 className="text-[20px] sm:text-[23px] font-bold text-gray-900 tracking-tight leading-tight mt-1.5">
                {fullTitle}
              </h1>

              <p className="text-[13px] text-gray-600 mt-2.5 leading-relaxed">
                {`${clientFirstName}, this is built for you specifically — not a generic guide. Every number below comes from your credit file, your income, and ${lenderName}'s actual underwriting behavior on this product. Work through the 13 sections in order, then apply using the link in Section 02.`}
              </p>
            </div>

            <BestMethodSection pb={playbook} />
            {/* <RelationshipSection pb={playbook} /> */}
            {/* <BankingRequirementSection pb={playbook} /> */}
            <BureauSection pb={playbook} />
            <IncomeSection pb={playbook} />
            <HousingSection pb={playbook} />
            <ApprovalSection pb={playbook} />
            <DoubleDipSection pb={playbook} />
            <CegProductLiftSection pb={playbook} />
            <BranchesSection
              pb={playbook}
              activeRank={activeBranchRank}
              onSelect={setActiveBranchRank}
            />
            <BookingSection
              pb={playbook}
              activeRank={activeBranchRank}
              clientFirstName={clientFirstName}
            />
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
    </div>
  );
}
