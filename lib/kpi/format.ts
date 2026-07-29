// ============================================================
// Number formatting — one implementation for every surface.
// ============================================================
import type { MetricFormat } from './types'

export function fmtCurrency(n: number, opts: { compact?: boolean; cents?: boolean } = {}) {
  const { compact = false, cents = false } = opts
  const abs = Math.abs(n)
  if (compact && abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`
  if (compact && abs >= 1_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(1)}K`
  return `${n < 0 ? '-' : ''}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  })}`
}

export function fmtNumber(n: number, digits = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function fmtPercent(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`
}

/** Render a raw metric value according to its registry format. */
export function fmtMetric(value: number, format: MetricFormat, unit?: string): string {
  switch (format) {
    case 'currency':
      return Math.abs(value) >= 100_000 ? fmtCurrency(value, { compact: true }) : fmtCurrency(value)
    case 'currencyK':
      return fmtCurrency(value, { compact: true })
    case 'percent':
      return fmtPercent(value, value % 1 === 0 ? 0 : value < 5 ? 2 : 1)
    case 'ratio':
      return `${value.toFixed(2)}:1`
    case 'days':
      return `${value.toFixed(1)}d`
    case 'hours':
      return `${value.toFixed(1)}h`
    case 'minutes':
      return `${value.toFixed(1)} min`
    case 'score':
      return fmtNumber(Math.round(value))
    case 'number':
    default:
      return `${fmtNumber(value, value % 1 === 0 ? 0 : 1)}${unit ? ` ${unit}` : ''}`
  }
}

/** Compact axis tick for dollar charts. */
export function axisDollar(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n}`
}

export function fmtDelta(delta: number, digits = 1) {
  const s = delta > 0 ? '+' : ''
  return `${s}${delta.toFixed(digits)}%`
}

export function relativeAge(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)}m ago`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`
  return `${Math.round(minutes / 1440)}d ago`
}

/** Semantic colour tokens, kept in one place. */
export const COLORS = {
  brand600: '#2563eb',
  brand500: '#3b82f6',
  brand400: '#60a5fa',
  brand300: '#93c5fd',
  brand200: '#bfdbfe',
  brand100: '#dbeafe',
  brand900: '#1e3a5f',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  grid: '#f1f5f9',
  axis: '#94a3b8',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
}
