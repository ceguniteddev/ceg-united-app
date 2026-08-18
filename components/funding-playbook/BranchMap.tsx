"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Navigation, Phone, Building2 } from "lucide-react";
import type { Branch } from "@/types/funding-playbook";
import {
  estimateDriveMinutes,
  formatHoursSummary,
  formatPhoneHref,
  getDirectionsUrl,
  getOpenStatus,
} from "./branch-utils";

const BranchLeafletMap = dynamic(() => import("./BranchLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] sm:h-[400px] rounded-2xl bg-gray-100 border border-gray-200 animate-pulse flex items-center justify-center text-xs text-gray-400 font-medium">
      Loading map location...
    </div>
  ),
});

export function BranchMap({
  branches,
  activeRank,
  onSelect,
}: {
  branches: Branch[];
  activeRank: number | null;
  onSelect: (rank: number) => void;
}) {
  if (!branches || branches.length === 0) {
    return (
      <div className="h-[240px] w-full rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center text-xs text-gray-500 space-y-2 p-6">
        <Building2 className="w-8 h-8 text-gray-300" />
        <p className="font-medium text-gray-600">
          No branches found near this location
        </p>
        <p className="text-[11px] text-gray-400">
          Try expanding your search radius or apply online directly.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 space-y-3 print:hidden shadow-xs">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
          NEARBY BRANCH LOCATIONS ({branches.length})
        </span>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Interactive Leaflet Map */}
        <div className="lg:col-span-7 w-full">
          <BranchLeafletMap
            branches={branches}
            activeRank={activeRank}
            onSelect={onSelect}
          />
        </div>

        {/* Right Column: Scrollable Branch List */}
        <div className="lg:col-span-5 w-full max-h-[360px] sm:max-h-[400px] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {branches.map((b, idx) => {
            const rank = idx + 1;
            const isActive = activeRank === rank;
            const driveMins = estimateDriveMinutes(b.distanceMiles);
            const hoursSummary = formatHoursSummary(b.hours);
            const openStatus = getOpenStatus(b.openNow, b.hours);
            const directionsUrl = getDirectionsUrl(b);

            return (
              <div
                key={b.placeId || idx}
                onClick={() => onSelect(rank)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isActive
                    ? "border-blue-500 bg-blue-50/20 ring-1 ring-blue-300 shadow-xs"
                    : "border-gray-200/90 bg-white hover:border-gray-300 hover:bg-gray-50/60"
                }`}
              >
                {/* Top row: badge + name vs distance */}
                <div className="flex items-start gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {rank}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-[13px] font-bold text-gray-900 leading-snug truncate">
                        {b.name}
                      </h4>
                      <span className="font-mono text-xs font-bold text-blue-700 shrink-0">
                        {b.distanceMiles} mi
                      </span>
                    </div>

                    <p className="text-[11.5px] text-gray-500 mt-0.5 truncate">
                      {b.address}
                    </p>
                  </div>
                </div>

                {/* Middle row: phone, drive time */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-gray-500">
                  {b.phone && (
                    <a
                      href={formatPhoneHref(b.phone)}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-mono font-medium"
                    >
                      <Phone className="w-3 h-3" /> {b.phone}
                    </a>
                  )}

                  <span className="text-gray-400 font-mono text-[11px]">
                    {driveMins} min
                  </span>
                </div>

                {/* Hours summary */}
                <div className="mt-1.5 text-[11px] text-gray-500 font-normal">
                  {hoursSummary}
                </div>

                {/* Bottom row: Open status & Directions link */}
                <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11.5px]">
                  <span
                    className={`font-medium ${
                      openStatus.isOpen ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {openStatus.label}
                  </span>

                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline ml-auto"
                  >
                    <Navigation className="w-3 h-3" /> Get directions
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
