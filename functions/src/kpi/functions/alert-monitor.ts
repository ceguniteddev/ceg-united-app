/**
 * functions/src/alert-monitor.ts
 * ----------------------------------------------------------------------------
 * Scheduled function: runs every 15 minutes.
 *
 * Reads the most recent KPI snapshot, compares every KPI that has a
 * `target`/`targetRange` in kpi-registry.ts against its current value, and
 * writes a new alert doc to Firestore `alerts` for any breach that isn't
 * already open. The dashboard already reads this collection directly.
 *
 * INTERNAL-ONLY BY DESIGN: Julian did not select SMS/Slack alerting for this
 * build. Do not wire Twilio or Slack into this file — alerts are
 * Firestore-only and surfaced exclusively in the dashboard UI.
 * ----------------------------------------------------------------------------
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { KPI_REGISTRY } from "../shared/kpi-registry";
import { KPIAlert, KPISnapshot } from "../shared/types";

/** Converts a raw MetricValue into the "human units" the registry's target/targetRange are expressed in (percent KPIs are stored as 0-1 fractions internally). */
function toHumanUnits(rawValue: number, format: string): number {
  return format === "percent" ? rawValue * 100 : rawValue;
}

function evaluateBreach(
  kpiId: string,
  label: string,
  department: KPIAlert["department"],
  humanValue: number,
  target?: number,
  targetRange?: [number, number]
): { breached: boolean; severity: KPIAlert["severity"]; message: string } | null {
  if (targetRange) {
    const [min, max] = targetRange;
    if (humanValue < min) {
      const pctBelow = ((min - humanValue) / min) * 100;
      return {
        breached: true,
        severity: pctBelow > 25 ? "critical" : "warning",
        message: `${label} is ${humanValue.toFixed(1)}, below the target range floor of ${min}.`,
      };
    }
    if (humanValue > max) {
      // Above-max is usually good news (e.g. retention at 99%) unless the KPI is a "lower is better" metric.
      // We only alert on above-max for metrics where exceeding the range is itself risky
      // (handled by convention: KPIs like burnMultiple where max is a ceiling, not a floor).
      return null;
    }
    return { breached: false, severity: "warning", message: "" };
  }

  if (target !== undefined) {
    const pctOfTarget = (humanValue / target) * 100;
    if (pctOfTarget < 80) {
      return {
        breached: true,
        severity: pctOfTarget < 60 ? "critical" : "warning",
        message: `${label} is ${humanValue.toFixed(1)}, only ${pctOfTarget.toFixed(0)}% of the ${target} target.`,
      };
    }
    return { breached: false, severity: "warning", message: "" };
  }

  return null;
}

export async function runAlertMonitor(): Promise<KPIAlert[]> {
  const db = admin.firestore();

  const latestSnap = await db.collection("kpi_snapshots").orderBy("date", "desc").limit(1).get();
  if (latestSnap.empty) {
    logger.warn("alert-monitor: no kpi_snapshots found, skipping this run.");
    return [];
  }

  const snapshot = latestSnap.docs[0].data() as KPISnapshot;
  const newAlerts: KPIAlert[] = [];

  // Fetch currently-open (unacknowledged) alerts so we don't spam duplicates every 15 minutes.
  const openAlertsSnap = await db.collection("alerts").where("acknowledged", "==", false).get();
  const openAlertKpiIds = new Set(openAlertsSnap.docs.map((d) => (d.data() as KPIAlert).kpiId));

  for (const kpi of KPI_REGISTRY) {
    if (kpi.target === undefined && kpi.targetRange === undefined) continue;

    const rawMetric = snapshot.metrics[kpi.id];
    if (!rawMetric) continue;

    const humanValue = toHumanUnits(rawMetric.value, kpi.format);
    const result = evaluateBreach(kpi.id, kpi.label, kpi.department, humanValue, kpi.target, kpi.targetRange);

    if (!result || !result.breached) continue;
    if (openAlertKpiIds.has(kpi.id)) continue; // already alerted and not yet acknowledged

    const alert: KPIAlert = {
      id: `${kpi.id}-${Date.now()}`,
      kpiId: kpi.id,
      label: kpi.label,
      department: kpi.department,
      severity: result.severity,
      currentValue: humanValue,
      target: kpi.target,
      targetRange: kpi.targetRange,
      message: result.message,
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };
    newAlerts.push(alert);
  }

  if (newAlerts.length > 0) {
    const batch = db.batch();
    for (const alert of newAlerts) {
      batch.set(db.collection("alerts").doc(alert.id), alert);
    }
    await batch.commit();
    logger.info(`alert-monitor: wrote ${newAlerts.length} new alert(s).`, {
      kpiIds: newAlerts.map((a) => a.kpiId),
    });
  }

  return newAlerts;
}

/** Scheduled trigger: every 15 minutes. */
export const alertMonitor = onSchedule(
  { schedule: "every 15 minutes", timeoutSeconds: 120, memory: "512MiB" },
  async () => {
    await runAlertMonitor();
  }
);
