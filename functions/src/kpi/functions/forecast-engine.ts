/**
 * functions/src/forecast-engine.ts
 * ----------------------------------------------------------------------------
 * HTTP function: POST /forecast
 *
 * Takes scenario params { cplChangePct, closeRateChangePct, retentionChangePct }
 * and returns a 12-month rolling MRR + capital-facilitated projection, built
 * from the trailing 90 days of `kpi_snapshots` as the historical baseline.
 *
 * Admin-auth protected (same shared secret as refresh-kpi.ts) since this
 * reveals internal run-rate assumptions — not for public/investor consumption.
 * The investor portal uses its own curated, token-scoped endpoint instead
 * (see investor-token.ts).
 * ----------------------------------------------------------------------------
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import * as express from "express";
import { Request, Response } from "express";
import { requireAdminAuth } from "./lib/admin-auth";
import { forecastFromSnapshots } from "../shared/forecast-model";
import { ForecastScenarioParams, KPISnapshot } from "../shared/types";

const app = express();
app.use(express.json());
app.use(requireAdminAuth);

const TRAILING_DAYS_FOR_BASELINE = 90;

function parseScenario(body: unknown): ForecastScenarioParams {
  const b = (body ?? {}) as Partial<ForecastScenarioParams>;
  const toNumber = (v: unknown, fallback: number): number =>
    typeof v === "number" && !Number.isNaN(v) ? v : fallback;

  return {
    cplChangePct: toNumber(b.cplChangePct, 0),
    closeRateChangePct: toNumber(b.closeRateChangePct, 0),
    retentionChangePct: toNumber(b.retentionChangePct, 0),
  };
}

app.post("/forecast", async (req: Request, res: Response) => {
  try {
    const scenario = parseScenario(req.body);
    const db = admin.firestore();

    const since = shiftDate(new Date().toISOString().slice(0, 10), -TRAILING_DAYS_FOR_BASELINE);
    const snap = await db.collection("kpi_snapshots").where("date", ">=", since).orderBy("date").get();

    if (snap.empty) {
      res.status(422).json({
        error: `No kpi_snapshots found in the trailing ${TRAILING_DAYS_FOR_BASELINE} days. Run aggregate-daily at least once before forecasting.`,
      });
      return;
    }

    const snapshots = snap.docs.map((d) => d.data() as KPISnapshot);
    const result = forecastFromSnapshots(snapshots, scenario, { months: 12 });

    res.status(200).json(result);
  } catch (err) {
    logger.error("forecast-engine error", err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const forecastEngine = onRequest({ timeoutSeconds: 300, memory: "512MiB" }, app as any);
