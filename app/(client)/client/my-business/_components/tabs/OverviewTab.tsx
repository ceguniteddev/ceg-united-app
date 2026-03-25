"use client";
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Link2,
} from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { Business, AuditItem } from "@/schema";

interface Props {
  business: Business;
  auditItems: AuditItem[];
  fundabilityScore?: number;
  fundabilityStatus?: string;
}

export function OverviewTab({
  business,
  auditItems,
  fundabilityScore = 0,
  fundabilityStatus = "—",
}: Props) {
  const score = useCountUp(fundabilityScore, 1400);
  const circumference = 2 * Math.PI * 45;
  const progress = (fundabilityScore / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 animate-fade-in">
      {/* Left: Audit Report */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">
            Business Finance Audit Report
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <button className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {auditItems.length === 0 ? (
          <div className="py-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No audit items available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {auditItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3 px-4 bg-white rounded-xl border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {item.status === "verified" ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  ) : item.status === "warning" ? (
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="text-sm font-semibold text-gray-900 sm:min-w-[180px]">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 flex-1 pl-7 sm:pl-0">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600 truncate">
                      {item.value}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {item.status === "verified" ? (
                      <>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          ✓ Verified
                        </span>
                        {item.checkable && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            ✓ Checked
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        ⚠ {item.statusLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Fundability Score + Tradeline CTA */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col items-center">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">📊</span> Fundability Score
          </h4>

          <div className="relative w-[130px] h-[130px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                className="stroke-emerald-100"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className="stroke-emerald-400"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 1.4s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 leading-none">
                {score}
              </span>
            </div>
          </div>

          <span className="mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            {fundabilityStatus}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-600" />
            Tradeline Suggestions
          </h4>
          <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors">
            <span>+ Add to your report</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
