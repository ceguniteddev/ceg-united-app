// ============================================================
// Mock KPI Adapter
// Satisfies `KPIAdapter`. Reads from /src/data/mock.ts.
// The live adapter (Firebase + HubSpot + Stripe) built in
// /ceg-kpi-os/adapters/ must export the same shape — see
// src/data/adapter.ts for the single-line swap point.
// ============================================================
import type { DateRangeKey, KPIAdapter, KPIValue, MetricStatus } from '@/lib/kpi/types'
import { METRIC_MAP } from './registry'
import { HEADLINES, SYNC_STATUS, seriesFor } from './mock'

/** How many trailing days each range covers. */
const RANGE_DAYS: Record<DateRangeKey, number> = {
  today: 1,
  week: 7,
  month: 30,
  quarter: 90,
  ytd: 90, // mock dataset holds 90 days; YTD renders the full window
  custom: 45,
}

function statusFor(value: number, target: number | undefined, higherIsBetter: boolean): MetricStatus {
  if (target == null) return 'neutral'
  const ratio = higherIsBetter ? value / target : target / value
  if (ratio >= 0.98) return 'ok'
  if (ratio >= 0.88) return 'warn'
  return 'danger'
}

export const mockAdapter: KPIAdapter = {
  name: 'mock',

  getMetric(metricId: string, range: DateRangeKey): KPIValue | null {
    const def = METRIC_MAP[metricId]
    if (!def) return null

    const full = seriesFor(metricId)
    const days = Math.min(RANGE_DAYS[range] ?? 30, full.length)
    const window = full.slice(-days)

    const spec = HEADLINES[metricId]
    const value = spec ? spec.value : window[window.length - 1].value

    // Previous comparable period: the equally sized window before this one.
    const prevWindow = full.slice(Math.max(0, full.length - days * 2), full.length - days)
    const avg = (arr: typeof full) => (arr.length ? arr.reduce((s, p) => s + p.value, 0) / arr.length : 0)
    const previous = prevWindow.length ? avg(prevWindow) : avg(window)
    const currentAvg = avg(window)
    const deltaAbs = +(currentAvg - previous).toFixed(2)
    const delta = previous === 0 ? 0 : +(((currentAvg - previous) / previous) * 100).toFixed(1)

    const higherIsBetter = def.higherIsBetter !== false
    const sync = SYNC_STATUS.find((s) => s.source === def.source)

    return {
      ...def,
      higherIsBetter,
      value,
      previous: +previous.toFixed(2),
      delta,
      deltaAbs,
      status: statusFor(value, def.target, higherIsBetter),
      series: window,
      updatedAt: sync?.lastSync ?? 'just now',
    }
  },

  getSyncStatus() {
    return SYNC_STATUS.map((s) => ({ ...s }))
  },
}
