// ============================================
// TradelineCard — Available tradeline item
// ============================================
// Displays bank name, credit limit, date info,
// stock indicator, price, and Add to Cart button.

import {
  CreditCard,
  Calendar,
  Clock,
  Package,
  ShoppingCart,
  Check,
  Star,
} from "lucide-react";
import type { AvailableTradeline } from "@/types/tradelines";
import { getStockColor, getStockLabel } from "@/lib/utils";

interface TradelineCardProps {
  tradeline: AvailableTradeline;
  isInCart: boolean;
  onAddToCart: (t: AvailableTradeline) => void;
}

export function TradelineCard({
  tradeline,
  isInCart,
  onAddToCart,
}: TradelineCardProps) {
  const isOutOfStock = tradeline.stock === 0;

  return (
    <div
      className={`relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${
        isOutOfStock ? "opacity-60" : ""
      }`}
    >
      {/* Featured badge */}
      {tradeline.featured && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full z-10">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span className="text-[11px] font-semibold text-amber-700">
            Featured
          </span>
        </div>
      )}

      {/* Header with bank + card ID */}
      <div className="px-4 pt-5 pb-3 md:px-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate md:text-base">
              {tradeline.bankName}
            </h3>
            <p className="text-xs text-gray-500 font-mono">
              Card ID: {tradeline.cardId}
            </p>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="px-4 pb-4 space-y-2.5 md:px-5">
        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
            Credit Limit
          </span>
          <span className="text-sm font-semibold text-gray-900 font-mono">
            ${tradeline.creditLimit.toLocaleString()}.00
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
            Date Opened
          </span>
          <span className="text-sm text-gray-700">{tradeline.dateOpened}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
              Purchase By
            </span>
          </div>
          <span className="text-sm text-gray-700">
            {tradeline.purchaseByDate}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
              Reports
            </span>
          </div>
          <span className="text-sm text-gray-700">
            {tradeline.reportingDate}
          </span>
        </div>

        {/* Stock indicator */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
              Stock
            </span>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStockColor(
              tradeline.stock,
            )}`}
          >
            {getStockLabel(tradeline.stock)}
          </span>
        </div>
      </div>

      {/* Footer: Price + CTA */}
      <div className="px-4 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between md:px-5">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">
            Price
          </p>
          <p className="text-base font-bold text-gray-900 font-mono md:text-lg">
            $
            {tradeline.price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <button
          onClick={() => !isOutOfStock && !isInCart && onAddToCart(tradeline)}
          disabled={isOutOfStock || isInCart}
          className={`cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] md:px-4 ${
            isInCart
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
              : isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md active:scale-[0.97]"
          }`}
        >
          {isInCart ? (
            <>
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">In Cart</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
