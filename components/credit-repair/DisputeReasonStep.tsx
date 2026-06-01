import { useState } from 'react'
import { ArrowLeft, ArrowRight, AlertTriangle, ShieldAlert, ChevronDown } from 'lucide-react'
import type { DisputeReasonAssignment, NegativeItem } from '@/lib/credit-repair-types'
import { DISPUTE_REASONS, getReason } from '@/lib/disputeReasons'
import { ItemTypeIcon, getTypeLabel } from './ItemTypeIcon'
import { BureauBadges } from './BureauBadges'

interface Props {
  items: NegativeItem[]
  reasonByItem: Record<string, DisputeReasonAssignment>
  onChange: (next: Record<string, DisputeReasonAssignment>) => void
  onBack: () => void
  onContinue: () => void
}

function fmtMoney(n: number): string {
  if (n === 0) return '—'
  return `$${n.toLocaleString('en-US')}`
}

export function DisputeReasonStep({
  items,
  reasonByItem,
  onChange,
  onBack,
  onContinue,
}: Props) {
  const [applyAll, setApplyAll] = useState(false)
  const [bulkReason, setBulkReason] = useState('cannot-verify')

  const handleApplyAll = () => {
    const next: Record<string, DisputeReasonAssignment> = {}
    for (const it of items) {
      next[it.id] = {
        reasonCode: bulkReason,
        additionalDetails: reasonByItem[it.id]?.additionalDetails,
      }
    }
    onChange(next)
  }

  const setItemReason = (itemId: string, reasonCode: string) => {
    onChange({
      ...reasonByItem,
      [itemId]: {
        reasonCode,
        additionalDetails: reasonByItem[itemId]?.additionalDetails,
      },
    })
  }

  const setItemDetails = (itemId: string, details: string) => {
    onChange({
      ...reasonByItem,
      [itemId]: {
        reasonCode: reasonByItem[itemId]?.reasonCode || 'cannot-verify',
        additionalDetails: details,
      },
    })
  }

  const allAssigned = items.every((i) => reasonByItem[i.id]?.reasonCode)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
          Step 1 of 3
        </div>
        <h2 className="text-xl font-bold text-gray-900 mt-0.5">Choose dispute reasons</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Select why each item is being disputed. Reasons map to FCRA citations the AI uses when drafting your letters.
        </p>
      </div>

      {/* Apply same reason to all */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyAll}
                onChange={(e) => setApplyAll(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500/20"
              />
              <span className="text-sm font-semibold text-gray-900">
                Apply same reason to all {items.length} items
              </span>
            </label>
          </div>

          {applyAll && (
            <div className="flex items-center gap-2 animate-fade-in">
              <ReasonSelect
                value={bulkReason}
                onChange={setBulkReason}
                className="min-w-[260px]"
              />
              <button
                onClick={handleApplyAll}
                className="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Items grid */}
      <div className="space-y-3">
        {items.map((item) => {
          const assigned = reasonByItem[item.id]
          const reason = assigned ? getReason(assigned.reasonCode) : undefined
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 sm:p-5"
            >
              {/* Item header */}
              <div className="flex items-start gap-3">
                <ItemTypeIcon type={item.type} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-gray-900 text-sm">{item.creditor}</div>
                    <span className="text-[11px] font-medium text-gray-500">
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="font-mono">{item.accountNumber}</span>
                    <span>{fmtMoney(item.amount)}</span>
                    <BureauBadges reporting={item.bureaus} size="sm" />
                  </div>
                </div>
              </div>

              {/* Reason picker */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">
                    Dispute reason
                  </label>
                  <ReasonSelect
                    value={assigned?.reasonCode || ''}
                    onChange={(v) => setItemReason(item.id, v)}
                    itemType={item.type}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={assigned?.additionalDetails || ''}
                    onChange={(e) => setItemDetails(item.id, e.target.value)}
                    placeholder="Anything else the AI should mention…"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 resize-none"
                  />
                </div>
              </div>

              {/* Legal flags */}
              {reason?.requiresIdTheftReport && (
                <div className="mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-800">
                    <div className="font-semibold">Identity theft — special legal rights apply</div>
                    <div className="mt-0.5">
                      Under FCRA §605B, the bureau must block this item within 4 business days. We&rsquo;ll attach your FTC Identity Theft Report (IdentityTheft.gov) automatically.
                    </div>
                  </div>
                </div>
              )}
              {reason?.fcraCitation && !reason?.requiresIdTheftReport && (
                <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-brand-50 border border-brand-100 text-[11px] font-semibold text-brand-700">
                  Cited under {reason.fcraCitation}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          {!allAssigned && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              {items.filter((i) => !reasonByItem[i.id]?.reasonCode).length} items still need a reason
            </span>
          )}
          <button
            disabled={!allAssigned}
            onClick={onContinue}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-sm"
          >
            Continue to Agencies
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ReasonSelect({
  value,
  onChange,
  itemType,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  itemType?: string
  className?: string
}) {
  const list = itemType
    ? DISPUTE_REASONS.filter((r) => !r.itemTypes || r.itemTypes.includes(itemType as any))
    : DISPUTE_REASONS
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full pl-3 pr-9 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 cursor-pointer"
      >
        <option value="" disabled>
          Select a reason…
        </option>
        {list.map((r) => (
          <option key={r.code} value={r.code}>
            {r.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}
