"use client";
import { CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Business, AuditItem } from "@/schema";
import { FundabilityScoreCard } from "@/components/dashboard/FundabilityScoreCard";

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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 sm:gap-6 animate-fade-in">
      {/* Left: Audit Report */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-bold text-gray-900">
            Business Finance Audit Report
          </h3>
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

      {/* Right: Fundability Score */}
      <div className="space-y-4">
        <FundabilityScoreCard
          score={fundabilityScore}
          maxScore={100}
          status={fundabilityStatus}
          className="shadow-sm p-5"
        />
      </div>
    </div>
  );
}
