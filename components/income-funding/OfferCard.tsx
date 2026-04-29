import { CheckCircle2, Clock, Repeat, TrendingUp, X } from 'lucide-react'
import type { ApprovalLikelihood, DealOffer } from '@/lib/income-funding-types'
import { formatUSD } from '@/lib/underwriting'

interface OfferCardProps {
  offer: DealOffer
  onSelect: (offer: DealOffer) => void
  onSkip?: (offer: DealOffer) => void
  selected?: boolean
  compact?: boolean
  hideActions?: boolean
}

const likelihoodMap: Record<
  ApprovalLikelihood,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  'most-likely': {
    label: 'Most likely',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  likely: {
    label: 'Likely',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  possible: {
    label: 'Possible',
    dot: 'bg-blue-500',
    text: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
}

const dealTypeStyles: Record<string, string> = {
  MCA: 'bg-purple-50 text-purple-700 border-purple-100',
  LOC: 'bg-blue-50 text-blue-700 border-blue-100',
  'Revenue-Based': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Term Loan': 'bg-amber-50 text-amber-700 border-amber-100',
  'Equipment Finance': 'bg-orange-50 text-orange-700 border-orange-100',
}

export function OfferCard({
  offer,
  onSelect,
  onSkip,
  selected,
  compact,
  hideActions,
}: OfferCardProps) {
  const likelihood = likelihoodMap[offer.approvalLikelihood]
  const dealStyle = dealTypeStyles[offer.dealType] || 'bg-gray-50 text-gray-700 border-gray-200'

  const freqLabel =
    offer.paymentFrequency.charAt(0).toUpperCase() + offer.paymentFrequency.slice(1)

  if (compact) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            {offer.dealType} · {offer.lenderName}
          </div>
          <div className="text-lg font-bold text-gray-900 tabular-nums">
            {formatUSD(offer.fundingAmount)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Factor
          </div>
          <div className="font-mono text-sm font-semibold text-gray-900">
            {offer.factorRate.toFixed(2)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group bg-white rounded-2xl border transition-all p-5 md:p-6 flex flex-col h-full
        ${
          selected
            ? 'border-brand-500 shadow-card-hover ring-2 ring-brand-200'
            : 'border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5'
        }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${dealStyle}`}
          >
            {offer.dealType}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full border ${likelihood.bg} ${likelihood.border} ${likelihood.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${likelihood.dot}`} />
          {likelihood.label}
        </span>
      </div>

      {/* Lender + amount */}
      <div className="mt-4">
        <div className="text-sm font-medium text-gray-500">{offer.lenderName}</div>
        <div className="mt-1 text-3xl md:text-4xl font-extrabold text-gray-900 tabular-nums">
          {formatUSD(offer.fundingAmount)}
        </div>
      </div>

      {/* Details grid */}
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Payback
          </dt>
          <dd className="mt-1 font-bold text-gray-900 tabular-nums">
            {formatUSD(offer.paybackAmount)}
          </dd>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Factor rate
          </dt>
          <dd className="mt-1 font-bold text-gray-900 font-mono">
            {offer.factorRate.toFixed(2)}
          </dd>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Term
          </dt>
          <dd className="mt-1 font-bold text-gray-900">
            {offer.termLength} {offer.termUnit}
          </dd>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            Frequency
          </dt>
          <dd className="mt-1 font-bold text-gray-900">{freqLabel}</dd>
        </div>
        <div className="col-span-2 p-3 rounded-xl bg-brand-50 border border-brand-100">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-brand-700 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Estimated payment
          </dt>
          <dd className="mt-1 font-bold text-brand-900 tabular-nums">
            {formatUSD(offer.estimatedPayment)}{' '}
            <span className="text-xs font-medium text-brand-600">
              /{
                offer.paymentFrequency === 'daily'
                  ? 'day'
                  : offer.paymentFrequency === 'weekly'
                  ? 'week'
                  : offer.paymentFrequency === 'biweekly'
                  ? 'bi-week'
                  : 'month'
              }
            </span>
          </dd>
        </div>
      </dl>

      {/* Notes */}
      {offer.notes && (
        <p className="mt-4 text-xs text-gray-500 leading-relaxed">{offer.notes}</p>
      )}

      {/* CTAs */}
      {!hideActions && (
      <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-2">
        <button
          onClick={() => onSelect(offer)}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition"
        >
          <CheckCircle2 className="w-4 h-4" />
          Select this offer
        </button>
        {onSkip && (
          <button
            onClick={() => onSkip(offer)}
            className="inline-flex items-center justify-center gap-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 font-semibold text-sm px-3 py-2.5 rounded-xl transition"
          >
            <X className="w-4 h-4" />
            Skip
          </button>
        )}
      </div>
      )}
    </div>
  )
}
