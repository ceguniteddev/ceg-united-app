// ============================================
// SpecialDealsSection — Special deals showcase
// ============================================
// Displays discounted tradelines with sale tags,
// countdown timers, and original/sale prices.

"use client";

import { useState, useEffect } from "react";
import { CreditCard, Zap, Clock, ShoppingCart, Check, Tag } from "lucide-react";
import type { SpecialDeal, AvailableTradeline } from "@/types/tradelines";
import { getTagColor, getTimeLeft } from "@/lib/utils";

interface SpecialDealsSectionProps {
  deals: SpecialDeal[];
  isInCart: (id: string) => boolean;
  onAddToCart: (t: AvailableTradeline) => void;
}

// Convert a SpecialDeal to AvailableTradeline for cart compatibility
function dealToTradeline(deal: SpecialDeal): AvailableTradeline {
  return {
    id: deal.id,
    bankName: deal.bankName,
    cardId: deal.cardId,
    creditLimit: deal.creditLimit,
    dateOpened: deal.dateOpened,
    purchaseByDate: "Limited",
    reportingDate: "TBD",
    stock: deal.stock,
    price: deal.salePrice,
    status:
      deal.stock > 0
        ? deal.stock <= 2
          ? "low-stock"
          : "in-stock"
        : "out-of-stock",
  };
}

export function SpecialDealsSection({
  deals,
  isInCart,
  onAddToCart,
}: SpecialDealsSectionProps) {
  const [, setTick] = useState(0);

  // Refresh countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-sm text-gray-500 font-medium">
          No special deals available
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Check back soon for exclusive discounts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
          <Zap className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 md:text-lg">
            Special Deals
          </h3>
          <p className="text-xs text-gray-500 md:text-sm">
            Exclusive discounted tradelines — limited availability
          </p>
        </div>
      </div>

      {/* Deals grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.map((deal) => {
          const inCart = isInCart(deal.id);
          const timeLeft = getTimeLeft(deal.expiresAt);
          const expired = timeLeft === "Expired";

          return (
            <div
              key={deal.id}
              className={`relative bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${
                expired ? "opacity-60 border-gray-200" : "border-gray-100"
              }`}
            >
              {/* Discount ribbon */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />

              {/* Tags */}
              <div className="px-4 pt-5 pb-2 flex items-center gap-2 flex-wrap md:px-5">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getTagColor(
                    deal.tag,
                  )}`}
                >
                  <Tag className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                  {deal.tag}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  {deal.discountPercent}% OFF
                </span>
              </div>

              {/* Content */}
              <div className="px-4 pb-3 md:px-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 truncate md:text-base">
                      {deal.bankName}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">
                      Card ID: {deal.cardId}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                      Credit Limit
                    </span>
                    <span className="text-sm font-semibold text-gray-900 font-mono">
                      ${deal.creditLimit.toLocaleString()}.00
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                      Date Opened
                    </span>
                    <span className="text-sm text-gray-700">
                      {deal.dateOpened}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                      Stock
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        deal.stock <= 2
                          ? "text-amber-600 bg-amber-50"
                          : "text-emerald-600 bg-emerald-50"
                      }`}
                    >
                      {deal.stock} left
                    </span>
                  </div>
                </div>

                {/* Countdown */}
                <div className="flex items-center gap-2 mb-4 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-900">
                    {timeLeft}
                  </span>
                </div>

                {/* Price and CTA */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-gray-400 line-through font-mono">
                      ${deal.originalPrice.toLocaleString()}
                    </p>
                    <p className="text-lg font-bold text-red-600 font-mono">
                      $
                      {deal.salePrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      !expired && !inCart && onAddToCart(dealToTradeline(deal))
                    }
                    disabled={expired || inCart || deal.stock === 0}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] md:px-4 ${
                      inCart
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                        : expired || deal.stock === 0
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md active:scale-[0.97]"
                    }`}
                  >
                    {inCart ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Deal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
