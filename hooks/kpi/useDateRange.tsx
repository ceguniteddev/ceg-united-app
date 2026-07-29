"use client";
// ============================================================
// Date range context — drives every useKPI() read.
// ============================================================
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { DateRangeKey } from '@/lib/kpi/types'

interface Ctx {
  range: DateRangeKey
  setRange: (r: DateRangeKey) => void
  label: string
  refreshedAt: Date
  refresh: () => void
  refreshing: boolean
}

export const RANGE_OPTIONS: { key: DateRangeKey; label: string; short: string }[] = [
  { key: 'today', label: 'Today', short: 'Today' },
  { key: 'week', label: 'This Week', short: 'Week' },
  { key: 'month', label: 'This Month', short: 'Month' },
  { key: 'quarter', label: 'This Quarter', short: 'Quarter' },
  { key: 'ytd', label: 'Year to Date', short: 'YTD' },
  { key: 'custom', label: 'Custom (Jun 13 – Jul 28)', short: 'Custom' },
]

const DateRangeContext = createContext<Ctx | null>(null)

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<DateRangeKey>('month')
  const [refreshedAt, setRefreshedAt] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const value = useMemo<Ctx>(
    () => ({
      range,
      setRange,
      label: RANGE_OPTIONS.find((o) => o.key === range)?.label ?? 'This Month',
      refreshedAt,
      refreshing,
      refresh: () => {
        setRefreshing(true)
        window.setTimeout(() => {
          setRefreshedAt(new Date())
          setRefreshing(false)
        }, 900)
      },
    }),
    [range, refreshedAt, refreshing],
  )

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>
}

export function useDateRange(): Ctx {
  const ctx = useContext(DateRangeContext)
  // Investor portal renders outside the provider — fall back safely.
  if (!ctx) {
    return {
      range: 'month',
      setRange: () => {},
      label: 'This Month',
      refreshedAt: new Date(),
      refresh: () => {},
      refreshing: false,
    }
  }
  return ctx
}
