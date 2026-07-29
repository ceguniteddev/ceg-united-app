/**
 * shared/forecast-model.ts
 * ----------------------------------------------------------------------------
 * Pure, dependency-free forecasting logic for the 12-month rolling MRR +
 * capital-facilitated projection used by:
 *   - functions/src/forecast-engine.ts (HTTP endpoint, wraps this + Firestore reads)
 *   - the dashboard's scenario sliders (can theoretically run client-side too,
 *     since this file has zero SDK dependencies)
 *
 * DESIGN NOTES FOR THE DEV TUNING THIS LATER:
 * -----------------------------------------------------------------------
 * The model is intentionally simple: a compound-growth simulation driven by
 * a handful of levers derived from trailing historical snapshots, adjusted
 * by the scenario sliders the user moves in the dashboard:
 *
 *   - cplChangePct        -> cheaper leads (negative %) increase new-lead
 *                            volume for the same ad budget, which increases
 *                            new client acquisition.
 *   - closeRateChangePct  -> percentage-point shift applied directly to the
 *                            baseline close rate.
 *   - retentionChangePct  -> percentage-point shift applied directly to the
 *                            baseline monthly retention rate, which drives
 *                            compounding churn/growth of the active client base.
 *
 * All monetary values are plain numbers (USD). No currency formatting here —
 * that belongs in the dashboard layer.
 *
 * HOW TO TUNE:
 *   - `DEFAULT_BASE_GROWTH_RATE` is the "everything else held equal" monthly
 *     growth assumption applied on top of the lever-adjusted new-client math.
 *     Raise it if the business has strong organic/referral momentum baked in
 *     that isn't captured by ad-driven lead volume.
 *   - `AVG_MONTHLY_LEADS_BASELINE` fallback is only used if historical
 *     snapshots don't contain enough lead volume data — replace with a real
 *     number once you have >=30 days of aggregate-daily.ts snapshots.
 * ----------------------------------------------------------------------------
 */

import { ForecastMonth, ForecastResult, ForecastScenarioParams, KPISnapshot } from "./shared-types";

/** Baseline monthly organic growth rate applied independent of scenario sliders (5% default). Tune as the business matures. */
export const DEFAULT_BASE_GROWTH_RATE = 0.05;

/** Fallback monthly lead volume assumption if historical snapshots are too sparse to compute a real average. */
export const AVG_MONTHLY_LEADS_BASELINE = 150;

/** Fallback fully-loaded monthly ad budget assumption used only when snapshot history is empty. */
export const AVG_MONTHLY_AD_BUDGET_BASELINE = 20000;

export interface ForecastBaseline {
  currentMRR: number;
  currentActiveClients: number;
  avgCloseRate: number; // 0-1 fraction
  avgRetentionRate: number; // 0-1 fraction, monthly
  avgCPL: number; // USD
  avgContractValue: number; // USD, monthly value per new client
  avgMonthlyLeads: number;
  avgMonthlyAdSpend: number;
  avgApprovalAmount: number;
  avgApprovalRate: number; // 0-1 fraction
}

/**
 * Derives baseline run-rate assumptions from a set of historical daily
 * snapshots (typically the trailing 30-90 days from Firestore `kpi_snapshots`).
 * Falls back to conservative defaults for any metric missing from history.
 */
export function deriveBaseline(snapshots: KPISnapshot[]): ForecastBaseline {
  const metric = (id: string): number[] =>
    snapshots
      .map((s) => s.metrics[id]?.value)
      .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));

  const avg = (arr: number[], fallback: number): number =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : fallback;

  const sum = (arr: number[], fallback: number): number =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) : fallback;

  const mrrSeries = metric("mrr");
  const activeClientsSeries = metric("activeClients");

  return {
    currentMRR: mrrSeries.length > 0 ? mrrSeries[mrrSeries.length - 1] : 0,
    currentActiveClients:
      activeClientsSeries.length > 0 ? activeClientsSeries[activeClientsSeries.length - 1] : 0,
    avgCloseRate: avg(metric("closeRate"), 0.25),
    avgRetentionRate: avg(metric("retentionRate"), 0.9),
    avgCPL: avg(
      [...metric("cplMeta"), ...metric("cplGoogle")],
      150
    ),
    avgContractValue: avg(metric("avgContractValue"), 2500),
    avgMonthlyLeads:
      sum(metric("totalLeads"), 0) > 0
        ? (sum(metric("totalLeads"), 0) / Math.max(snapshots.length, 1)) * 30
        : AVG_MONTHLY_LEADS_BASELINE,
    avgMonthlyAdSpend:
      sum([...metric("adSpendMeta"), ...metric("adSpendGoogle")], 0) > 0
        ? (sum([...metric("adSpendMeta"), ...metric("adSpendGoogle")], 0) /
            Math.max(snapshots.length, 1)) *
          30
        : AVG_MONTHLY_AD_BUDGET_BASELINE,
    avgApprovalAmount: avg(metric("avgApprovalAmount"), 65000),
    avgApprovalRate: avg(metric("approvalRate"), 0.6),
  };
}

/**
 * Runs the 12-month compound projection given a baseline and scenario params.
 * Pure function — no I/O, safe to unit test directly.
 */
export function runForecast(
  baseline: ForecastBaseline,
  scenario: ForecastScenarioParams,
  opts: { months?: number; baseGrowthRate?: number; startDate?: Date } = {}
): ForecastResult {
  const months = opts.months ?? 12;
  const baseGrowthRate = opts.baseGrowthRate ?? DEFAULT_BASE_GROWTH_RATE;
  const startDate = opts.startDate ?? new Date();

  // --- Apply scenario adjustments to baseline levers -----------------------
  // Cheaper CPL -> more leads for the same budget (inverse relationship).
  const adjustedCPL = baseline.avgCPL * (1 + scenario.cplChangePct / 100);
  const adjustedMonthlyLeads =
    adjustedCPL > 0
      ? (baseline.avgMonthlyAdSpend / adjustedCPL)
      : baseline.avgMonthlyLeads;

  // Close rate shifted by scenario percentage points (not percent-of-percent).
  const adjustedCloseRate = clamp(
    baseline.avgCloseRate + scenario.closeRateChangePct / 100,
    0,
    1
  );

  // Retention shifted by scenario percentage points.
  const adjustedRetentionRate = clamp(
    baseline.avgRetentionRate + scenario.retentionChangePct / 100,
    0,
    1
  );

  const monthlyChurnRate = 1 - adjustedRetentionRate;

  let activeClients = baseline.currentActiveClients;
  let mrr = baseline.currentMRR;
  let cumulativeCapital = 0;

  const monthlyResults: ForecastMonth[] = [];

  for (let i = 0; i < months; i++) {
    const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 1);
    const monthLabel = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    // New clients this month = leads * close rate, plus baseline organic growth compounding.
    const newClientsFromFunnel = adjustedMonthlyLeads * adjustedCloseRate;
    const organicGrowthClients = activeClients * baseGrowthRate;
    const newClients = newClientsFromFunnel + organicGrowthClients;

    const churnedClients = activeClients * monthlyChurnRate;

    activeClients = Math.max(0, activeClients + newClients - churnedClients);

    // MRR compounds with the active client base, using avg contract value as the per-client monthly value.
    mrr = activeClients * baseline.avgContractValue;

    // Capital facilitated scales with new client volume * approval rate * avg approval amount.
    const projectedCapitalFacilitated =
      newClients * adjustedCloseRate <= 0
        ? 0
        : newClients * baseline.avgApprovalRate * baseline.avgApprovalAmount;

    cumulativeCapital += projectedCapitalFacilitated;

    monthlyResults.push({
      month: monthLabel,
      projectedMRR: round2(mrr),
      projectedNewClients: round2(newClients),
      projectedChurnedClients: round2(churnedClients),
      projectedActiveClients: round2(activeClients),
      projectedCapitalFacilitated: round2(projectedCapitalFacilitated),
      cumulativeCapitalFacilitated: round2(cumulativeCapital),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    scenario,
    baseline: {
      currentMRR: baseline.currentMRR,
      currentActiveClients: baseline.currentActiveClients,
      avgCloseRate: baseline.avgCloseRate,
      avgRetentionRate: baseline.avgRetentionRate,
      avgCPL: baseline.avgCPL,
    },
    months: monthlyResults,
  };
}

/** Convenience one-shot: derive baseline from snapshots and immediately run the forecast. */
export function forecastFromSnapshots(
  snapshots: KPISnapshot[],
  scenario: ForecastScenarioParams,
  opts?: { months?: number; baseGrowthRate?: number }
): ForecastResult {
  const baseline = deriveBaseline(snapshots);
  return runForecast(baseline, scenario, opts);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
