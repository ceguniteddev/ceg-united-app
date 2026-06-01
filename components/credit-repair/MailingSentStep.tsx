import { useEffect } from 'react'
import {
  CheckCircle2,
  ExternalLink,
  Mail,
  Building2,
  Clock,
  Copy,
  ArrowRight,
} from 'lucide-react'
import { uspsTrackingUrl, type LobMailResponse, MAILING_METHODS } from '@/lib/lobMailing'

// ============================================
// MailingSentStep — Step C
// ============================================
// Confirmation screen. Supports both single-letter and bulk results.

interface SingleResult {
  agencyKey: string
  agencyName: string
  response: LobMailResponse
}

interface Props {
  results: SingleResult[]
  /** Original mailing method (used for receipt summary) */
  method: keyof typeof MAILING_METHODS
  onDone: () => void
  onViewTracking: () => void
}

export function MailingSentStep({ results, method, onDone, onViewTracking }: Props) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const isBulk = results.length > 1
  const totalCost = results.reduce((s, r) => s + r.response.totalPrice, 0)
  const cfg = MAILING_METHODS[method]
  // For single, deep-link the first; for bulk, use a header date.
  const expected = results[0]?.response.expectedDelivery

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Hero confirmation */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden animate-fade-in-up">
        <div className="bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-white px-6 sm:px-8 py-7 sm:py-9 border-b border-emerald-100">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                Mail Letter — Step 3 of 3
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
                {isBulk
                  ? `${results.length} letters sent successfully`
                  : 'Letter sent successfully'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Your dispute {isBulk ? 'letters are' : 'letter is'} on the way. Lob.com has
                queued {isBulk ? 'them' : 'it'} for printing and USPS handoff.
              </p>
            </div>
          </div>
        </div>

        {/* Tracking cards */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 space-y-3">
          {results.map((r, idx) => (
            <TrackingCard key={r.agencyKey} idx={idx + 1} total={results.length} item={r} />
          ))}
        </div>

        {/* Receipt summary */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-7">
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Mailing receipt
            </div>
            <div className="mt-2.5 space-y-1.5 text-xs">
              <ReceiptRow label="Method" value={cfg.label} />
              <ReceiptRow
                label="Letters mailed"
                value={`${results.length} × $${cfg.price.toFixed(2)}`}
              />
              {expected && (
                <ReceiptRow
                  label="Expected delivery"
                  value={new Date(expected).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                />
              )}
              <ReceiptRow
                label="Mailed from"
                value={(() => {
                  const froms = Array.from(
                    new Set(results.map((r) => r.response.mailedFrom).filter(Boolean) as string[]),
                  )
                  if (froms.length === 0) return 'Lob facility'
                  if (froms.length === 1) return froms[0]
                  return `${froms.length} Lob facilities`
                })()}
              />
              <div className="pt-2 mt-1 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Total charged</span>
                <span className="text-sm font-bold font-mono tabular-nums text-gray-900">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={onDone}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            Done
          </button>
          <button
            onClick={onViewTracking}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
          >
            View in Tracking
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- subcomponents ----------

function TrackingCard({
  idx,
  total,
  item,
}: {
  idx: number
  total: number
  item: SingleResult
}) {
  const url = uspsTrackingUrl(item.response.trackingNumber)
  const expected = new Date(item.response.expectedDelivery)
  const expectedLabel = expected.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-card-sm hover:shadow-card transition-shadow">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm font-bold text-gray-900">{item.agencyName}</div>
            {total > 1 && (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {idx} of {total}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-brand-700 hover:text-brand-800 hover:underline"
            >
              <Mail className="w-3 h-3" />
              {item.response.trackingNumber}
              <ExternalLink className="w-3 h-3" />
            </a>
            <CopyButton value={item.response.trackingNumber.replace(/\s+/g, '')} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500">
            <span className="font-mono">Lob ID {item.response.lobId}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ETA {expectedLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {})
    }
  }
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
    >
      <Copy className="w-3 h-3" />
      Copy
    </button>
  )
}
