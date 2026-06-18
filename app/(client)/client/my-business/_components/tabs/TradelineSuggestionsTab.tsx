"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  CreditCard,
  Tag,
  Zap,
  ExternalLink,
  LockIcon,
} from "lucide-react";
import { useActiveSpecialDeals } from "@/hooks/special-deals";
import { getTimeLeft, getTagColor } from "@/lib/utils";
import type { SpecialDeal } from "@/schema/special-deals";
import Spinner from "@/components/Spinner";

const MOCK_PREMIUM_DEALS = [
  {
    id: "mock-1",
    bank_name: "Chase Ink Business Premium",
    card_id: "CH-INK-883",
    credit_limit: 50000,
    date_opened: "10/12/2021",
    stock: 2,
    tag: "Primary Tradeline",
    discountPercent: 15,
    expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    originalPrice: 950,
    salePrice: 799,
  },
  {
    id: "mock-2",
    bank_name: "Amex Business Platinum",
    card_id: "AX-PLAT-529",
    credit_limit: 75000,
    date_opened: "05/18/2020",
    stock: 1,
    tag: "High Limit",
    discountPercent: 20,
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
    originalPrice: 1200,
    salePrice: 950,
  },
  {
    id: "mock-3",
    bank_name: "Capital One Spark Cash Plus",
    card_id: "CO-SPK-311",
    credit_limit: 40000,
    date_opened: "03/15/2022",
    stock: 5,
    tag: "Seasoned",
    discountPercent: 10,
    expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
    originalPrice: 750,
    salePrice: 675,
  },
];

interface TradelineSuggestionsTabProps {
  isPremium?: boolean;
  onUpgradeClick?: () => void;
}

export function TradelineSuggestionsTab({
  isPremium = false,
  onUpgradeClick,
}: TradelineSuggestionsTabProps) {
  const [, setTick] = useState(0);
  const { data: deals = [], isLoading } = useActiveSpecialDeals();

  // Refresh countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const displayDeals = isPremium
    ? deals
    : deals.length > 0
      ? deals
      : (MOCK_PREMIUM_DEALS as any[]);

  if (isPremium && isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner displayText="Loading tradeline suggestions…" />
      </div>
    );
  }

  if (isPremium && deals.length === 0) {
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
          {/* <p className="text-xs mt-1">
            Complete your business profile to receive personalized suggestions.
          </p> */}
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

      <div
        className={!isPremium ? "relative overflow-hidden min-h-[450px]" : ""}
      >
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${!isPremium ? "blur-[4px] opacity-40 pointer-events-none select-none" : ""}`}
        >
          {displayDeals.map((deal: SpecialDeal) => {
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

        {!isPremium && (
          <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10 px-4 py-8">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 sm:p-8 text-center animate-fade-in">
              <div className="w-12 h-12 bg-amber-50 rounded-full border border-amber-100 flex items-center justify-center mx-auto mb-4">
                <LockIcon className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Unlock Premium Tradelines
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Access exclusive, high-limit corporate tradelines (up to
                $50,000+) designed to quickly build your business credit score
                and optimize bank fundability. Premium members also save up to
                40% on card acquisitions.
              </p>
              <button
                onClick={onUpgradeClick}
                className="cursor-pointer w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                Upgrade Membership
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
