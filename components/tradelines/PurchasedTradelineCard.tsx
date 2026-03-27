// ============================================
// PurchasedTradelineCard — Purchased tradeline display
// ============================================
// Shows purchased tradeline with status badge,
// purchase date, quantity, and total paid.

import { CreditCard, Calendar, Package, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PurchasedTradeline } from "@/types/tradelines";
import { getPurchaseStatusColor } from "@/lib/utils";

interface PurchasedTradelineCardProps {
  tradeline: PurchasedTradeline;
}

export function PurchasedTradelineCard({
  tradeline,
}: PurchasedTradelineCardProps) {
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Status badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getPurchaseStatusColor(
            tradeline.status,
          )}`}
        >
          {tradeline.status.charAt(0).toUpperCase() + tradeline.status.slice(1)}
        </Badge>
      </div>

      {/* Header with bank + card ID */}
      <div className="px-4 pt-5 pb-3 md:px-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1 pr-16">
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
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
              Purchased On
            </span>
          </div>
          <span className="text-sm text-gray-700">{tradeline.purchasedOn}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
              Quantity
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {tradeline.quantity}
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
              Total Paid
            </span>
          </div>
          <span className="text-sm font-semibold text-gray-900 font-mono">
            $
            {tradeline.totalPaid.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
