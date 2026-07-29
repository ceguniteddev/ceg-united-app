// ============================================================
// CEG Brain KPI OS v3.0 — Shared Types
// These types form the contract between the dashboard UI and
// ANY data source. The mock adapter and the live Firebase /
// HubSpot adapters both satisfy `KPIAdapter`.
// ============================================================

/** Systems of record. Rendered as the "source" chip on every tile. */
export type MetricSource =
  | "HubSpot"
  | "Firebase"
  | "CEG Brain"
  | "Meta Ads"
  | "Google Ads"
  | "Stripe"
  | "QuickBooks"
  | "Plaid"
  | "Manual";

/** How a raw number is rendered. */
export type MetricFormat =
  | "currency"
  | "currencyK"
  | "percent"
  | "number"
  | "ratio"
  | "days"
  | "hours"
  | "score"
  | "minutes";

export type Department =
  | "executive"
  | "sales"
  | "marketing"
  | "funding"
  | "operations"
  | "success"
  | "finance"
  | "brain";

export type DateRangeKey =
  | "today"
  | "week"
  | "month"
  | "quarter"
  | "ytd"
  | "custom";

export type MetricStatus = "ok" | "warn" | "danger" | "neutral";

/** Static definition of a metric — registry entry. */
export interface MetricDef {
  id: string;
  label: string;
  format: MetricFormat;
  source: MetricSource;
  dept: Department;
  /** Target used for status colouring and scorecards. */
  target?: number;
  /** false when lower numbers are better (CPL, burn, refunds, days-in-stage). */
  higherIsBetter?: boolean;
  /** Short definition surfaced in the tile tooltip. */
  description?: string;
  /** Optional prefix/suffix override. */
  unit?: string;
}

export interface SeriesPoint {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  value: number;
}

/** The resolved, render-ready shape returned by `useKPI`. */
export interface KPIValue extends MetricDef {
  value: number;
  /** Value for the immediately preceding comparable period. */
  previous: number;
  /** Percent change vs previous period, signed. */
  delta: number;
  /** Absolute change vs previous period, signed. */
  deltaAbs: number;
  higherIsBetter: boolean;
  status: MetricStatus;
  /** Daily history for the active range, oldest → newest. */
  series: SeriesPoint[];
  /** ISO timestamp of the last successful sync from `source`. */
  updatedAt: string;
}

/** Async envelope so the live adapter can report loading/error. */
export interface KPIResult {
  data: KPIValue | null;
  loading: boolean;
  error: Error | null;
}

// ------------------------------------------------------------
// Domain records
// ------------------------------------------------------------

export interface Closer {
  id: string;
  name: string;
  initials: string;
  callsTaken: number;
  deals: number;
  revenue: number;
  closeRate: number;
  avgContract: number;
  cashCollected: number;
  quota: number;
}

export interface Campaign {
  id: string;
  name: string;
  channel:
    | "Meta"
    | "Google"
    | "YouTube"
    | "TikTok"
    | "Email"
    | "Referral"
    | "Organic";
  spend: number;
  leads: number;
  cpl: number;
  audits: number;
  closes: number;
  revenue: number;
  roas: number;
}

export interface FundingDeal {
  id: string;
  client: string;
  product:
    | "Business Credit Card"
    | "SBA Term Loan"
    | "Equipment Finance"
    | "Line of Credit"
    | "Revenue-Based";
  requested: number;
  approved: number | null;
  stage:
    | "Audit"
    | "Funding Map"
    | "Submitted"
    | "Underwriting"
    | "Approved"
    | "Funded"
    | "Declined";
  lender: string;
  daysInStage: number;
  owner: string;
}

export interface AtRiskClient {
  id: string;
  name: string;
  company: string;
  stage: string;
  hoursStuck: number;
  owner: string;
  value: number;
  reason: string;
  severity: "high" | "medium" | "low";
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  kpis: { label: string; value: string; target: string; hit: boolean }[];
  weekScore: number;
  targetScore: number;
  tenureMonths: number;
}

export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  detail: string;
  metricId?: string;
  dept: Department;
  ageMinutes: number;
}

export interface WaterfallStage {
  stage: string;
  count: number;
  dollars: number;
  conversionFromPrev: number | null;
}

export interface Briefing {
  id: string;
  weekOf: string;
  headline: string;
  healthScore: number;
  scoreDelta: number;
  tldr: string[];
  wins: { title: string; detail: string }[];
  losses: { title: string; detail: string }[];
  anomalies: {
    title: string;
    detail: string;
    severity: "high" | "medium" | "low";
  }[];
  actions: { owner: string; action: string; impact: string; due: string }[];
  deepDives: { label: string; path: string; note: string }[];
}

// ------------------------------------------------------------
// Adapter contract
// ------------------------------------------------------------

export interface KPIAdapter {
  name: string;
  /** Optional initialization method for async/live adapters */
  init?(): void;
  /** Resolve one metric for a date range. */
  getMetric(metricId: string, range: DateRangeKey): KPIValue | null;
  /** Sync freshness per source system, for the top-bar indicator. */
  getSyncStatus(): {
    source: MetricSource;
    status: "live" | "stale" | "error";
    lastSync: string;
  }[];
}
