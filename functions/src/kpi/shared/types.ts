/**
 * shared/types.ts
 * ----------------------------------------------------------------------------
 * Canonical shared types for the CEG Brain KPI Operating System v3.0.
 *
 * Imported by:
 *   - every file in /adapters
 *   - every file in /functions/src
 *   - shared/kpi-registry.ts
 *   - shared/forecast-model.ts
 *   - (frontend) dashboard consumes the same shapes over the Firestore/API wire
 *
 * Keep this file dependency-free (no SDK imports) so it can be shared safely
 * between Node (Cloud Functions), adapters, and the browser dashboard bundle.
 * ----------------------------------------------------------------------------
 */

/** ISO-8601 date string, e.g. "2026-07-28" */
export type ISODateString = string;

/** Inclusive date range used by every adapter's fetch() call. */
export interface DateRange {
  /** Inclusive start date, ISO-8601 (YYYY-MM-DD). */
  start: ISODateString;
  /** Inclusive end date, ISO-8601 (YYYY-MM-DD). */
  end: ISODateString;
}

/** Supported display/format hints for rendering a KPI value in the dashboard. */
export type MetricFormat =
  | "number"
  | "percent"
  | "currency"
  | "days"
  | "hours"
  | "ratio"
  | "score";

/**
 * A single computed metric value returned by an adapter's fetch().
 * `value` is always the raw numeric value (e.g. 0.27 for 27%, not "27%").
 */
export interface MetricValue {
  /** Raw numeric value. Percentages are stored as fractions (0.27 = 27%) unless noted in the registry. */
  value: number;
  /** Format hint copied from the KPI registry, duplicated here for convenience in raw exports. */
  format?: MetricFormat;
  /** Number of underlying records/rows this metric was computed from, if applicable. */
  sampleSize?: number;
  /** ISO timestamp of when this value was computed. */
  computedAt: ISODateString;
  /** Free-form notes, e.g. "partial data — 2 of 3 ad accounts returned results". */
  note?: string;
}

/** Result of an adapter connectivity/credentials test. */
export interface AdapterTestResult {
  ok: boolean;
  message?: string;
}

/**
 * The contract every data source adapter must implement.
 * See /adapters/*.ts for concrete implementations.
 */
export interface Adapter {
  /** Stable machine id, matches `source` field in KPIDefinition, e.g. "hubspot". */
  id: string;
  /** Human-readable name for logs/UI, e.g. "HubSpot CRM". */
  displayName: string;
  /** Verifies credentials/connectivity without pulling full data. Used by health checks & dashboard "Test Connection" button. */
  test(): Promise<AdapterTestResult>;
  /** Pulls and computes all metrics this adapter owns for the given date range. */
  fetch(range: DateRange): Promise<Record<string, MetricValue>>;
}

/** Departments used to group KPIs in the dashboard and catalog. */
export type Department =
  | "revenue"
  | "marketing"
  | "brain"
  | "funding"
  | "ops"
  | "success"
  | "broker"
  | "executive";

/** Which adapter (source system) owns/produces a given KPI. */
export type KPISource =
  | "hubspot"
  | "asana"
  | "firebase"
  | "meta-ads"
  | "google-ads"
  | "calendly"
  | "google-sheets"
  | "computed"; // derived from other KPIs (e.g. ratios combining two sources)

/**
 * A single row in the KPI registry — the source of truth mapping every KPI
 * to its adapter, formula, target benchmark, and department.
 */
export interface KPIDefinition {
  /** Stable camelCase id, matches the key returned in adapter fetch() results (or the computed key in aggregate-daily.ts). */
  id: string;
  /** Human-readable label for dashboard UI. */
  label: string;
  /** How to render the value. */
  format: MetricFormat;
  /**
   * Single target number where a single threshold makes sense (e.g. 25 for 25%).
   * For percent/ratio formats this is expressed in the same "human" units as targetRange
   * (e.g. 25 means 25%, not 0.25) — the dashboard divides by 100 for percent formats when charting
   * against the raw 0–1 MetricValue.
   */
  target?: number;
  /** Acceptable healthy range [min, max] in human units (e.g. [20, 35] for 20%-35%). */
  targetRange?: [number, number];
  /** Which adapter produces this KPI. */
  source: KPISource;
  /** Human-readable formula description, for the catalog and tooltips. */
  formula: string;
  /** Department grouping for dashboard navigation. */
  department: Department;
  /** One-sentence explanation of why this KPI matters — used in KPI-CATALOG.md and dashboard tooltips. */
  whyItMatters?: string;
  /** If true, this KPI is safe to expose in the investor portal. Defaults to false (must opt in explicitly). */
  investorSafe?: boolean;
}

/**
 * Shape of a single daily aggregated snapshot written to
 * Firestore `kpi_snapshots/{YYYY-MM-DD}` by aggregate-daily.ts.
 */
export interface KPISnapshot {
  /** YYYY-MM-DD, also the Firestore document id. */
  date: ISODateString;
  /** ISO timestamp of when the snapshot was generated. */
  generatedAt: string;
  /** Date range the snapshot covers (usually a single day, but adapters may roll up trailing windows for rate metrics). */
  range: DateRange;
  /** Flattened map of every KPI id -> computed metric value. */
  metrics: Record<string, MetricValue>;
  /** Per-adapter status for observability (did HubSpot respond ok today?). */
  adapterStatus: Record<string, AdapterTestResult & { fetchedMetricCount: number }>;
  /** Schema/version tag so future migrations can detect old snapshots. */
  schemaVersion: 3;
}

/** A single alert written to Firestore `alerts` by alert-monitor.ts. */
export interface KPIAlert {
  id: string;
  kpiId: string;
  label: string;
  department: Department;
  severity: "warning" | "critical";
  currentValue: number;
  target?: number;
  targetRange?: [number, number];
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

/** Shape of the weekly AI-generated CEO briefing stored at `briefings/{YYYY-Www}`. */
export interface CEOBriefing {
  /** ISO week id, e.g. "2026-W31". */
  weekId: string;
  generatedAt: string;
  /** Which AI provider generated this briefing. */
  provider: "openai" | "claude";
  /** Model name used, e.g. "gpt-4o" or "claude-3-5-sonnet-20241022". */
  model: string;
  /** Raw markdown briefing content (see ai-briefing-prompt.md for structure). */
  markdown: string;
  /** Structured extraction of the same content for dashboard rendering without a markdown parser. */
  structured: {
    tldr: string[];
    wins: string[];
    losses: string[];
    anomalies: { kpiId: string; description: string; suspectedCause: string }[];
    actions: string[];
    deepDives: string[];
  };
  /** Date range of KPI data the briefing was based on. */
  range: DateRange;
}

/** Scenario input for the forecast engine. All values are percentage-point deltas applied to current run-rate assumptions. */
export interface ForecastScenarioParams {
  /** % change in cost-per-lead vs. current baseline. Negative = cheaper leads. */
  cplChangePct: number;
  /** % change in close rate vs. current baseline (percentage points, e.g. +5 = +5pp). */
  closeRateChangePct: number;
  /** % change in retention rate vs. current baseline (percentage points). */
  retentionChangePct: number;
}

/** A single month's projected output from the forecast engine. */
export interface ForecastMonth {
  /** YYYY-MM */
  month: string;
  projectedMRR: number;
  projectedNewClients: number;
  projectedChurnedClients: number;
  projectedActiveClients: number;
  projectedCapitalFacilitated: number;
  cumulativeCapitalFacilitated: number;
}

/** Full response of the forecast-engine HTTP function. */
export interface ForecastResult {
  generatedAt: string;
  scenario: ForecastScenarioParams;
  baseline: {
    currentMRR: number;
    currentActiveClients: number;
    avgCloseRate: number;
    avgRetentionRate: number;
    avgCPL: number;
  };
  months: ForecastMonth[];
}

/** Curated, non-sensitive KPI subset returned by the investor portal. Never includes employee data or client names. */
export interface InvestorView {
  asOf: string;
  mrr: number;
  capitalFacilitatedYTD: number;
  growthMoM: number;
  growthYoY: number;
  activeClients: number;
  ltv: number;
}

/** Claims embedded in the investor JWT (see investor-token.ts). */
export interface InvestorTokenClaims {
  scope: "investor-readonly";
  /** Optional label for which investor/entity this token was issued to (never a client name). */
  issuedTo?: string;
  iat: number;
  exp: number;
}
