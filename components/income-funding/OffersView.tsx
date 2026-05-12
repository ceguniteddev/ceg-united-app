import { useState } from "react";
import { Sparkles, Award } from "lucide-react";
import { OfferCard } from "./OfferCard";
import { GradeBadge } from "./GradeBadge";
import { formatUSD } from "@/lib/underwriting";
import type {
  DealOffer,
  IncomeFundingDeal,
} from "@/types/income-funding-types";

interface OffersViewProps {
  deal: IncomeFundingDeal;
  onSelect: (offer: DealOffer) => void;
  onSkip?: (offerId: string) => void;
}

export function OffersView({ deal, onSelect, onSkip }: OffersViewProps) {
  // Use the offer status to determine visibility instead of local state
  const visibleOffers = deal.offers.filter((o) => o.status !== "Skipped");

  return (
    <div className="space-y-6">
      {/* Compact pre-approval recap */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl shadow-card p-5 md:p-6 text-white animate-fade-in-up">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-100">
              <Sparkles className="w-3 h-3" />
              Pre-approved
            </div>
            <div className="mt-1 text-3xl md:text-4xl font-extrabold tabular-nums">
              up to {formatUSD(deal.underwritingResult.maxFundingAmount)}
            </div>
            <div className="mt-1 text-xs text-brand-100">
              Based on {formatUSD(deal.underwritingInput.monthlyDeposits)}/mo
              revenue
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-200">
                Risk grade
              </div>
              <div className="font-bold">
                Tier {deal.underwritingResult.grade}
              </div>
            </div>
            <GradeBadge grade={deal.underwritingResult.grade} size="md" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 animate-fade-in-up stagger-1">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-brand-600" />
            Your available funding offers
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Compare offers side-by-side. Select the one that fits your business
            best.
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-100">
          {visibleOffers.length} offer{visibleOffers.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Offers grid */}
      {visibleOffers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-sm text-gray-500">
            All offers have been skipped. Reach out to your coordinator for new
            options.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleOffers.map((offer, i) => (
            <div
              key={offer.id}
              className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
            >
              <OfferCard
                offer={offer}
                onSelect={onSelect}
                onSkip={(o) => onSkip && onSkip(o.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
