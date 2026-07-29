/**
 * functions/src/refresh-kpi.ts
 * ----------------------------------------------------------------------------
 * HTTP function: POST /refresh-kpi
 *
 * Triggered by the dashboard's "Refresh" button. Re-runs the same aggregation
 * logic as the scheduled aggregate-daily.ts, but for TODAY (not yesterday),
 * so the user gets an on-demand, up-to-the-minute snapshot instead of waiting
 * for the 3am UTC cron.
 *
 * Admin-auth protected — this triggers real API calls against every adapter
 * (rate-limit cost), so it should only be reachable from the authenticated
 * dashboard, not the public internet.
 * ----------------------------------------------------------------------------
 */

import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import * as express from "express";
import { Request, Response } from "express";
import { requireAdminAuth } from "./lib/admin-auth";
import { runAggregateDaily } from "./aggregate-daily";
import { DateRange } from "../shared/types";

const app = express();
app.use(express.json());
app.use(requireAdminAuth);

/** Simple in-memory cooldown to prevent accidental refresh-button-mashing from hammering rate-limited adapters (e.g. Meta, Google Ads). Resets on cold start. */
let lastRefreshAt = 0;
const COOLDOWN_MS = 60_000; // 1 minute

app.post("/refresh-kpi", async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (now - lastRefreshAt < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (now - lastRefreshAt)) / 1000);
      res.status(429).json({ error: `Refresh already ran recently. Try again in ${waitSec}s.` });
      return;
    }
    lastRefreshAt = now;

    const today = new Date().toISOString().slice(0, 10);
    const range: DateRange = { start: today, end: today };

    const snapshot = await runAggregateDaily(range);

    res.status(200).json({
      ok: true,
      date: snapshot.date,
      metricCount: Object.keys(snapshot.metrics).length,
      adapterStatus: snapshot.adapterStatus,
    });
  } catch (err) {
    logger.error("refresh-kpi error", err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export const refreshKpi = onRequest({ timeoutSeconds: 300, memory: "512MiB" }, app as any);
