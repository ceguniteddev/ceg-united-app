"use client";

import React from "react";
import { ArrowLeft, Printer, Sparkles } from "lucide-react";
import type { Playbook } from "@/types/funding-playbook";
import { ProgressRing } from "./ProgressRing";
import { LenderMark } from "./LenderMark";

export function PlaybookTopBar({
  pb,
  onBack,
}: {
  pb: Playbook;
  onBack?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 print:static print:bg-white">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-[62px] flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 h-9 px-2.5 -ml-1 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors flex-shrink-0 print:hidden"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[12.5px] font-medium hidden lg:block">
              Back
            </span>
          </button>
        )}

        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <LenderMark lenderId={pb.meta.lenderId} />
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold text-gray-900 tracking-tight whitespace-nowrap uppercase">
                {pb.meta.lenderId}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-[13.5px] font-semibold text-gray-700 truncate">
                {pb.meta.productId}
              </span>
            </div>
            <div className="text-[11px] text-gray-400 leading-tight truncate">
              Playbook ID: {pb.meta.id}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-blue-50 ring-1 ring-inset ring-blue-100 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-blue-600" />
          <span className="text-[10.5px] font-bold text-blue-700 tracking-wide">
            Model: {pb.meta.reasoningModel}
          </span>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex-shrink-0 print:hidden"
          title="Print or save as PDF"
        >
          <Printer className="w-4 h-4" />
          <span className="text-[12.5px] font-semibold hidden sm:block">
            Save PDF
          </span>
        </button>
      </div>
    </header>
  );
}

export function ClientIdentityBar({
  pb,
  clientName = "Client",
  clientZip = "",
}: {
  pb: Playbook;
  clientName?: string;
  clientZip?: string;
}) {
  return (
    <div className="bg-gradient-to-r from-blue-900 to-[#2a4f7c] text-white">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-white/15 ring-1 ring-white/25 flex items-center justify-center flex-shrink-0">
            <span className="text-[13px] font-bold tracking-tight">
              {clientName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-[14.5px] font-bold tracking-tight leading-tight truncate">
              {clientName}
            </div>
            <div className="text-[11.5px] text-white/70 leading-tight truncate">
              ZIP: {clientZip || pb.section9_nearestBranches.zip || "N/A"}
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="rounded-2xl bg-white/10 ring-1 ring-white/15 px-3.5 py-2">
            <ProgressRing
              pct={pb.section4_approvalEstimate.clientMeetsMinFICO ? 88 : 65}
              size={52}
              onDark
              label="Funding Readiness"
              sublabel={`Min FICO: ${pb.section4_approvalEstimate.minFICORequired}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
