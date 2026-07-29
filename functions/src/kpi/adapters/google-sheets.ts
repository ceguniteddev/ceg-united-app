/**
 * adapters/google-sheets.ts
 * ----------------------------------------------------------------------------
 * Google Sheets adapter — fallback source for manually-tracked metrics that
 * don't have a system of record yet: broker production, NPS, referrals,
 * headcount, gross margin, cash on hand, broker NPS, new broker partnerships.
 *
 * SDK: googleapis (npm install googleapis)
 * Auth: Service account with the target Sheet shared to its email address
 * (see docs/START-HERE-DEVELOPER.md Section 3). Can reuse the SAME GCP
 * project/service account as Firebase if you enable the Sheets API on it.
 *
 * Sheet layout convention (row 1 = headers, one metric per row):
 *   | metricId            | value  | asOfDate   | notes            |
 *   | brokerProduction    | 482000 | 2026-07-28 | July MTD         |
 *   | nps                 | 62     | 2026-07-28 |                  |
 *   | referrals           | 14     | 2026-07-28 |                  |
 *   | headcount           | 23     | 2026-07-28 |                  |
 *   | grossMargin         | 71     | 2026-07-28 | % as whole number|
 *   | cashOnHand          | 340000 | 2026-07-28 |                  |
 *   | brokerNPS           | 55     | 2026-07-28 |                  |
 *   | newBrokerPartnerships | 2    | 2026-07-28 |                  |
 *   | activeBrokers       | 11     | 2026-07-28 |                  |
 *
 * Env vars:
 *   GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON  (required) Same format as FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON or file path)
 *   GOOGLE_SHEETS_SPREADSHEET_ID        (required) The spreadsheet id from its URL
 *   GOOGLE_SHEETS_RANGE                 (optional) Sheet + range, default "ManualMetrics!A2:D200"
 * ----------------------------------------------------------------------------
 */

import { google, sheets_v4 } from "googleapis";
import { Adapter, AdapterTestResult, DateRange, MetricValue } from "../shared/types";
import { metric, optionalEnv, requireEnv, withRetry } from "./_util";

/** Metric ids this adapter is allowed to produce — keeps the config-driven sheet from silently injecting arbitrary keys into snapshots. */
const ALLOWED_METRIC_IDS = new Set([
  "brokerProduction",
  "nps",
  "referrals",
  "headcount",
  "grossMargin",
  "cashOnHand",
  "brokerNPS",
  "newBrokerPartnerships",
  "activeBrokers",
]);

function getAuth(): InstanceType<typeof google.auth.GoogleAuth> {
  const raw = requireEnv("GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON");
  let credentials: Record<string, unknown>;
  if (raw.trim().startsWith("{")) {
    credentials = JSON.parse(raw);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs") as typeof import("fs");
    credentials = JSON.parse(fs.readFileSync(raw, "utf-8"));
  }
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = getAuth();
  const authClient = (await auth.getClient()) as sheets_v4.Options["auth"];
  return google.sheets({ version: "v4", auth: authClient });
}

interface SheetRow {
  metricId: string;
  value: number;
  asOfDate: string;
  notes?: string;
}

async function readRows(): Promise<SheetRow[]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
  const range = optionalEnv("GOOGLE_SHEETS_RANGE", "ManualMetrics!A2:D200");

  const resp = await withRetry(() =>
    sheets.spreadsheets.values.get({ spreadsheetId, range })
  );

  const values = resp.data.values ?? [];
  return values
    .filter((row) => row[0] && row[1] !== undefined)
    .map((row) => ({
      metricId: String(row[0]).trim(),
      value: parseFloat(String(row[1]).replace(/[^0-9.\-]/g, "")),
      asOfDate: String(row[2] ?? ""),
      notes: row[3] ? String(row[3]) : undefined,
    }))
    .filter((row) => !Number.isNaN(row.value));
}

export const googleSheetsAdapter: Adapter = {
  id: "google-sheets",
  displayName: "Google Sheets (Manual Metrics)",

  async test(): Promise<AdapterTestResult> {
    try {
      const sheets = await getSheetsClient();
      const spreadsheetId = requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
      await withRetry(() => sheets.spreadsheets.get({ spreadsheetId }));
      return { ok: true, message: "Google Sheets connection OK" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  },

  async fetch(range: DateRange): Promise<Record<string, MetricValue>> {
    const rows = await readRows();

    // Keep only the most recent row per metricId that falls within [range.start, range.end],
    // OR — since these are manually updated infrequently — fall back to the single most
    // recent row overall if nothing falls exactly inside the requested window. This mirrors
    // how a human would read "the latest reported NPS" rather than requiring a fresh entry
    // every single day.
    const byMetric = new Map<string, SheetRow>();
    for (const row of rows) {
      if (!ALLOWED_METRIC_IDS.has(row.metricId)) continue;
      const existing = byMetric.get(row.metricId);
      if (!existing || row.asOfDate > existing.asOfDate) {
        byMetric.set(row.metricId, row);
      }
    }

    const result: Record<string, MetricValue> = {};
    for (const [metricId, row] of byMetric.entries()) {
      const inRange = row.asOfDate >= range.start && row.asOfDate <= range.end;
      result[metricId] = metric(row.value, {
        note: inRange
          ? row.notes
          : `Most recent manual entry (${row.asOfDate || "no date"}), outside requested range — sheet not updated more recently.${
              row.notes ? " " + row.notes : ""
            }`,
      });
    }

    return result;
  },
};

export default googleSheetsAdapter;
