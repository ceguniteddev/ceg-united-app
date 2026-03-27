// ============================================
// CreditBuilderSection — Credit builder accounts display
// ============================================
// Shows personal or business credit builder accounts
// with details, fees, and Learn More links.

import {
  User,
  Building2,
  ExternalLink,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CreditBuilderAccount } from "@/types/tradelines";

interface CreditBuilderSectionProps {
  accounts: CreditBuilderAccount[];
  type: "personal" | "business";
}

export function CreditBuilderSection({
  accounts,
  type,
}: CreditBuilderSectionProps) {
  const Icon = type === "personal" ? User : Building2;
  const title =
    type === "personal"
      ? "Personal Credit Builder Accounts"
      : "Business Credit Builder Accounts";
  const description =
    type === "personal"
      ? "Build your personal credit profile with these recommended accounts"
      : "Establish and grow your business credit with vendor accounts";

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-10 h-10 rounded-xl ${
            type === "personal"
              ? "bg-blue-50 border-blue-100"
              : "bg-emerald-50 border-emerald-100"
          } border flex items-center justify-center`}
        >
          <Icon
            className={`w-5 h-5 ${type === "personal" ? "text-blue-600" : "text-emerald-600"}`}
          />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 md:text-lg">
            {title}
          </h3>
          <p className="text-xs text-gray-500 md:text-sm">{description}</p>
        </div>
      </div>

      {/* Accounts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
          >
            {/* Recommended badge */}
            {account.recommended && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full z-10">
                <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-700">
                  Recommended
                </span>
              </div>
            )}

            <div className="p-5">
              {/* Header */}
              <div className="mb-4">
                <h4 className="text-base font-semibold text-gray-900 mb-1 pr-20">
                  {account.name}
                </h4>
                <p className="text-xs text-gray-500">{account.provider}</p>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {account.description}
              </p>

              {/* Key details */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Credit Range
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {account.creditLimitRange}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Monthly Fee
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {account.monthlyFee}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Setup Fee
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {account.setupFee}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Time to Report
                  </span>
                  <span className="text-sm text-gray-700">
                    {account.timeToReport}
                  </span>
                </div>
              </div>

              {/* Reports to bureaus */}
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-2">
                  <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />
                  Reports To
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {account.reportsToBureaus.map((bureau) => (
                    <span
                      key={bureau}
                      className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100"
                    >
                      {bureau}
                    </span>
                  ))}
                </div>
              </div>

              {/* Learn More button */}
              <Button
                variant="outline"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Learn More
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
