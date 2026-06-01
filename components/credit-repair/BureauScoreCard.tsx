import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { BureauScore } from '@/lib/credit-repair-types'

const BUREAU_LABEL: Record<string, string> = {
  experian: 'Experian',
  equifax: 'Equifax',
  transunion: 'TransUnion',
}

const BUREAU_ACCENT: Record<string, string> = {
  experian: 'text-blue-600 bg-blue-50',
  equifax: 'text-red-600 bg-red-50',
  transunion: 'text-emerald-600 bg-emerald-50',
}

function band(score: number): { label: string; color: string } {
  if (score >= 800) return { label: 'Excellent', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
  if (score >= 740) return { label: 'Very Good', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
  if (score >= 670) return { label: 'Good', color: 'bg-brand-50 text-brand-700 border-brand-100' }
  if (score >= 580) return { label: 'Fair', color: 'bg-amber-50 text-amber-700 border-amber-100' }
  return { label: 'Poor', color: 'bg-red-50 text-red-700 border-red-100' }
}

function fmtPulled(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function BureauScoreCard({ score }: { score: BureauScore }) {
  const b = band(score.score)
  const accent = BUREAU_ACCENT[score.bureau]

  // Score arc — visual progress 300-850
  const pct = Math.max(0, Math.min(1, (score.score - 300) / 550))
  const arcLength = 100
  const filled = pct * arcLength

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 card-hover">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center font-bold text-sm`}>
            {BUREAU_LABEL[score.bureau][0]}
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {BUREAU_LABEL[score.bureau]}
          </div>
        </div>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md border ${b.color}`}
        >
          {b.label}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-4xl font-bold text-gray-900 tabular-nums leading-none">
            {score.score}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
            {score.delta > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                <TrendingUp className="w-3 h-3" />+{score.delta}
              </span>
            ) : score.delta < 0 ? (
              <span className="inline-flex items-center gap-0.5 text-red-600 font-medium">
                <TrendingDown className="w-3 h-3" />
                {score.delta}
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-gray-500 font-medium">
                <Minus className="w-3 h-3" />0
              </span>
            )}
            <span className="text-gray-400">since last pull</span>
          </div>
        </div>

        {/* Mini progress arc */}
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            300 — 850
          </div>
          <div className="mt-2 w-[88px] h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-700"
              style={{ width: `${filled}%` }}
            />
          </div>
          <div className="mt-1.5 text-[11px] text-gray-500">
            Updated {fmtPulled(score.pulledAt)}
          </div>
        </div>
      </div>
    </div>
  )
}
