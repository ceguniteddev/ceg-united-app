/**
 * functions/src/lib/computed-metrics.ts
 * ----------------------------------------------------------------------------
 * Computes every KPI in kpi-registry.ts whose `source` is "computed" — i.e.
 * metrics derived from combining raw adapter outputs rather than pulled
 * directly from a single source system.
 *
 * Called by aggregate-daily.ts after all seven adapters have returned.
 * Every computation here is defensive: missing inputs resolve to 0 rather
 * than throwing, so a partial adapter outage never crashes the whole run
 * (the raw metric will already carry an adapterStatus.ok=false flag upstream).
 * ----------------------------------------------------------------------------
 */

import { MetricValue, DateRange } from "../../shared/types";

function val(metrics: Record<string, MetricValue>, id: string): number {
  return metrics[id]?.value ?? 0;
}

function metricValue(value: number, format?: MetricValue["format"]): MetricValue {
  return { value, format, computedAt: new Date().toISOString() };
}

/**
 * Computes all cross-source derived metrics for a single daily snapshot.
 * `db` is passed in for the few metrics (capitalFacilitatedYTD, growthMoM,
 * growthYoY) that require reading prior snapshots for comparison.
 */
export async function computeDerivedMetrics(
  metrics: Record<string, MetricValue>,
  range: DateRange,
  db: FirebaseFirestore.Firestore
): Promise<Record<string, MetricValue>> {
  const out: Record<string, MetricValue> = {};

  const closedDeals = val(metrics, "closedDeals");
  const totalLeads = val(metrics, "totalLeads");
  const avgContractValue = val(metrics, "avgContractValue");
  const activeClients = val(metrics, "activeClients");
  const retentionRate = val(metrics, "retentionRate");
  const adSpendMeta = val(metrics, "adSpendMeta");
  const adSpendGoogle = val(metrics, "adSpendGoogle");
  const leadsFromMeta = val(metrics, "leadsFromMeta");
  const leadsFromGoogle = val(metrics, "leadsFromGoogle");
  
  
  const totalCapitalApproved = val(metrics, "totalCapitalApproved");
  const auditsBooked = val(metrics, "auditsBooked");
  const brokerProduction = val(metrics, "brokerProduction");
  const activeBrokers = val(metrics, "activeBrokers");
  const auditsCompleted = val(metrics, "auditsCompleted");

  // --- revenuePerLead --------------------------------------------------
  const totalClosedRevenue = closedDeals * avgContractValue;
  out.revenuePerLead = metricValue(totalLeads > 0 ? totalClosedRevenue / totalLeads : 0, "currency");

  // --- mrr ---------------------------------------------------------------
  const mrr = activeClients * avgContractValue;
  out.mrr = metricValue(mrr, "currency");

  // --- ltv / cac / ltvToCac ----------------------------------------------
  const ltv = retentionRate < 1 ? avgContractValue / (1 - retentionRate) : avgContractValue * 12;
  out.ltv = metricValue(ltv, "currency");

  const totalAdSpend = adSpendMeta + adSpendGoogle;
  const cac = closedDeals > 0 ? totalAdSpend / closedDeals : 0;
  out.cac = metricValue(cac, "currency");
  out.ltvToCac = metricValue(cac > 0 ? ltv / cac : 0, "ratio");

  // --- blendedCPL / totalMarketingSpend / organicLeadShare ----------------
  const totalPaidLeads = leadsFromMeta + leadsFromGoogle;
  out.blendedCPL = metricValue(totalPaidLeads > 0 ? totalAdSpend / totalPaidLeads : 0, "currency");
  out.totalMarketingSpend = metricValue(totalAdSpend, "currency");
  out.organicLeadShare = metricValue(
    totalLeads > 0 ? Math.max(0, 1 - totalPaidLeads / totalLeads) : 0,
    "percent"
  );
  out.costPerBookedAudit = metricValue(auditsBooked > 0 ? totalAdSpend / auditsBooked : 0, "currency");
  out.costPerAudit = metricValue(auditsCompleted > 0 ? totalAdSpend / auditsCompleted : 0, "currency");

  // --- capitalPerClient ----------------------------------------------------
  out.capitalPerClient = metricValue(
    activeClients > 0 ? totalCapitalApproved / activeClients : 0,
    "currency"
  );

  // --- avgProductionPerBroker ----------------------------------------------
  out.avgProductionPerBroker = metricValue(
    activeBrokers > 0 ? brokerProduction / activeBrokers : 0,
    "currency"
  );

  // --- approvalToFundingRate (needs firebase-brain's raw counts, approximated here from rate fields) ---
  // Already computed directly in firebase-brain adapter's future extension; if not present, skip.

  // --- capitalFacilitatedYTD, growthMoM, growthYoY: require historical snapshots -----
  const [ytdTotal, mrrLastMonth, mrrLastYear] = await Promise.all([
    sumMetricSinceJan1(db, "totalCapitalApproved", range.start),
    getMetricFromMonthsAgo(db, "mrr", range.start, 1),
    getMetricFromMonthsAgo(db, "mrr", range.start, 12),
  ]);

  out.capitalFacilitatedYTD = metricValue(ytdTotal + totalCapitalApproved, "currency");
  out.growthMoM = metricValue(
    mrrLastMonth > 0 ? (mrr - mrrLastMonth) / mrrLastMonth : 0,
    "percent"
  );
  out.growthYoY = metricValue(
    mrrLastYear > 0 ? (mrr - mrrLastYear) / mrrLastYear : 0,
    "percent"
  );

  return out;
}

/** Sums a metric across all snapshots from Jan 1 of the snapshot's year through the day before `beforeDate`. */
async function sumMetricSinceJan1(
  db: FirebaseFirestore.Firestore,
  metricId: string,
  beforeDate: string
): Promise<number> {
  const year = beforeDate.slice(0, 4);
  const jan1 = `${year}-01-01`;
  if (jan1 >= beforeDate) return 0;

  const snap = await db
    .collection("kpi_snapshots")
    .where("date", ">=", jan1)
    .where("date", "<", beforeDate)
    .get();

  let total = 0;
  snap.forEach((doc) => {
    const data = doc.data();
    total += data.metrics?.[metricId]?.value ?? 0;
  });
  return total;
}

/** Reads the closest available snapshot value for `metricId` from N months before `fromDate`. */
async function getMetricFromMonthsAgo(
  db: FirebaseFirestore.Firestore,
  metricId: string,
  fromDate: string,
  monthsAgo: number
): Promise<number> {
  const d = new Date(fromDate + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() - monthsAgo);
  const targetDate = d.toISOString().slice(0, 10);

  // Look for a snapshot within a +/- 3 day window of the target date (handles missed runs).
  const windowStart = shiftDate(targetDate, -3);
  const windowEnd = shiftDate(targetDate, 3);

  const snap = await db
    .collection("kpi_snapshots")
    .where("date", ">=", windowStart)
    .where("date", "<=", windowEnd)
    .limit(1)
    .get();

  if (snap.empty) return 0;
  const data = snap.docs[0].data();
  return data.metrics?.[metricId]?.value ?? 0;
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
