/**
 * adapters/google-ads.ts
 * ----------------------------------------------------------------------------
 * Google Ads adapter — CPL, spend, leads by campaign.
 *
 * SDK: google-ads-api (npm install google-ads-api)
 * Auth: OAuth 2.0 refresh token + Developer Token (see docs/START-HERE-DEVELOPER.md Section 3).
 *
 * Env vars:
 *   GOOGLE_ADS_CLIENT_ID           (required) OAuth client id
 *   GOOGLE_ADS_CLIENT_SECRET       (required) OAuth client secret
 *   GOOGLE_ADS_DEVELOPER_TOKEN     (required) Developer token from Google Ads API Center
 *   GOOGLE_ADS_REFRESH_TOKEN       (required) OAuth refresh token for the authorized account
 *   GOOGLE_ADS_CUSTOMER_ID         (required) Target customer id, digits only, e.g. "1234567890"
 *   GOOGLE_ADS_LOGIN_CUSTOMER_ID   (optional) MCC login customer id if the account is under a manager account
 * ----------------------------------------------------------------------------
 */

import { GoogleAdsApi, Customer } from "google-ads-api";
import { Adapter, AdapterTestResult, DateRange, MetricValue } from "../shared/types";
import { metric, optionalEnv, requireEnv, safeDiv, withRetry } from "./_util";

function getClient(): GoogleAdsApi {
  return new GoogleAdsApi({
    client_id: requireEnv("GOOGLE_ADS_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_ADS_CLIENT_SECRET"),
    developer_token: requireEnv("GOOGLE_ADS_DEVELOPER_TOKEN"),
  });
}

function getCustomer(client: GoogleAdsApi): Customer {
  return client.Customer({
    customer_id: requireEnv("GOOGLE_ADS_CUSTOMER_ID"),
    login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || undefined,
    refresh_token: requireEnv("GOOGLE_ADS_REFRESH_TOKEN"),
  });
}

interface CampaignMetricsRow {
  metrics: {
    cost_micros: number;
    conversions: number;
    conversions_value: number;
  };
}

export const googleAdsAdapter: Adapter = {
  id: "google-ads",
  displayName: "Google Ads",

  async test(): Promise<AdapterTestResult> {
    try {
      const client = getClient();
      const customer = getCustomer(client);
      await withRetry(() =>
        customer.query(`SELECT customer.id FROM customer LIMIT 1`)
      );
      return { ok: true, message: "Google Ads connection OK" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  },

  async fetch(range: DateRange): Promise<Record<string, MetricValue>> {
    const client = getClient();
    const customer = getCustomer(client);

    const leadConversionAction = optionalEnv("GOOGLE_ADS_LEAD_CONVERSION_NAME", "Lead Form Submission");

    const rows = await withRetry<CampaignMetricsRow[]>(() =>
      customer.query(`
        SELECT
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign
        WHERE segments.date BETWEEN '${range.start}' AND '${range.end}'
          AND campaign.status != 'REMOVED'
      `) as unknown as Promise<CampaignMetricsRow[]>
    );

    const totalCostMicros = rows.reduce((sum, r) => sum + (r.metrics.cost_micros || 0), 0);
    const adSpendGoogle = totalCostMicros / 1_000_000;

    // conversions here counts ALL conversion actions; for a precise "leads" number, filter by
    // conversion_action.name == leadConversionAction using a conversion_action-joined query.
    // Kept simple here since exact conversion action naming varies per account setup —
    // see docs/START-HERE-DEVELOPER.md for the account-specific query tweak.
    const leadsFromGoogle = rows.reduce((sum, r) => sum + (r.metrics.conversions || 0), 0);
    const conversionsValue = rows.reduce((sum, r) => sum + (r.metrics.conversions_value || 0), 0);

    const cplGoogle = safeDiv(adSpendGoogle, leadsFromGoogle);
    const roasGoogle = safeDiv(conversionsValue, adSpendGoogle);

    return {
      cplGoogle: metric(cplGoogle, { format: "currency" }),
      adSpendGoogle: metric(adSpendGoogle, { format: "currency" }),
      leadsFromGoogle: metric(leadsFromGoogle, {
        note: `Counts all conversion actions; filter to "${leadConversionAction}" for precision — see docs.`,
      }),
      roasGoogle: metric(roasGoogle, { format: "ratio" }),
    };
  },
};

export default googleAdsAdapter;
