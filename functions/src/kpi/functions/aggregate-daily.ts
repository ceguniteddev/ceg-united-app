/**
 * functions/src/aggregate-daily.ts
 * ----------------------------------------------------------------------------
 * Scheduled Cloud Function: runs daily at 3:00 AM UTC.
 *
 * Calls every adapter for "yesterday" (UTC), merges their metrics into a
 * single flattened snapshot, computes a handful of cross-source "computed"
 * KPIs (see kpi-registry.ts entries with source: "computed"), and writes the
 * result to Firestore `kpi_snapshots/{YYYY-MM-DD}` using a batched write.
 *
 * Also callable manually via `runAggregateDaily()` for testing (see
 * refresh-kpi.ts, which reuses this same function for the dashboard's
 * "Refresh" button).
 * ----------------------------------------------------------------------------
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getActiveAdapters } from "../adapters";
import {
  DateRange,
  KPISnapshot,
  MetricValue,
  AdapterTestResult,
} from "../shared/types";
import { computeDerivedMetrics } from "./lib/computed-metrics";

/** Returns yesterday's UTC date range as a single-day DateRange. */
export function getYesterdayRange(): DateRange {
  const now = new Date();
  const yesterday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1),
  );
  const iso = yesterday.toISOString().slice(0, 10);
  return { start: iso, end: iso };
}

/**
 * Core aggregation logic, separated from the Cloud Functions scheduler
 * wrapper so it can be:
 *   - unit tested directly
 *   - re-used by refresh-kpi.ts (manual dashboard refresh button)
 *   - re-used by any future backfill script
 */
export async function runAggregateDaily(
  range?: DateRange,
): Promise<KPISnapshot> {
  const targetRange = range ?? getYesterdayRange();
  const db = admin.firestore();

  const metrics: Record<string, MetricValue> = {};
  const adapterStatus: Record<
    string,
    AdapterTestResult & { fetchedMetricCount: number }
  > = {};

  // Run all adapters in parallel but isolate failures so one bad source
  // (e.g. Meta API outage) never blocks the other six from writing data.
  const activeAdapters = getActiveAdapters();
  const results = await Promise.allSettled(
    activeAdapters.map(async (adapter) => {
      const data = await adapter.fetch(targetRange);
      return { adapter, data };
    }),
  );

  results.forEach((result, i) => {
    const adapter = activeAdapters[i];
    if (result.status === "fulfilled") {
      Object.assign(metrics, result.value.data);
      adapterStatus[adapter.id] = {
        ok: true,
        fetchedMetricCount: Object.keys(result.value.data).length,
      };
    } else {
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      logger.error(
        `Adapter "${adapter.id}" failed during daily aggregation`,
        {
          adapter: adapter.id,
          error: message,
        },
      );
      adapterStatus[adapter.id] = { ok: false, message, fetchedMetricCount: 0 };
    }
  });

  // Layer in cross-source computed metrics (mrr, ltv, cac, capitalFacilitatedYTD, etc.)
  // using whatever raw metrics successfully came back above. Missing inputs degrade
  // gracefully to 0 inside computeDerivedMetrics rather than throwing.
  const computed = await computeDerivedMetrics(metrics, targetRange, db);
  Object.assign(metrics, computed);

  const snapshot: KPISnapshot = {
    date: targetRange.start,
    generatedAt: new Date().toISOString(),
    range: targetRange,
    metrics,
    adapterStatus,
    schemaVersion: 3,
  };

  // Batched write: the snapshot doc itself plus a lightweight index doc used
  // by the dashboard to quickly list available snapshot dates without a
  // collection-wide query.
  const batch = db.batch();
  const snapshotRef = db.collection("kpi_snapshots").doc(snapshot.date);
  const indexRef = db.collection("kpi_snapshot_index").doc(snapshot.date);

  batch.set(snapshotRef, snapshot);
  batch.set(indexRef, {
    date: snapshot.date,
    generatedAt: snapshot.generatedAt,
    metricCount: Object.keys(metrics).length,
    healthyAdapterCount: Object.values(adapterStatus).filter((s) => s.ok)
      .length,
    totalAdapterCount: activeAdapters.length,
  });

  await batch.commit();

  logger.info(`Daily KPI snapshot written for ${snapshot.date}`, {
    metricCount: Object.keys(metrics).length,
    healthyAdapters: Object.values(adapterStatus).filter((s) => s.ok).length,
    totalAdapters: activeAdapters.length,
  });

  return snapshot;
}

/** Scheduled trigger: daily at 3:00 AM UTC. */
export const aggregateDaily = onSchedule(
  { schedule: "0 3 * * *", timeZone: "UTC", timeoutSeconds: 300, memory: "512MiB" },
  async () => {
    await runAggregateDaily();
  }
);
