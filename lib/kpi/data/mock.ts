// ============================================================
// CEG Brain KPI OS v3.0 — Mock Dataset
// Realistic figures for a mid-stage CEG-like company:
// $85K MRR (+8%), $2.4M capital facilitated YTD, 340 active
// clients, 27% close rate, 63% approval rate, 4.2:1 LTV:CAC.
// 90 days of daily points back every trend line.
// ============================================================
import type {
  Alert,
  AtRiskClient,
  Briefing,
  Campaign,
  Closer,
  Employee,
  FundingDeal,
  SeriesPoint,
  WaterfallStage,
} from '@/lib/kpi/types'

/** The "as of" date the whole dataset is pinned to. */
export const AS_OF = new Date('2026-07-28T12:00:00-04:00')

// ------------------------------------------------------------
// Deterministic PRNG — same numbers on every render & reload.
// ------------------------------------------------------------
function mulberry(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function isoDaysAgo(n: number) {
  const d = new Date(AS_OF)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/**
 * Build a realistic daily series that lands exactly on `end`.
 * Combines linear drift, weekly seasonality, and bounded noise.
 */
export function buildSeries(
  metricId: string,
  end: number,
  growthPct: number,
  days = 90,
  opts: { volatility?: number; weekly?: boolean; integer?: boolean } = {},
): SeriesPoint[] {
  const { volatility = 0.05, weekly = true, integer = false } = opts
  const rand = mulberry(hash(metricId))
  const start = end / (1 + growthPct / 100)
  const out: SeriesPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const t = (days - 1 - i) / (days - 1)
    const date = isoDaysAgo(i)
    const dow = new Date(date + 'T12:00:00Z').getUTCDay()
    // Ease-out drift so recent trend reads clearly.
    const drift = start + (end - start) * (0.35 * t + 0.65 * Math.pow(t, 1.4))
    const season = weekly ? (dow === 0 ? -0.09 : dow === 6 ? -0.06 : dow === 2 || dow === 3 ? 0.035 : 0) : 0
    const noise = (rand() - 0.5) * 2 * volatility
    let v = drift * (1 + season + noise * (1 - 0.7 * t))
    if (i === 0) v = end // pin the latest point to the headline number
    out.push({ date, value: integer ? Math.max(0, Math.round(v)) : Math.max(0, +v.toFixed(2)) })
  }
  return out
}

// ------------------------------------------------------------
// Headline values: [current, growth % over the 90-day window]
// ------------------------------------------------------------
type Spec = { value: number; growth: number; vol?: number; int?: boolean }

export const HEADLINES: Record<string, Spec> = {
  // Executive
  health_score: { value: 78, growth: 6.8, vol: 0.02 },
  mrr: { value: 85400, growth: 8.2, vol: 0.02 },
  capital_facilitated_ytd: { value: 2412000, growth: 46, vol: 0.01 },
  active_clients: { value: 340, growth: 11.5, vol: 0.015, int: true },
  close_rate: { value: 27.4, growth: -6.2, vol: 0.06 },
  ltv_cac: { value: 4.2, growth: 9.4, vol: 0.04 },
  approval_rate: { value: 63.1, growth: 3.1, vol: 0.05 },

  // Sales
  sales_close_rate: { value: 27.4, growth: -6.2, vol: 0.07 },
  revenue_per_closer: { value: 58900, growth: 5.4, vol: 0.07 },
  avg_contract_value: { value: 7280, growth: 4.1, vol: 0.05 },
  cash_collected_mtd: { value: 318400, growth: 9.8, vol: 0.06 },
  pipeline_value: { value: 1284000, growth: 14.2, vol: 0.05 },
  calls_taken: { value: 438, growth: 7.9, vol: 0.09, int: true },
  deals_won_mtd: { value: 120, growth: 6.1, vol: 0.1, int: true },
  avg_sales_cycle: { value: 10.4, growth: 6.5, vol: 0.06 },
  discount_rate: { value: 6.8, growth: 12.0, vol: 0.09 },
  followup_sla: { value: 91.2, growth: -2.4, vol: 0.03 },

  // Marketing
  cpl: { value: 41.6, growth: 9.7, vol: 0.07 },
  leads_total: { value: 1642, growth: 12.4, vol: 0.08, int: true },
  lead_to_audit: { value: 39.8, growth: 2.6, vol: 0.05 },
  audit_show_rate: { value: 68.4, growth: -3.1, vol: 0.05 },
  show_to_close: { value: 31.2, growth: -4.4, vol: 0.06 },
  revenue_per_lead: { value: 194, growth: 6.2, vol: 0.07 },
  ad_spend_mtd: { value: 68300, growth: 18.4, vol: 0.06 },
  roas: { value: 4.66, growth: -5.2, vol: 0.07 },
  ctr: { value: 2.04, growth: -8.1, vol: 0.08 },
  landing_conv: { value: 10.2, growth: 3.4, vol: 0.07 },

  // Funding
  funding_approval_rate: { value: 63.1, growth: 3.1, vol: 0.05 },
  avg_approval_amount: { value: 64800, growth: 7.6, vol: 0.06 },
  capital_approved_mtd: { value: 398500, growth: 12.1, vol: 0.07 },
  days_audit_to_approval: { value: 12.6, growth: -8.4, vol: 0.06 },
  days_approval_to_funding: { value: 6.8, growth: -4.2, vol: 0.07 },
  funding_map_accuracy: { value: 86.4, growth: 4.8, vol: 0.03 },
  apps_submitted: { value: 284, growth: 10.2, vol: 0.09, int: true },
  decline_rate: { value: 36.9, growth: -5.1, vol: 0.06 },
  lender_response_time: { value: 43.2, growth: -6.8, vol: 0.08 },
  stacking_efficiency: { value: 77.5, growth: 6.2, vol: 0.04 },

  // Operations
  tasks_on_time: { value: 89.4, growth: 2.1, vol: 0.03 },
  clients_stuck: { value: 8, growth: 33.0, vol: 0.18, int: true },
  docs_pending: { value: 47, growth: 14.6, vol: 0.14, int: true },
  clients_per_am: { value: 57, growth: 9.6, vol: 0.05, int: true },
  apps_processed: { value: 284, growth: 10.2, vol: 0.09, int: true },
  employee_sla: { value: 93.1, growth: 1.6, vol: 0.02 },
  first_response_time: { value: 2.4, growth: -11.0, vol: 0.1 },
  onboarding_time: { value: 4.6, growth: -7.4, vol: 0.07 },
  doc_rejection_rate: { value: 9.4, growth: -12.2, vol: 0.09 },
  automation_coverage: { value: 68.2, growth: 16.4, vol: 0.04 },

  // Customer Success
  retention_rate: { value: 91.3, growth: 1.4, vol: 0.02 },
  refund_requests: { value: 11, growth: 22.0, vol: 0.2, int: true },
  chargeback_rate: { value: 0.72, growth: 14.0, vol: 0.14 },
  referral_rate: { value: 19.4, growth: 12.6, vol: 0.07 },
  nps: { value: 52, growth: 8.3, vol: 0.04, int: true },
  support_tickets: { value: 64, growth: 8.4, vol: 0.12, int: true },
  csat: { value: 92.4, growth: 1.1, vol: 0.02 },
  ticket_resolution: { value: 9.8, growth: -9.2, vol: 0.09 },
  churned_clients: { value: 23, growth: -8.0, vol: 0.15, int: true },
  expansion_revenue: { value: 21800, growth: 18.6, vol: 0.1 },

  // Finance
  fin_mrr: { value: 85400, growth: 8.2, vol: 0.02 },
  arr: { value: 1024800, growth: 8.2, vol: 0.02 },
  cash_collected: { value: 318400, growth: 9.8, vol: 0.06 },
  outstanding_balances: { value: 152600, growth: 6.4, vol: 0.05 },
  refunds_mtd: { value: 14200, growth: 21.0, vol: 0.12 },
  gross_margin: { value: 71.4, growth: 2.2, vol: 0.02 },
  net_burn: { value: 38400, growth: -14.2, vol: 0.1 },
  runway: { value: 19.4, growth: 12.4, vol: 0.04 },
  cash_on_hand: { value: 744000, growth: 6.8, vol: 0.03 },
  dso: { value: 23.4, growth: -6.1, vol: 0.05 },
  opex_mtd: { value: 262400, growth: 7.4, vol: 0.04 },
  ltv: { value: 13860, growth: 7.2, vol: 0.03 },

  // CEG Brain
  audits_today: { value: 24, growth: 26.0, vol: 0.15, int: true },
  audits_week: { value: 143, growth: 22.4, vol: 0.1, int: true },
  audits_month: { value: 596, growth: 24.8, vol: 0.08, int: true },
  audit_completion_time: { value: 6.4, growth: -22.0, vol: 0.08 },
  audit_view_rate: { value: 81.6, growth: 5.4, vol: 0.03 },
  funding_map_click_rate: { value: 58.2, growth: 9.8, vol: 0.05 },
  audit_to_payment: { value: 21.4, growth: 4.6, vol: 0.07 },
  time_audit_to_payment: { value: 51.2, growth: -10.4, vol: 0.09 },
  ai_classifications: { value: 4180, growth: 28.0, vol: 0.09, int: true },
  ai_confidence: { value: 93.2, growth: 3.4, vol: 0.02 },
  human_review_rate: { value: 6.8, growth: -24.0, vol: 0.1 },
  brain_uptime: { value: 99.94, growth: 0.1, vol: 0.002 },
}

/** Cached 90-day series per metric. */
const seriesCache = new Map<string, SeriesPoint[]>()
export function seriesFor(metricId: string): SeriesPoint[] {
  if (!seriesCache.has(metricId)) {
    const spec = HEADLINES[metricId] ?? { value: 100, growth: 5 }
    seriesCache.set(
      metricId,
      buildSeries(metricId, spec.value, spec.growth, 90, { volatility: spec.vol, integer: spec.int }),
    )
  }
  return seriesCache.get(metricId)!
}

// ------------------------------------------------------------
// Executive: waterfall — "Where's the money?"
// ------------------------------------------------------------
export const MONEY_WATERFALL: WaterfallStage[] = [
  { stage: 'Leads', count: 1642, dollars: 318500, conversionFromPrev: null },
  { stage: 'Audits', count: 654, dollars: 254200, conversionFromPrev: 39.8 },
  { stage: 'Payments', count: 140, dollars: 1019200, conversionFromPrev: 21.4 },
  { stage: 'Approvals', count: 88, dollars: 5702400, conversionFromPrev: 63.1 },
  { stage: 'Funded', count: 61, dollars: 2412000, conversionFromPrev: 69.4 },
]

// ------------------------------------------------------------
// Executive: week-over-week movers
// ------------------------------------------------------------
export const WEEK_MOVERS = [
  { metricId: 'close_rate', label: 'Close Rate', current: '27.4%', prior: '29.8%', delta: -2.4, unit: 'pt', good: false },
  { metricId: 'mrr', label: 'MRR', current: '$85.4K', prior: '$83.1K', delta: 2.8, unit: '%', good: true },
  { metricId: 'cpl', label: 'CPL', current: '$41.60', prior: '$38.20', delta: 8.9, unit: '%', good: false },
  { metricId: 'funding_approval_rate', label: 'Approval Rate', current: '63.1%', prior: '61.4%', delta: 1.7, unit: 'pt', good: true },
  { metricId: 'clients_stuck', label: 'Clients Stuck >48h', current: '8', prior: '5', delta: 3, unit: '', good: false },
  { metricId: 'audits_week', label: 'Audits / Week', current: '143', prior: '128', delta: 11.7, unit: '%', good: true },
]

// ------------------------------------------------------------
// Alerts feed
// ------------------------------------------------------------
export const ALERTS: Alert[] = [
  {
    id: 'a1',
    severity: 'critical',
    title: 'Close rate dropped 2.4 pts week-over-week',
    detail: 'Now 27.4% vs 29.8% last week. Concentrated in Meta-sourced leads — show-to-close fell to 31.2%.',
    metricId: 'close_rate',
    dept: 'sales',
    ageMinutes: 42,
  },
  {
    id: 'a2',
    severity: 'critical',
    title: '8 clients stuck in stage 48+ hours',
    detail: 'Marcus Oyelaran (96h) and Priya Raghunathan (81h) are both waiting on bank statements.',
    metricId: 'clients_stuck',
    dept: 'operations',
    ageMinutes: 108,
  },
  {
    id: 'a3',
    severity: 'warning',
    title: 'CPL up 8.9% — Meta Retargeting driving it',
    detail: 'Retargeting CPL hit $58.40 against a $38 target. Frequency is at 4.1 on the same creative set.',
    metricId: 'cpl',
    dept: 'marketing',
    ageMinutes: 190,
  },
  {
    id: 'a4',
    severity: 'warning',
    title: 'Refund requests trending up',
    detail: '11 requests MTD vs 8 target. 6 of 11 cite "no approval within 30 days".',
    metricId: 'refund_requests',
    dept: 'success',
    ageMinutes: 320,
  },
  {
    id: 'a5',
    severity: 'success',
    title: 'Brain audit throughput at all-time high',
    detail: '143 audits this week (+11.7%). Avg completion time down to 6.4 min from 8.2 min.',
    metricId: 'audits_week',
    dept: 'brain',
    ageMinutes: 465,
  },
  {
    id: 'a6',
    severity: 'info',
    title: 'Chase Ink approval velocity improved',
    detail: 'Avg lender response down to 31h for Chase submissions — 12h faster than the portfolio average.',
    metricId: 'lender_response_time',
    dept: 'funding',
    ageMinutes: 610,
  },
]

// ------------------------------------------------------------
// Sales: closer leaderboard
// ------------------------------------------------------------
export const CLOSERS: Closer[] = [
  { id: 'c1', name: 'Dominique Bassett', initials: 'DB', callsTaken: 82, deals: 27, revenue: 214600, closeRate: 32.9, avgContract: 7948, cashCollected: 186400, quota: 180000 },
  { id: 'c2', name: 'Rafael Montenegro', initials: 'RM', callsTaken: 78, deals: 24, revenue: 191200, closeRate: 30.8, avgContract: 7967, cashCollected: 172800, quota: 180000 },
  { id: 'c3', name: 'Chelsea Nwachukwu', initials: 'CN', callsTaken: 74, deals: 21, revenue: 158900, closeRate: 28.4, avgContract: 7567, cashCollected: 141200, quota: 165000 },
  { id: 'c4', name: 'Aaron Kirkpatrick', initials: 'AK', callsTaken: 71, deals: 19, revenue: 132400, closeRate: 26.8, avgContract: 6968, cashCollected: 118600, quota: 165000 },
  { id: 'c5', name: 'Yasmine Delacroix', initials: 'YD', callsTaken: 68, deals: 17, revenue: 118700, closeRate: 25.0, avgContract: 6982, cashCollected: 102400, quota: 150000 },
  { id: 'c6', name: 'Tobias Ferreira', initials: 'TF', callsTaken: 65, deals: 12, revenue: 76300, closeRate: 18.5, avgContract: 6358, cashCollected: 64900, quota: 150000 },
]

export const DEAL_STAGES = [
  { stage: 'New Lead', count: 412, dollars: 0 },
  { stage: 'Audit Booked', count: 186, dollars: 0 },
  { stage: 'Audit Held', count: 128, dollars: 0 },
  { stage: 'Proposal Sent', count: 74, dollars: 538600 },
  { stage: 'Negotiation', count: 41, dollars: 412800 },
  { stage: 'Verbal Commit', count: 22, dollars: 332600 },
  { stage: 'Closed Won', count: 120, dollars: 873600 },
]

export const CLOSE_RATE_TREND = [
  { week: 'W18', rate: 29.1, target: 30 },
  { week: 'W19', rate: 30.4, target: 30 },
  { week: 'W20', rate: 31.2, target: 30 },
  { week: 'W21', rate: 30.8, target: 30 },
  { week: 'W22', rate: 29.6, target: 30 },
  { week: 'W23', rate: 30.2, target: 30 },
  { week: 'W24', rate: 31.0, target: 30 },
  { week: 'W25', rate: 30.1, target: 30 },
  { week: 'W26', rate: 28.9, target: 30 },
  { week: 'W27', rate: 29.4, target: 30 },
  { week: 'W28', rate: 29.8, target: 30 },
  { week: 'W29', rate: 27.4, target: 30 },
]

// ------------------------------------------------------------
// Marketing
// ------------------------------------------------------------
export const LEADS_BY_SOURCE = [
  { name: 'Meta Ads', value: 612, color: '#2563eb' },
  { name: 'Google Ads', value: 341, color: '#3b82f6' },
  { name: 'Organic / SEO', value: 248, color: '#60a5fa' },
  { name: 'Referral', value: 214, color: '#10b981' },
  { name: 'YouTube', value: 134, color: '#f59e0b' },
  { name: 'Email / List', value: 93, color: '#93c5fd' },
]

export const LEADS_BY_SOURCE_OVER_TIME = [
  { month: 'Feb', meta: 402, google: 218, organic: 168, referral: 122, youtube: 74 },
  { month: 'Mar', meta: 438, google: 241, organic: 181, referral: 138, youtube: 82 },
  { month: 'Apr', meta: 476, google: 268, organic: 194, referral: 152, youtube: 96 },
  { month: 'May', meta: 524, google: 292, organic: 208, referral: 168, youtube: 108 },
  { month: 'Jun', meta: 568, google: 318, organic: 226, referral: 191, youtube: 121 },
  { month: 'Jul', meta: 612, google: 341, organic: 248, referral: 214, youtube: 134 },
]

export const MARKETING_FUNNEL = [
  { stage: 'Impressions', count: 1284000, pct: 100 },
  { stage: 'Clicks', count: 26194, pct: 2.04 },
  { stage: 'Leads', count: 1642, pct: 6.27 },
  { stage: 'Audits Booked', count: 654, pct: 39.8 },
  { stage: 'Audits Held', count: 447, pct: 68.4 },
  { stage: 'Closed Won', count: 140, pct: 31.2 },
]

export const CAMPAIGNS: Campaign[] = [
  { id: 'cp1', name: 'Business Credit Blueprint — Broad', channel: 'Meta', spend: 24800, leads: 682, cpl: 36.4, audits: 284, closes: 61, revenue: 442400, roas: 17.8 },
  { id: 'cp2', name: 'Funding Map Lead Magnet', channel: 'Meta', spend: 14200, leads: 386, cpl: 36.8, audits: 158, closes: 34, revenue: 248600, roas: 17.5 },
  { id: 'cp3', name: 'Search — "business funding"', channel: 'Google', spend: 16400, leads: 298, cpl: 55.0, audits: 132, closes: 26, revenue: 194800, roas: 11.9 },
  { id: 'cp4', name: 'Meta Retargeting — 30d viewers', channel: 'Meta', spend: 6200, leads: 106, cpl: 58.4, audits: 48, closes: 12, revenue: 88400, roas: 14.3 },
  { id: 'cp5', name: 'YouTube Pre-roll — Case Studies', channel: 'YouTube', spend: 4900, leads: 134, cpl: 36.6, audits: 44, closes: 8, revenue: 58200, roas: 11.9 },
  { id: 'cp6', name: 'Partner Referral Program', channel: 'Referral', spend: 1800, leads: 214, cpl: 8.4, audits: 118, closes: 38, revenue: 296400, roas: 164.7 },
  { id: 'cp7', name: 'Nurture Sequence — Cold List', channel: 'Email', spend: 800, leads: 93, cpl: 8.6, audits: 31, closes: 6, revenue: 42800, roas: 53.5 },
]

// ------------------------------------------------------------
// Funding
// ------------------------------------------------------------
export const APPROVALS_BY_PRODUCT = [
  { product: 'Business Credit Card', approved: 42, declined: 18, amount: 1284000 },
  { product: 'Line of Credit', approved: 21, declined: 14, amount: 986000 },
  { product: 'SBA Term Loan', approved: 11, declined: 9, amount: 1420000 },
  { product: 'Equipment Finance', approved: 9, declined: 4, amount: 612000 },
  { product: 'Revenue-Based', approved: 5, declined: 6, amount: 248000 },
]

export const DAYS_IN_STAGE_HISTOGRAM = [
  { bucket: '0–3d', count: 46 },
  { bucket: '4–7d', count: 68 },
  { bucket: '8–11d', count: 54 },
  { bucket: '12–15d', count: 38 },
  { bucket: '16–20d', count: 22 },
  { bucket: '21–30d', count: 14 },
  { bucket: '30d+', count: 6 },
]

export const FUNDING_DEALS: FundingDeal[] = [
  { id: 'f1', client: 'Marcus Oyelaran', product: 'Business Credit Card', requested: 85000, approved: null, stage: 'Underwriting', lender: 'Chase Ink', daysInStage: 4, owner: 'Nadia Okonkwo' },
  { id: 'f2', client: 'Priya Raghunathan', product: 'SBA Term Loan', requested: 240000, approved: null, stage: 'Submitted', lender: 'Live Oak Bank', daysInStage: 7, owner: 'Devon Whitmore' },
  { id: 'f3', client: 'Isabella Marchetti', product: 'Line of Credit', requested: 120000, approved: 95000, stage: 'Approved', lender: 'Bluevine', daysInStage: 2, owner: 'Nadia Okonkwo' },
  { id: 'f4', client: 'Terrence Bouvier', product: 'Equipment Finance', requested: 178000, approved: 178000, stage: 'Funded', lender: 'Balboa Capital', daysInStage: 1, owner: 'Devon Whitmore' },
  { id: 'f5', client: 'Anastasia Volkova', product: 'Business Credit Card', requested: 62000, approved: null, stage: 'Funding Map', lender: '—', daysInStage: 3, owner: 'Camille Rousseau' },
  { id: 'f6', client: 'Jamal Abernathy', product: 'Revenue-Based', requested: 95000, approved: null, stage: 'Underwriting', lender: 'Fundbox', daysInStage: 9, owner: 'Camille Rousseau' },
  { id: 'f7', client: 'Sofia Castellanos', product: 'Line of Credit', requested: 140000, approved: 110000, stage: 'Approved', lender: 'American Express', daysInStage: 5, owner: 'Nadia Okonkwo' },
  { id: 'f8', client: 'Nathaniel Okwuosa', product: 'SBA Term Loan', requested: 310000, approved: null, stage: 'Audit', lender: '—', daysInStage: 2, owner: 'Devon Whitmore' },
  { id: 'f9', client: 'Genevieve Laurent', product: 'Business Credit Card', requested: 74000, approved: 74000, stage: 'Funded', lender: 'Capital One', daysInStage: 1, owner: 'Camille Rousseau' },
  { id: 'f10', client: 'Dmitri Kovalenko', product: 'Equipment Finance', requested: 210000, approved: null, stage: 'Submitted', lender: 'Crest Capital', daysInStage: 6, owner: 'Nadia Okonkwo' },
  { id: 'f11', client: 'Aaliyah Thibodeaux', product: 'Line of Credit', requested: 88000, approved: null, stage: 'Declined', lender: 'Bluevine', daysInStage: 11, owner: 'Devon Whitmore' },
  { id: 'f12', client: 'Hiroshi Nakamura', product: 'Revenue-Based', requested: 130000, approved: 104000, stage: 'Approved', lender: 'Clearco', daysInStage: 3, owner: 'Camille Rousseau' },
]

// ------------------------------------------------------------
// Operations: at-risk clients
// ------------------------------------------------------------
export const AT_RISK_CLIENTS: AtRiskClient[] = [
  { id: 'r1', name: 'Marcus Oyelaran', company: 'Oyelaran Logistics LLC', stage: 'Underwriting', hoursStuck: 96, owner: 'Nadia Okonkwo', value: 85000, reason: 'Missing 3 months of bank statements', severity: 'high' },
  { id: 'r2', name: 'Priya Raghunathan', company: 'Saffron Kitchen Group', stage: 'Document Collection', hoursStuck: 81, owner: 'Devon Whitmore', value: 240000, reason: 'Unsigned 4506-C form', severity: 'high' },
  { id: 'r3', name: 'Jamal Abernathy', company: 'Abernathy Fitness Co.', stage: 'Underwriting', hoursStuck: 74, owner: 'Camille Rousseau', value: 95000, reason: 'Lender requested revised P&L', severity: 'high' },
  { id: 'r4', name: 'Anastasia Volkova', company: 'Volkova Design Studio', stage: 'Funding Map Review', hoursStuck: 68, owner: 'Camille Rousseau', value: 62000, reason: 'Has not viewed Funding Map', severity: 'medium' },
  { id: 'r5', name: 'Dmitri Kovalenko', company: 'Kovalenko Machining', stage: 'Submitted', hoursStuck: 61, owner: 'Nadia Okonkwo', value: 210000, reason: 'Awaiting lender acknowledgement', severity: 'medium' },
  { id: 'r6', name: 'Nathaniel Okwuosa', company: 'Okwuosa Property Partners', stage: 'Audit Prep', hoursStuck: 57, owner: 'Devon Whitmore', value: 310000, reason: 'Entity docs not uploaded', severity: 'medium' },
  { id: 'r7', name: 'Aaliyah Thibodeaux', company: 'Thibodeaux Events', stage: 'Post-Decline Rework', hoursStuck: 52, owner: 'Devon Whitmore', value: 88000, reason: 'Needs new lender assignment', severity: 'low' },
  { id: 'r8', name: 'Sofia Castellanos', company: 'Castellanos Dental Group', stage: 'Approved — Pending Accept', hoursStuck: 49, owner: 'Nadia Okonkwo', value: 110000, reason: 'Offer expires in 36 hours', severity: 'low' },
]

export const AM_LOAD = [
  { name: 'Nadia Okonkwo', clients: 68, capacity: 55, onTime: 91 },
  { name: 'Devon Whitmore', clients: 61, capacity: 55, onTime: 87 },
  { name: 'Camille Rousseau', clients: 54, capacity: 55, onTime: 94 },
  { name: 'Elias Vandermeer', clients: 49, capacity: 55, onTime: 96 },
  { name: 'Rosalind Achebe', clients: 44, capacity: 55, onTime: 92 },
  { name: 'Beatriz Sandoval', clients: 38, capacity: 55, onTime: 89 },
]

export const TASK_COMPLETION = [
  { week: 'W23', onTime: 88, late: 12 },
  { week: 'W24', onTime: 90, late: 10 },
  { week: 'W25', onTime: 91, late: 9 },
  { week: 'W26', onTime: 87, late: 13 },
  { week: 'W27', onTime: 90, late: 10 },
  { week: 'W28', onTime: 92, late: 8 },
  { week: 'W29', onTime: 89, late: 11 },
]

// ------------------------------------------------------------
// Customer Success
// ------------------------------------------------------------
export const NPS_DISTRIBUTION = [
  { band: 'Promoters (9–10)', count: 186, color: '#10b981' },
  { band: 'Passives (7–8)', count: 94, color: '#f59e0b' },
  { band: 'Detractors (0–6)', count: 60, color: '#ef4444' },
]

export const NPS_TREND = [
  { month: 'Feb', nps: 44, csat: 89.8 },
  { month: 'Mar', nps: 46, csat: 90.4 },
  { month: 'Apr', nps: 47, csat: 91.1 },
  { month: 'May', nps: 49, csat: 91.6 },
  { month: 'Jun', nps: 50, csat: 92.0 },
  { month: 'Jul', nps: 52, csat: 92.4 },
]

export const RETENTION_COHORTS = [
  { cohort: 'Feb 2026', size: 58, m1: 100, m2: 96, m3: 93, m4: 90, m5: 88, m6: 86 },
  { cohort: 'Mar 2026', size: 64, m1: 100, m2: 97, m3: 94, m4: 92, m5: 90, m6: null },
  { cohort: 'Apr 2026', size: 71, m1: 100, m2: 96, m3: 93, m4: 91, m5: null, m6: null },
  { cohort: 'May 2026', size: 78, m1: 100, m2: 97, m3: 95, m4: null, m5: null, m6: null },
  { cohort: 'Jun 2026', size: 84, m1: 100, m2: 98, m3: null, m4: null, m5: null, m6: null },
  { cohort: 'Jul 2026', size: 91, m1: 100, m2: null, m3: null, m4: null, m5: null, m6: null },
]

export const TICKET_CATEGORIES = [
  { category: 'Document upload help', count: 18 },
  { category: 'Approval status', count: 16 },
  { category: 'Billing / invoice', count: 11 },
  { category: 'Funding Map questions', count: 9 },
  { category: 'Login / access', count: 6 },
  { category: 'Refund request', count: 4 },
]

// ------------------------------------------------------------
// Finance
// ------------------------------------------------------------
export const MRR_WATERFALL = [
  { label: 'Starting MRR', value: 78900, type: 'total' as const },
  { label: 'New', value: 12400, type: 'inc' as const },
  { label: 'Expansion', value: 3800, type: 'inc' as const },
  { label: 'Reactivation', value: 1200, type: 'inc' as const },
  { label: 'Contraction', value: -2600, type: 'dec' as const },
  { label: 'Churn', value: -8300, type: 'dec' as const },
  { label: 'Ending MRR', value: 85400, type: 'total' as const },
]

export const CASH_TREND = [
  { month: 'Feb', collected: 248000, opex: 214000, cash: 612000 },
  { month: 'Mar', collected: 266000, opex: 226000, cash: 648000 },
  { month: 'Apr', collected: 281000, opex: 238000, cash: 682000 },
  { month: 'May', collected: 294000, opex: 246000, cash: 704000 },
  { month: 'Jun', collected: 306000, opex: 254000, cash: 726000 },
  { month: 'Jul', collected: 318400, opex: 262400, cash: 744000 },
]

export const AR_AGING = [
  { bucket: 'Current', amount: 84200 },
  { bucket: '1–30 days', amount: 38600 },
  { bucket: '31–60 days', amount: 18400 },
  { bucket: '61–90 days', amount: 8200 },
  { bucket: '90+ days', amount: 3200 },
]

// ------------------------------------------------------------
// CEG Brain
// ------------------------------------------------------------
export const AUDIT_TO_PAYMENT_HISTOGRAM = [
  { bucket: '<6h', count: 18 },
  { bucket: '6–12h', count: 26 },
  { bucket: '12–24h', count: 34 },
  { bucket: '24–48h', count: 28 },
  { bucket: '48–72h', count: 16 },
  { bucket: '72h–7d', count: 12 },
  { bucket: '7d+', count: 6 },
]

export const AUDIT_VOLUME_TREND = [
  { week: 'W23', audits: 112, viewed: 88, mapClicks: 61 },
  { week: 'W24', audits: 118, viewed: 94, mapClicks: 66 },
  { week: 'W25', audits: 124, viewed: 99, mapClicks: 70 },
  { week: 'W26', audits: 121, viewed: 97, mapClicks: 69 },
  { week: 'W27', audits: 132, viewed: 107, mapClicks: 76 },
  { week: 'W28', audits: 128, viewed: 104, mapClicks: 74 },
  { week: 'W29', audits: 143, viewed: 117, mapClicks: 83 },
]

export const AI_MODEL_HEALTH = [
  { model: 'Tradeline Classifier', calls: 1840, confidence: 95.4, review: 4.2 },
  { model: 'Fundability Scorer', calls: 1120, confidence: 93.8, review: 6.1 },
  { model: 'Statement Parser', calls: 684, confidence: 91.2, review: 9.4 },
  { model: 'Funding Map Matcher', calls: 412, confidence: 90.6, review: 11.2 },
  { model: 'Derogatory Extractor', calls: 124, confidence: 88.4, review: 14.8 },
]

// ------------------------------------------------------------
// Employees (12) — professional scorecard, no gamification
// ------------------------------------------------------------
export const EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Dominique Bassett', role: 'Senior Closer', department: 'Sales', tenureMonths: 26, weekScore: 118, targetScore: 100, kpis: [{ label: 'Close Rate', value: '32.9%', target: '30%', hit: true }, { label: 'Revenue', value: '$214.6K', target: '$180K', hit: true }, { label: 'Calls Taken', value: '82', target: '75', hit: true }] },
  { id: 'e2', name: 'Rafael Montenegro', role: 'Senior Closer', department: 'Sales', tenureMonths: 19, weekScore: 106, targetScore: 100, kpis: [{ label: 'Close Rate', value: '30.8%', target: '30%', hit: true }, { label: 'Revenue', value: '$191.2K', target: '$180K', hit: true }, { label: 'Calls Taken', value: '78', target: '75', hit: true }] },
  { id: 'e3', name: 'Chelsea Nwachukwu', role: 'Closer', department: 'Sales', tenureMonths: 11, weekScore: 96, targetScore: 100, kpis: [{ label: 'Close Rate', value: '28.4%', target: '30%', hit: false }, { label: 'Revenue', value: '$158.9K', target: '$165K', hit: false }, { label: 'Calls Taken', value: '74', target: '70', hit: true }] },
  { id: 'e4', name: 'Aaron Kirkpatrick', role: 'Closer', department: 'Sales', tenureMonths: 8, weekScore: 88, targetScore: 100, kpis: [{ label: 'Close Rate', value: '26.8%', target: '30%', hit: false }, { label: 'Revenue', value: '$132.4K', target: '$165K', hit: false }, { label: 'Calls Taken', value: '71', target: '70', hit: true }] },
  { id: 'e5', name: 'Nadia Okonkwo', role: 'Account Manager', department: 'Operations', tenureMonths: 22, weekScore: 94, targetScore: 100, kpis: [{ label: 'Tasks On Time', value: '91%', target: '92%', hit: false }, { label: 'Active Clients', value: '68', target: '55', hit: false }, { label: 'First Response', value: '1.8h', target: '2h', hit: true }] },
  { id: 'e6', name: 'Devon Whitmore', role: 'Account Manager', department: 'Operations', tenureMonths: 15, weekScore: 86, targetScore: 100, kpis: [{ label: 'Tasks On Time', value: '87%', target: '92%', hit: false }, { label: 'Active Clients', value: '61', target: '55', hit: false }, { label: 'First Response', value: '2.6h', target: '2h', hit: false }] },
  { id: 'e7', name: 'Camille Rousseau', role: 'Funding Specialist', department: 'Funding', tenureMonths: 30, weekScore: 112, targetScore: 100, kpis: [{ label: 'Approval Rate', value: '68.2%', target: '65%', hit: true }, { label: 'Apps Submitted', value: '94', target: '85', hit: true }, { label: 'Days to Approval', value: '10.4', target: '11', hit: true }] },
  { id: 'e8', name: 'Elias Vandermeer', role: 'Funding Specialist', department: 'Funding', tenureMonths: 13, weekScore: 101, targetScore: 100, kpis: [{ label: 'Approval Rate', value: '64.1%', target: '65%', hit: false }, { label: 'Apps Submitted', value: '88', target: '85', hit: true }, { label: 'Days to Approval', value: '10.8', target: '11', hit: true }] },
  { id: 'e9', name: 'Rosalind Achebe', role: 'Marketing Manager', department: 'Marketing', tenureMonths: 18, weekScore: 92, targetScore: 100, kpis: [{ label: 'CPL', value: '$41.60', target: '$38', hit: false }, { label: 'Leads', value: '1,642', target: '1,750', hit: false }, { label: 'ROAS', value: '4.66x', target: '5.0x', hit: false }] },
  { id: 'e10', name: 'Beatriz Sandoval', role: 'Success Manager', department: 'Customer Success', tenureMonths: 9, weekScore: 104, targetScore: 100, kpis: [{ label: 'Retention', value: '91.3%', target: '92%', hit: false }, { label: 'NPS', value: '52', target: '55', hit: false }, { label: 'Resolution Time', value: '8.4h', target: '9h', hit: true }] },
  { id: 'e11', name: 'Julian Fairweather', role: 'Controller', department: 'Finance', tenureMonths: 34, weekScore: 108, targetScore: 100, kpis: [{ label: 'Gross Margin', value: '71.4%', target: '72%', hit: false }, { label: 'DSO', value: '23.4d', target: '21d', hit: false }, { label: 'Close Cycle', value: '4 days', target: '5 days', hit: true }] },
  { id: 'e12', name: 'Simone Adeyemi', role: 'Data / Brain Ops', department: 'CEG Brain', tenureMonths: 7, weekScore: 114, targetScore: 100, kpis: [{ label: 'Brain Uptime', value: '99.94%', target: '99.9%', hit: true }, { label: 'AI Confidence', value: '93.2%', target: '92%', hit: true }, { label: 'Human Review', value: '6.8%', target: '8%', hit: true }] },
]

export const DEPARTMENTS_LIST = [
  'Executive', 'Sales', 'Marketing', 'Funding', 'Operations', 'Customer Success', 'Finance', 'CEG Brain',
]

// ------------------------------------------------------------
// Forecasting baseline (12-month rolling)
// ------------------------------------------------------------
export const FORECAST_MONTHS = [
  'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dec 26',
  'Jan 27', 'Feb 27', 'Mar 27', 'Apr 27', 'May 27', 'Jun 27', 'Jul 27',
]

export const FORECAST_BASE = {
  mrr0: 85400,
  mrrGrowth: 0.062, // monthly
  capital0: 402000, // monthly capital facilitated
  capitalGrowth: 0.048,
  ltvCac0: 4.2,
  cpl0: 41.6,
  closeRate0: 27.4,
  retention0: 91.3,
}

// ------------------------------------------------------------
// AI Weekly CEO Briefings
// ------------------------------------------------------------
export const BRIEFINGS: Briefing[] = [
  {
    id: 'b29',
    weekOf: 'Week of July 20, 2026',
    headline: 'Revenue engine is compounding, but the top of the funnel is getting expensive.',
    healthScore: 78,
    scoreDelta: 2,
    tldr: [
      'MRR crossed $85.4K (+2.8% WoW, +8.2% over 90 days) on the strength of referral-sourced closes and $3.8K of expansion revenue.',
      'Close rate fell 2.4 points to 27.4% — the drop is isolated to Meta-sourced leads, where show-to-close dropped to 31.2% while referral leads held at 41.6%.',
      'CEG Brain hit an all-time throughput high (143 audits, 6.4 min average) which is quietly the biggest margin lever in the business right now.',
    ],
    wins: [
      { title: 'Referral program is now the highest-ROAS channel by a wide margin', detail: '$1.8K of spend produced 214 leads and 38 closes — a 164.7x ROAS and an $8.40 CPL. Referral leads also close at 41.6% versus 27.4% blended. This channel is under-funded relative to its return.' },
      { title: 'Brain audit throughput up 11.7% with completion time down 22%', detail: '143 audits completed this week at 6.4 minutes average, down from 8.2 minutes 90 days ago. Human review rate fell to 6.8% as the Tradeline Classifier reached 95.4% average confidence. Every point of review-rate reduction is roughly 14 analyst hours a month.' },
      { title: 'Funding velocity improved on both sides of the approval', detail: 'Days from audit to approval fell to 12.6 (-8.4%), and approval to funding to 6.8 days (-4.2%). Chase Ink is now responding in 31 hours against a 43-hour portfolio average — worth re-weighting in the Funding Map.' },
      { title: 'Capital facilitated YTD reached $2.41M against a $3.0M annual target', detail: 'At the current $402K monthly run rate, the year lands at roughly $3.2M — 7% ahead of plan. Average approval amount rose to $64.8K (+7.6%).' },
    ],
    losses: [
      { title: 'CPL rose 8.9% to $41.60, breaking the $38 target for a third straight week', detail: 'Meta Retargeting is the outlier at $58.40 CPL with creative frequency at 4.1. The broad Business Credit Blueprint campaign still performs at $36.40, so this is a creative-fatigue problem, not a channel problem.' },
      { title: 'Close rate at 27.4% — lowest reading in 12 weeks', detail: 'Audit show rate also slipped to 68.4% against a 72% target. Two closers (Tobias Ferreira at 18.5%, Yasmine Delacroix at 25.0%) account for most of the gap; the top four closers are all at or above 26.8%.' },
      { title: 'Operations is carrying more load than headcount supports', detail: '8 clients are stuck past 48 hours versus a tolerance of 4. Nadia Okonkwo (68 clients) and Devon Whitmore (61) are both over the 55-client capacity line, and Devon\'s on-time rate has fallen to 87%.' },
      { title: 'Refunds and chargebacks both moved the wrong way', detail: '11 refund requests MTD against an 8 target, and chargeback rate is at 0.72% versus 0.60%. Six of eleven refund reasons cite "no approval within 30 days" — this is a funding-velocity symptom, not a success-team failure.' },
    ],
    anomalies: [
      { title: 'Meta Retargeting CPL is 40% above the next-worst campaign', detail: 'Frequency 4.1, CTR down to 1.42% from 2.31% four weeks ago. Same three creatives running since June 12.', severity: 'high' },
      { title: 'Marcus Oyelaran has been in Underwriting for 96 hours', detail: '$85K Chase Ink application blocked on three months of bank statements. This is the single largest stalled deal by days, not dollars.', severity: 'high' },
      { title: 'SBA Term Loan approval rate is 55% versus 70% for credit cards', detail: 'Only 11 of 20 SBA submissions approved, but average approved amount is $129K — worth improving rather than de-emphasising.', severity: 'medium' },
      { title: 'Audit view rate (81.6%) far exceeds Funding Map click rate (58.2%)', detail: 'A 23-point drop-off between viewing the audit and opening the Funding Map. Clients who click the map convert to payment at roughly 2.4x the rate of those who do not.', severity: 'medium' },
    ],
    actions: [
      { owner: 'Rosalind Achebe (Marketing)', action: 'Pause Meta Retargeting creative set and ship three new variants built from the Q2 case-study library; cap frequency at 2.5.', impact: 'Est. CPL back to $37–39 within 10 days', due: 'Aug 3' },
      { owner: 'Rosalind Achebe (Marketing)', action: 'Reallocate $6K/month from Google Search (CPL $55.00) into the Partner Referral Program.', impact: '+~90 leads/mo at a 41.6% close rate', due: 'Aug 5' },
      { owner: 'Sales Leadership', action: 'Run structured call reviews with Tobias Ferreira and Yasmine Delacroix; re-run the objection-handling module on funding-timeline expectations.', impact: '+1.5–2.0 pts blended close rate', due: 'Aug 7' },
      { owner: 'Operations', action: 'Rebalance 18 accounts off Nadia Okonkwo and Devon Whitmore onto Beatriz Sandoval and Rosalind Achebe to bring everyone under 55.', impact: 'Clients stuck >48h back under 5', due: 'Jul 31' },
      { owner: 'CEG Brain / Product', action: 'Add an in-audit Funding Map prompt plus a 24-hour email nudge for clients who viewed the audit but not the map.', impact: 'Close the 23-pt view-to-map gap; est. +2 pts audit→payment', due: 'Aug 12' },
      { owner: 'Funding', action: 'Re-weight the Funding Map toward Chase Ink and Bluevine based on 31h and 34h response times.', impact: '-1.5 days audit→approval', due: 'Aug 6' },
    ],
    deepDives: [
      { label: 'Sales', path: '/sales', note: 'Closer-level close rate and the Ferreira/Delacroix gap' },
      { label: 'Marketing', path: '/marketing', note: 'Campaign-level CPL and the retargeting fatigue curve' },
      { label: 'Funding', path: '/funding', note: 'Approval rates by product and days-in-stage distribution' },
      { label: 'Operations', path: '/operations', note: 'The 8 stuck clients and account-manager load' },
      { label: 'CEG Brain', path: '/brain', note: 'Audit view vs Funding Map click drop-off' },
    ],
  },
]

export const BRIEFING_ARCHIVE = [
  { id: 'b29', weekOf: 'Jul 20, 2026', headline: 'Revenue compounding, top of funnel getting expensive', score: 78, delta: 2, current: true },
  { id: 'b28', weekOf: 'Jul 13, 2026', headline: 'Brain throughput record; ops capacity is the new constraint', score: 76, delta: 1, current: false },
  { id: 'b27', weekOf: 'Jul 6, 2026', headline: 'Referral channel outperforms paid on every metric', score: 75, delta: 3, current: false },
  { id: 'b26', weekOf: 'Jun 29, 2026', headline: 'Approval rate recovers past 61% after lender re-weighting', score: 72, delta: 2, current: false },
  { id: 'b25', weekOf: 'Jun 22, 2026', headline: 'Q2 closes ahead of plan; DSO creeping up', score: 70, delta: -1, current: false },
  { id: 'b24', weekOf: 'Jun 15, 2026', headline: 'Ad spend up 18% with flat lead volume — creative review needed', score: 71, delta: 0, current: false },
  { id: 'b23', weekOf: 'Jun 8, 2026', headline: 'MRR crosses $80K; expansion revenue doubles', score: 71, delta: 4, current: false },
  { id: 'b22', weekOf: 'Jun 1, 2026', headline: 'Onboarding time cut to under 5 days after automation release', score: 67, delta: 2, current: false },
]

// ------------------------------------------------------------
// Sync status per system of record
// ------------------------------------------------------------
export const SYNC_STATUS = [
  { source: 'HubSpot' as const, status: 'live' as const, lastSync: '2 min ago' },
  { source: 'Firebase' as const, status: 'live' as const, lastSync: '38 sec ago' },
  { source: 'CEG Brain' as const, status: 'live' as const, lastSync: '1 min ago' },
  { source: 'Stripe' as const, status: 'live' as const, lastSync: '4 min ago' },
  { source: 'Meta Ads' as const, status: 'stale' as const, lastSync: '3 hrs ago' },
  { source: 'Google Ads' as const, status: 'live' as const, lastSync: '12 min ago' },
  { source: 'QuickBooks' as const, status: 'live' as const, lastSync: '26 min ago' },
  { source: 'Plaid' as const, status: 'live' as const, lastSync: '18 min ago' },
  { source: 'Manual' as const, status: 'stale' as const, lastSync: '2 days ago' },
]

// ------------------------------------------------------------
// Investor portal — deliberately narrow surface
// ------------------------------------------------------------
export const INVESTOR_SNAPSHOT = {
  asOf: 'July 28, 2026',
  mrr: 85400,
  mrrMoM: 6.2,
  mrrYoY: 71.4,
  capitalYTD: 2412000,
  capitalYoY: 58.2,
  activeClients: 340,
  clientsMoM: 3.8,
  clientLTV: 13860,
  ltvYoY: 12.4,
  arr: 1024800,
  mrrHistory: [
    { month: 'Aug 25', mrr: 49800 },
    { month: 'Sep 25', mrr: 52400 },
    { month: 'Oct 25', mrr: 55900 },
    { month: 'Nov 25', mrr: 58200 },
    { month: 'Dec 25', mrr: 61400 },
    { month: 'Jan 26', mrr: 64800 },
    { month: 'Feb 26', mrr: 68100 },
    { month: 'Mar 26', mrr: 71600 },
    { month: 'Apr 26', mrr: 75200 },
    { month: 'May 26', mrr: 78900 },
    { month: 'Jun 26', mrr: 80400 },
    { month: 'Jul 26', mrr: 85400 },
  ],
  capitalHistory: [
    { month: 'Jan', capital: 268000 },
    { month: 'Feb', capital: 294000 },
    { month: 'Mar', capital: 322000 },
    { month: 'Apr', capital: 358000 },
    { month: 'May', capital: 384000 },
    { month: 'Jun', capital: 384000 },
    { month: 'Jul', capital: 402000 },
  ],
}
