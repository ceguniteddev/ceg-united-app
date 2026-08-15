"use client";

import React from "react";
import { MapPin, Navigation, Phone } from "lucide-react";
import type { Branch } from "@/types/funding-playbook";

export function BranchMap({
  branches,
  activeRank,
  onSelect,
}: {
  branches: Branch[];
  activeRank: number | null;
  onSelect: (rank: number) => void;
}) {
  if (branches.length === 0) {
    return (
      <div className="h-[300px] w-full rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-xs text-gray-500">
        No branches found near this location
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-4 space-y-3 print:hidden">
      <div className="flex items-center justify-between border-b pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-blue-600" /> Nearby Branch
          Locations ({branches.length})
        </span>
      </div>

      <div className="space-y-2">
        {branches.map((b, idx) => {
          const rank = idx + 1;
          const isActive = activeRank === rank;
          return (
            <div
              key={b.placeId || idx}
              onClick={() => onSelect(rank)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                isActive
                  ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    #{rank} {b.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {b.address}
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-blue-700">
                  {b.distanceMiles} mi
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3 text-[11px]">
                {b.phone && (
                  <a
                    href={`tel:${b.phone}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline font-mono"
                  >
                    <Phone className="w-3 h-3" /> {b.phone}
                  </a>
                )}
                {b.googleMapsUrl && (
                  <a
                    href={b.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline ml-auto"
                  >
                    <Navigation className="w-3 h-3" /> Directions
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
