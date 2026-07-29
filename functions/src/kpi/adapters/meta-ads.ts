/**
 * adapters/meta-ads.ts
 * ----------------------------------------------------------------------------
 * Meta Ads adapter — CPL, spend, leads by campaign via the Meta Graph API.
 *
 * No official Node SDK is used here (Meta's `facebook-nodejs-business-sdk` is
 * heavy and awkward with modern TS/ESM); instead this adapter calls the Graph
 * API directly over HTTPS with `fetch`, which is the officially documented
 * integration path for server-to-server Insights API calls.
 *
 * Auth: System User access token with `ads_read` permission, generated from
 * Meta Business Suite (see docs/START-HERE-DEVELOPER.md Section 3).
 *
 * Env vars:
 *   META_ACCESS_TOKEN     (required) System user access token with ads_read
 *   META_AD_ACCOUNT_IDS   (required) Comma-separated list of ad account ids, e.g. "act_123,act_456"
 *   META_API_VERSION      (optional) Graph API version, default "v19.0"
 * ----------------------------------------------------------------------------
 */

import { Adapter, AdapterTestResult, DateRange, MetricValue } from "../shared/types";
import { metric, optionalEnv, requireEnv, safeDiv, withRetry } from "./_util";

const GRAPH_BASE = "https://graph.facebook.com";

interface InsightsRow {
  spend?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
  date_start: string;
  date_stop: string;
}

interface InsightsResponse {
  data: InsightsRow[];
  paging?: { next?: string };
  error?: { message: string; type: string; code: number };
}

function getAccountIds(): string[] {
  return requireEnv("META_AD_ACCOUNT_IDS")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const version = optionalEnv("META_API_VERSION", "v19.0");
  const accessToken = requireEnv("META_ACCESS_TOKEN");
  const url = new URL(`${GRAPH_BASE}/${version}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", accessToken);

  return withRetry(
    async () => {
      const res = await fetch(url.toString());
      const json = (await res.json()) as T & { error?: { message: string; code: number } };
      if (!res.ok || (json as any).error) {
        const err = (json as any).error;
        const error = new Error(err?.message ?? `Meta Graph API error (HTTP ${res.status})`);
        (error as any).status = err?.code === 4 || err?.code === 17 || err?.code === 32 ? 429 : res.status;
        throw error;
      }
      return json;
    },
    {
      isRetryable: (err) => {
        const status = (err as any)?.status;
        return status === 429 || (typeof status === "number" && status >= 500);
      },
    }
  );
}

async function fetchInsightsForAccount(
  accountId: string,
  range: DateRange
): Promise<InsightsRow[]> {
  const resp = await graphGet<InsightsResponse>(`${accountId}/insights`, {
    fields: "spend,actions,action_values",
    time_range: JSON.stringify({ since: range.start, until: range.end }),
    level: "account",
  });
  return resp.data ?? [];
}

function extractActionValue(row: InsightsRow, actionType: string): number {
  const found = row.actions?.find((a) => a.action_type === actionType);
  return found ? parseFloat(found.value) || 0 : 0;
}

function extractActionRevenue(row: InsightsRow, actionType: string): number {
  const found = row.action_values?.find((a) => a.action_type === actionType);
  return found ? parseFloat(found.value) || 0 : 0;
}

export const metaAdsAdapter: Adapter = {
  id: "meta-ads",
  displayName: "Meta Ads",

  async test(): Promise<AdapterTestResult> {
    try {
      const accountIds = getAccountIds();
      if (accountIds.length === 0) {
        return { ok: false, message: "META_AD_ACCOUNT_IDS is empty" };
      }
      await graphGet(`${accountIds[0]}`, { fields: "name" });
      return { ok: true, message: `Meta Ads connection OK (${accountIds.length} account(s))` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  },

  async fetch(range: DateRange): Promise<Record<string, MetricValue>> {
    const accountIds = getAccountIds();

    const results = await Promise.allSettled(
      accountIds.map((id) => fetchInsightsForAccount(id, range))
    );

    const rows: InsightsRow[] = [];
    const failedAccounts: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") rows.push(...r.value);
      else failedAccounts.push(accountIds[i]);
    });

    const adSpendMeta = rows.reduce((sum, r) => sum + (parseFloat(r.spend ?? "0") || 0), 0);
    const leadsFromMeta = rows.reduce((sum, r) => sum + extractActionValue(r, "lead"), 0);
    const attributedRevenue = rows.reduce(
      (sum, r) => sum + extractActionRevenue(r, "offsite_conversion.fb_pixel_purchase"),
      0
    );
    const cplMeta = safeDiv(adSpendMeta, leadsFromMeta);
    const roasMeta = safeDiv(attributedRevenue, adSpendMeta);

    const note =
      failedAccounts.length > 0
        ? `Partial data — ${failedAccounts.length}/${accountIds.length} ad account(s) failed: ${failedAccounts.join(", ")}`
        : undefined;

    return {
      cplMeta: metric(cplMeta, { format: "currency", note }),
      adSpendMeta: metric(adSpendMeta, { format: "currency", note }),
      leadsFromMeta: metric(leadsFromMeta, { note }),
      roasMeta: metric(roasMeta, { format: "ratio", note }),
    };
  },
};

export default metaAdsAdapter;
