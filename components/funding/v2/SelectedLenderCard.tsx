// ============================================
// SelectedLenderCard — Top-left lender summary
// ============================================
// Shows lender name, approval odds icon, and application ID

import { LenderLogo } from "./LenderLogo";
import { TrendingUp } from "lucide-react";
import type { ApprovedBankFormData } from "@/schema/bank-products";

interface SelectedLenderCardProps {
  lender: ApprovedBankFormData;
  applicationId: string;
}

export function SelectedLenderCard({
  lender,
  applicationId,
}: SelectedLenderCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center gap-3.5">
        <LenderLogo
          initial={lender.logoInitial || lender.bankName[0]}
          bgClass={lender.logoBg || "bg-blue-100"}
          colorClass={lender.logoColor || "text-blue-600"}
          size="lg"
        />
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-900">{lender.bankName}</h3>
          {/* <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm text-gray-500">
              Estimated Approval Odds
            </span>
            {lender.approvalOdds !== undefined && lender.approvalOdds > 0 && (
              <TrendingUp className="size-3.5 text-emerald-500" />
            )}
          </div> */}
        </div>
      </div>

      <div className="mt-3 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg inline-flex items-center">
        <span className="text-xs text-gray-500 font-medium">
          Application ID:{" "}
          <span className="text-gray-700 font-semibold">{applicationId}</span>
        </span>
      </div>
    </div>
  );
}
