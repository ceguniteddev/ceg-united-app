"use client";

import React from "react";
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";

export interface StatutoryClockProps {
  d0_mailedAt?: string | null;
  r_receivedAt?: string | null;
  f_furnisherNoticeDue?: string | null;
  c_investigationDue?: string | null;
  n_resultsDue?: string | null;
  od_overdueAt?: string | null;
  outcomeCode?: string | null;
  stage?: string;
}

export function StatutoryDeadlineBar({
  d0_mailedAt,
  r_receivedAt,
  f_furnisherNoticeDue,
  c_investigationDue,
  n_resultsDue,
  od_overdueAt,
  outcomeCode,
  stage = "S4_INVESTIGATION",
}: StatutoryClockProps) {
  const now = Date.now();

  const cDate = c_investigationDue ? new Date(c_investigationDue).getTime() : null;
  const nDate = n_resultsDue ? new Date(n_resultsDue).getTime() : null;

  const daysUntilDeadline = nDate
    ? Math.max(0, Math.ceil((nDate - now) / (1000 * 60 * 60 * 24)))
    : null;

  const isOverdue = nDate ? now > nDate : false;

  const steps = [
    { key: "D0", label: "Mailed", date: d0_mailedAt, sub: "Certified USPS" },
    { key: "R", label: "Delivered", date: r_receivedAt, sub: "Scan Confirmed" },
    { key: "F", label: "Furnisher", date: f_furnisherNoticeDue, sub: "5-Day Notice" },
    { key: "C", label: "Investigation", date: c_investigationDue, sub: "30-Day Window" },
    { key: "N", label: "Results Due", date: n_resultsDue, sub: "Statutory Law" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            FCRA 15 U.S.C. § 1681i Statutory Clock
          </span>
        </div>
        {outcomeCode === "V-CLEAR" || isOverdue ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            {isOverdue ? "Statutory Deadline Expired (R10)" : "FCRA Violation Detected (V-CLEAR)"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
            {daysUntilDeadline !== null ? `${daysUntilDeadline} Days Remaining` : "Clock Active"}
          </span>
        )}
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {steps.map((st, i) => {
          const hasPassed = st.date ? new Date(st.date).getTime() <= now : false;
          return (
            <div
              key={st.key}
              className={`p-2.5 rounded-lg border text-left ${
                hasPassed
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                  : "bg-gray-50 border-gray-200 text-gray-400"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                <span>{st.key}</span>
                {hasPassed && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              </div>
              <div className="text-xs font-semibold mt-0.5">{st.label}</div>
              <div className="text-[10px] text-gray-500 truncate">
                {st.date ? new Date(st.date).toLocaleDateString() : st.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
