"use client";
// ============================================================
// useKPI — the single read path for every number on screen.
// ============================================================
// Usage:  const mrr = useKPI('mrr')
//         mrr.value / mrr.delta / mrr.series / mrr.source
//
// The hook resolves against `activeAdapter` (see
// src/data/adapter.ts). Swapping mock → live is a one-line
// change there; no component needs to be touched.
// ============================================================
import { useMemo } from 'react'
import { activeAdapter } from '@/lib/kpi/data/adapter'
import { useDateRange } from './useDateRange'
import type { DateRangeKey, KPIValue } from '@/lib/kpi/types'

/** Resolve one metric for the active (or an explicit) date range. */
export function useKPI(metricId: string, rangeOverride?: DateRangeKey): KPIValue {
  const { range } = useDateRange()
  const active = rangeOverride ?? range
  return useMemo(() => {
    const v = activeAdapter.getMetric(metricId, active)
    if (v) return v
    // Fail visibly but never crash a dashboard.
    return {
      id: metricId,
      label: metricId,
      format: 'number',
      source: 'Manual',
      dept: 'executive',
      higherIsBetter: true,
      value: 0,
      previous: 0,
      delta: 0,
      deltaAbs: 0,
      status: 'neutral',
      series: [],
      updatedAt: 'unavailable',
    } as KPIValue
  }, [metricId, active])
}

/** Batch helper for tile grids. */
export function useKPIs(metricIds: string[], rangeOverride?: DateRangeKey): KPIValue[] {
  const { range } = useDateRange()
  const active = rangeOverride ?? range
  return useMemo(
    () =>
      metricIds.map(
        (id) =>
          activeAdapter.getMetric(id, active) ?? {
            id,
            label: id,
            format: 'number' as const,
            source: 'Manual' as const,
            dept: 'executive' as const,
            higherIsBetter: true,
            value: 0,
            previous: 0,
            delta: 0,
            deltaAbs: 0,
            status: 'neutral' as const,
            series: [],
            updatedAt: 'unavailable',
          },
      ),
    [metricIds.join('|'), active],
  )
}

export function useSyncStatus() {
  return useMemo(() => activeAdapter.getSyncStatus(), [])
}
