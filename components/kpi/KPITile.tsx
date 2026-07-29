"use client";
import { useKPI } from '@/hooks/kpi/useKPI'
import { fmtMetric } from '@/lib/kpi/format'
import { Delta, SourceChip, StatusDot } from './ui'
import { Sparkline } from './charts/Sparkline'
import type { DateRangeKey } from '@/lib/kpi/types'

// ============================================
// KPITile — the atom of the whole KPI OS.
// Reads exclusively through useKPI(metric_id) so swapping
// mock → live data requires no change here.
// ============================================

interface Props {
  metricId: string
  /** Override the registry label (e.g. shorter on dense grids). */
  label?: string
  /** Show the inline 90-day sparkline. */
  sparkline?: boolean
  /** Show the "vs target" footer row. */
  showTarget?: boolean
  range?: DateRangeKey
  className?: string
  stagger?: number
  /** Optional supporting line under the value. */
  note?: string
}

export function KPITile({
  metricId,
  label,
  sparkline = true,
  showTarget = true,
  range,
  className = '',
  stagger,
  note,
}: Props) {
  const kpi = useKPI(metricId, range)

  const toneColor =
    kpi.status === 'danger'
      ? '#ef4444'
      : kpi.status === 'warn'
      ? '#f59e0b'
      : kpi.status === 'ok'
      ? '#10b981'
      : '#2563eb'

  const targetPct =
    kpi.target != null && kpi.target !== 0
      ? kpi.higherIsBetter
        ? (kpi.value / kpi.target) * 100
        : (kpi.target / kpi.value) * 100
      : null

  return (
    <div
      className={`card card-hover p-4 relative opacity-0 animate-fade-in-up ${
        stagger ? `stagger-${Math.min(stagger, 12)}` : ''
      } ${className}`}
      data-testid={`tile-${metricId}`}
    >
      {/* Label — wraps to two lines so nothing truncates on dense grids */}
      <div className="flex items-start gap-1.5 mb-3 min-h-[30px]">
        <span className="mt-[4.5px] flex-shrink-0 leading-none">
          <StatusDot status={kpi.status} />
        </span>
        <span
          className="text-[11.5px] font-medium text-gray-500 leading-[1.3]"
          title={kpi.description}
        >
          {label ?? kpi.label}
        </span>
      </div>

      {/* Value + sparkline */}
      <div className="flex items-end justify-between gap-3">
        <div className="num text-[23px] font-semibold text-gray-900 leading-none tracking-tight">
          {fmtMetric(kpi.value, kpi.format, kpi.unit)}
        </div>
        {sparkline && kpi.series.length > 1 && (
          <div className="w-[56px] h-[26px] flex-shrink-0 opacity-90">
            <Sparkline data={kpi.series} color={toneColor} />
          </div>
        )}
      </div>

      {/* Delta */}
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        <Delta value={kpi.delta} higherIsBetter={kpi.higherIsBetter} />
        <span className="text-[10.5px] text-gray-400">vs prior</span>
        {showTarget && kpi.target != null && (
          <span className="text-[10.5px] text-gray-300">
            · target{' '}
            <span className="num text-gray-400">
              {fmtMetric(kpi.target, kpi.format, kpi.unit)}
            </span>
          </span>
        )}
      </div>

      {note && <p className="mt-2 text-[11px] text-gray-400 leading-snug">{note}</p>}

      {/* Footer: data lineage + attainment */}
      <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between gap-2">
        <SourceChip source={kpi.source} />
        {showTarget && targetPct != null && (
          <span
            className={`num text-[10.5px] font-semibold whitespace-nowrap ${
              targetPct >= 98
                ? 'text-emerald-600'
                : targetPct >= 88
                ? 'text-amber-600'
                : 'text-red-600'
            }`}
          >
            {targetPct.toFixed(0)}% of target
          </span>
        )}
      </div>
    </div>
  )
}

/** Grid wrapper so every page has identical tile rhythm. */
export function KPIGrid({
  metricIds,
  cols = 4,
  sparkline = true,
  showTarget = true,
}: {
  metricIds: string[]
  cols?: 3 | 4 | 5 | 6
  sparkline?: boolean
  showTarget?: boolean
}) {
  const colClass = {
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  }[cols]
  return (
    <div className={`grid grid-cols-1 ${colClass} gap-4`}>
      {metricIds.map((id, i) => (
        <KPITile key={id} metricId={id} stagger={i + 1} sparkline={sparkline} showTarget={showTarget} />
      ))}
    </div>
  )
}
