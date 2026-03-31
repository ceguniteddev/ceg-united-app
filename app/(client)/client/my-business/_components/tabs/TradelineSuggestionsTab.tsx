"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Clock, CreditCard, Tag, Zap, ExternalLink } from "lucide-react";
import { useActiveSpecialDeals } from "@/hooks/special-deals";
import { getTimeLeft, getTagColor } from "@/lib/utils";
import type { SpecialDeal } from "@/schema/special-deals";
import Spinner from "@/components/Spinner";

export function TradelineSuggestionsTab() {
  const [, setTick] = useState(0);
  const { data: deals = [], isLoading } = useActiveSpecialDeals();

  // Refresh countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner displayText="Loading tradeline suggestions…" />
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="animate-fade-in">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
          Tradeline Suggestions
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Available tradelines to boost your business credit profile
        </p>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No tradeline deals available right now.</p>
          <p className="text-xs mt-1">
            Complete your business profile to receive personalized suggestions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5">
            Tradeline Suggestions
          </h3>
          <p className="text-sm text-gray-500">
            Available tradelines to boost your business credit profile
          </p>
        </div>
        <Link
          href="/client/tradelines"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors min-h-[44px] px-1"
        >
          View All Tradelines
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.map((deal: SpecialDeal) => {
          const timeLeft = getTimeLeft(
            typeof deal.expiresAt === "string"
              ? deal.expiresAt
              : (deal.expiresAt as Date).toISOString(),
          );
          const expired = timeLeft === "Expired";

          return (
            <div
              key={deal.id}
              className={`relative bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${
                expired ? "opacity-60 border-gray-200" : "border-gray-100"
              }`}
            >
              {/* Accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

              {/* Tags */}
              <div className="px-4 pt-5 pb-2 flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getTagColor(
                    deal.tag,
                  )}`}
                >
                  <Tag className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                  {deal.tag}
                </span>
                {deal.discountPercent > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                    {deal.discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="px-4 pb-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {deal.bank_name}
                    </h4>
                    <p className="text-xs text-gray-500 font-mono">
                      Card ID: {deal.card_id}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                      Credit Limit
                    </span>
                    <span className="text-sm font-semibold text-gray-900 font-mono">
                      ${deal.credit_limit.toLocaleString()}.00
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                      Date Opened
                    </span>
                    <span className="text-sm text-gray-700">
                      {deal.date_opened}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                      Stock
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        deal.stock === 0
                          ? "bg-gray-100 text-gray-500"
                          : deal.stock <= 2
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {deal.stock === 0
                        ? "Out of Stock"
                        : deal.stock <= 2
                          ? `Only ${deal.stock} left`
                          : `${deal.stock} available`}
                    </span>
                  </div>
                </div>

                {/* Countdown */}
                <div className="flex items-center gap-2 mb-4 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-amber-900">
                    {expired ? "Deal expired" : `Expires in: ${timeLeft}`}
                  </span>
                </div>

                {/* Price + CTA */}
                <div className="flex items-end justify-between gap-2">
                  <div>
                    {deal.originalPrice !== deal.salePrice && (
                      <p className="text-xs text-gray-400 line-through">
                        ${deal.originalPrice.toLocaleString()}
                      </p>
                    )}
                    <p className="text-base font-bold text-gray-900">
                      $
                      {deal.salePrice?.toLocaleString() ??
                        deal.originalPrice.toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href="/client/tradelines"
                    className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 min-h-[44px] ${
                      expired || deal.stock === 0
                        ? "bg-gray-100 text-gray-400 pointer-events-none"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md active:scale-[0.97]"
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Deal
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
