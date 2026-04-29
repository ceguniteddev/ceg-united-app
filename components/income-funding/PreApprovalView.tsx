import {
  CheckCircle2,
  TrendingUp,
  Calendar,
  Wallet,
  AlertCircle,
  CircleSlash,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { AnimatedCounter } from './AnimatedCounter'
import { StatCard } from './StatCard'
import { GradeBadge } from './GradeBadge'
import { formatUSD } from '@/lib/underwriting'
import type { IncomeFundingDeal } from '@/lib/income-funding-types'

interface PreApprovalViewProps {
  deal: IncomeFundingDeal
  onContinue: () => void
}

export function PreApprovalView({ deal, onContinue }: PreApprovalViewProps) {
  const { underwritingInput: u, underwritingResult: r } = deal

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-card p-8 md:p-10 animate-fade-in-up">
        {/* Soft brand glow */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-brand-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Pre-approval complete
          </div>

          <h1 className="mt-5 text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 md:w-8 md:h-8 text-emerald-500 shrink-0" />
            Congratulations, you've been pre-approved
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-500 max-w-xl">
            Based on your business cash flow and credit profile, you are pre-qualified for up to:
          </p>

          <div className="mt-6 flex items-baseline gap-3 flex-wrap">
            <AnimatedCounter
              value={r.maxFundingAmount}
              className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 tabular-nums"
            />
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              maximum funding
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onContinue}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              Continue to Submit Your File
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="inline-flex items-center text-xs text-gray-500 px-3 py-3">
              Pre-approval valid for 30 days · No hard credit pull
            </span>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="animate-fade-in-up stagger-1">
          <StatCard
            icon={TrendingUp}
            label="Monthly Revenue"
            value={formatUSD(u.monthlyDeposits)}
            badge={{ text: 'Plaid synced', tone: 'info' }}
            hint="Avg. of last 4 months"
          />
        </div>
        <div className="animate-fade-in-up stagger-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 card-hover h-full">
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <CheckCircle2 className="w-[18px] h-[18px]" />
              </div>
              <GradeBadge grade={r.grade} size="sm" />
            </div>
            <div className="mt-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Risk Grade
              </div>
              <div className="mt-1 text-xl font-bold text-gray-900">
                Tier {r.grade}
              </div>
              <div className="mt-0.5 text-xs text-gray-500">
                {r.grade === 'A' && 'Excellent profile'}
                {r.grade === 'B' && 'Solid profile'}
                {r.grade === 'C' && 'Fair profile'}
                {r.grade === 'D' && 'Subprime profile'}
              </div>
            </div>
          </div>
        </div>
        <div className="animate-fade-in-up stagger-3">
          <StatCard
            icon={Calendar}
            label="Time in Business"
            value={`${u.timeInBusinessMonths} months`}
            hint={`Founded ${new Date(
              Date.now() - u.timeInBusinessMonths * 30 * 24 * 60 * 60 * 1000
            ).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
          />
        </div>
        <div className="animate-fade-in-up stagger-4">
          <StatCard
            icon={Wallet}
            label="Avg. Daily Balance"
            value={formatUSD(u.averageDailyBalance)}
            hint={`Ending balance ${formatUSD(u.endingBalance)}`}
          />
        </div>
        <div className="animate-fade-in-up stagger-5">
          <StatCard
            icon={AlertCircle}
            label="NSF / Returned"
            value={u.nsfCount}
            hint={u.nsfCount <= 2 ? 'Within healthy range' : 'Higher than ideal'}
            badge={
              u.nsfCount <= 2
                ? { text: 'Healthy', tone: 'success' }
                : { text: 'Watch', tone: 'warning' }
            }
          />
        </div>
        <div className="animate-fade-in-up stagger-6">
          <StatCard
            icon={CircleSlash}
            label="Negative Days"
            value={u.negativeDays}
            hint={u.negativeDays === 0 ? 'No overdrafts' : 'Watch overdraft pattern'}
            badge={
              u.negativeDays <= 2
                ? { text: 'Clean', tone: 'success' }
                : { text: 'Risk', tone: 'warning' }
            }
          />
        </div>
      </div>

      {/* Underwriting breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 md:p-7 animate-fade-in-up stagger-7">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Underwriting Summary
            </div>
            <h2 className="text-base font-bold text-gray-900">How we calculated your offer</h2>
          </div>
        </div>

        <div className="mt-5 bg-gradient-to-br from-brand-50 to-white border border-brand-100 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Calculation
          </div>
          <div className="mt-2 font-mono text-base md:text-lg text-gray-900 flex flex-wrap items-baseline gap-2">
            <span className="font-bold">{r.baseMultiple}</span>
            <span className="text-gray-400">×</span>
            <span className="font-bold">{Math.round(r.percentage * 100)}%</span>
            <span className="text-gray-400">×</span>
            <span className="font-bold">{formatUSD(u.monthlyDeposits)}</span>
            <span className="text-gray-400">=</span>
            <span className="font-extrabold text-brand-700">
              {formatUSD(r.maxFundingAmount)}
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">{r.rationale}</p>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <span className="font-semibold text-gray-900">Base multiple:</span> 5× monthly deposits
            for Tiers A-C, 3× for Tier D.
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <span className="font-semibold text-gray-900">Advance rate:</span> Tier A 75% · Tier B
            50% · Tier C 25% · Tier D 100% (capped at 3×).
          </div>
        </div>
      </div>
    </div>
  )
}
