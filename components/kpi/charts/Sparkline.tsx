"use client";
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import type { SeriesPoint } from '@/lib/kpi/types'

// ============================================
// Sparkline — inline micro trend for KPI tiles
// ============================================

export function Sparkline({
  data,
  color = '#2563eb',
  fill = true,
}: {
  data: SeriesPoint[]
  color?: string
  fill?: boolean
}) {
  const id = `spark-${color.replace('#', '')}`
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.26} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.75}
          fill={fill ? `url(#${id})` : 'none'}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
