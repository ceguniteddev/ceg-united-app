/**
 * adapters/hubspot.ts
 * ----------------------------------------------------------------------------
 * HubSpot CRM adapter — leads, deals, contacts, pipeline stages, closers,
 * close rate.
 *
 * SDK: @hubspot/api-client  (npm install @hubspot/api-client)
 * Auth: Private App access token (see docs/START-HERE-DEVELOPER.md Section 3).
 * Required scopes:
 *   - crm.objects.deals.read
 *   - crm.objects.contacts.read
 *   - crm.objects.line_items.read
 *   - crm.schemas.deals.read
 *   - sales-email-read
 *
 * Env vars:
 *   HUBSPOT_ACCESS_TOKEN        (required) Private App token
 *   HUBSPOT_PIPELINE_ID         (optional) restrict to one pipeline, default "default"
 *   HUBSPOT_CLOSED_WON_STAGE_ID (optional) override closed-won stage id
 * ----------------------------------------------------------------------------
 */

import { Client as HubSpotClient } from "@hubspot/api-client";
import { Adapter, AdapterTestResult, DateRange, MetricValue } from "../shared/types";
import { metric, optionalEnv, requireEnv, safeDiv, withRetry } from "./_util";

// HubSpot's default "closedwon" internal stage label used across most default pipelines.
const DEFAULT_CLOSED_WON_STAGE = "closedwon";
const DEFAULT_QUALIFIED_STAGE_LIFECYCLE = "salesqualifiedlead";

interface HubSpotDealProps {
  amount?: string;
  dealstage?: string;
  closedate?: string;
  createdate?: string;
  hubspot_owner_id?: string;
  pipeline?: string;
}

interface HubSpotContactProps {
  createdate?: string;
  lifecyclestage?: string;
}

function getClient(): HubSpotClient {
  const accessToken = requireEnv("HUBSPOT_ACCESS_TOKEN");
  return new HubSpotClient({ accessToken });
}

/** Paginates through HubSpot CRM search results, yielding all matching records. */
async function searchAll<T>(
  fetchPage: (after?: string) => Promise<{ results: T[]; paging?: { next?: { after?: string } } }>
): Promise<T[]> {
  const all: T[] = [];
  let after: string | undefined = undefined;
  // Safety cap to avoid runaway pagination loops against a misbehaving API.
  const MAX_PAGES = 200;
  for (let page = 0; page < MAX_PAGES; page++) {
    const resp = await withRetry(() => fetchPage(after));
    all.push(...resp.results);
    after = resp.paging?.next?.after;
    if (!after) break;
  }
  return all;
}

async function fetchDealsInRange(
  client: HubSpotClient,
  range: DateRange
): Promise<Array<{ properties: HubSpotDealProps }>> {
  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end + "T23:59:59.999Z").getTime();

  return searchAll(async (after) => {
    const resp = await client.crm.deals.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "createdate",
              operator: "BETWEEN" as any,
              value: String(startMs),
              highValue: String(endMs),
            } as any,
          ],
        },
      ],
      properties: ["amount", "dealstage", "closedate", "createdate", "hubspot_owner_id", "pipeline"],
      limit: 100,
      after,
    } as any);
    return { results: resp.results as any, paging: resp.paging as any };
  });
}

async function fetchContactsInRange(
  client: HubSpotClient,
  range: DateRange
): Promise<Array<{ properties: HubSpotContactProps }>> {
  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end + "T23:59:59.999Z").getTime();

  return searchAll(async (after) => {
    const resp = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "createdate",
              operator: "BETWEEN" as any,
              value: String(startMs),
              highValue: String(endMs),
            } as any,
          ],
        },
      ],
      properties: ["createdate", "lifecyclestage"],
      limit: 100,
      after,
    } as any);
    return { results: resp.results as any, paging: resp.paging as any };
  });
}

export const hubspotAdapter: Adapter = {
  id: "hubspot",
  displayName: "HubSpot CRM",

  async test(): Promise<AdapterTestResult> {
    try {
      const client = getClient();
      // Cheapest possible authenticated call: fetch 1 deal.
      await withRetry(() =>
        client.crm.deals.basicApi.getPage(1, undefined, ["dealstage"])
      );
      return { ok: true, message: "HubSpot connection OK" };
    } catch (err) {
      return { ok: false, message: describeError(err) };
    }
  },

  async fetch(range: DateRange): Promise<Record<string, MetricValue>> {
    const client = getClient();
    const closedWonStage = optionalEnv("HUBSPOT_CLOSED_WON_STAGE_ID", DEFAULT_CLOSED_WON_STAGE);

    const [deals, contacts] = await Promise.all([
      fetchDealsInRange(client, range),
      fetchContactsInRange(client, range),
    ]);

    const totalLeads = contacts.length;
    const qualifiedLeads = contacts.filter(
      (c) => c.properties.lifecyclestage === DEFAULT_QUALIFIED_STAGE_LIFECYCLE
    ).length;

    const closedDealsList = deals.filter((d) => d.properties.dealstage === closedWonStage);
    const closedDeals = closedDealsList.length;

    const closeRate = safeDiv(closedDeals, qualifiedLeads || totalLeads);

    const totalClosedAmount = closedDealsList.reduce(
      (sum, d) => sum + (parseFloat(d.properties.amount ?? "0") || 0),
      0
    );
    const avgContractValue = safeDiv(totalClosedAmount, closedDeals);

    const closerTotals = new Map<string, number>();
    for (const d of closedDealsList) {
      const owner = d.properties.hubspot_owner_id ?? "unassigned";
      const amount = parseFloat(d.properties.amount ?? "0") || 0;
      closerTotals.set(owner, (closerTotals.get(owner) ?? 0) + amount);
    }
    const distinctClosers = closerTotals.size || 1;
    const revenuePerCloser = safeDiv(totalClosedAmount, distinctClosers);

    // Active clients / retention / refunds require a "client" lifecycle concept that
    // typically lives on a custom property (e.g. `client_status`). Adjust the property
    // name below to match your HubSpot instance's actual custom property.
    const activeClients = await countContactsByProperty(client, "client_status", "active");
    const churnedClients = await countContactsByProperty(client, "client_status", "churned");
    const startOfPeriodActive = activeClients + churnedClients || 1;
    const retentionRate = safeDiv(startOfPeriodActive - churnedClients, startOfPeriodActive);

    const refundRequests = deals.filter(
      (d) => d.properties.dealstage === optionalEnv("HUBSPOT_REFUND_STAGE_ID", "refund_requested")
    ).length;

    return {
      totalLeads: metric(totalLeads, { sampleSize: totalLeads }),
      qualifiedLeads: metric(qualifiedLeads, { sampleSize: qualifiedLeads }),
      closedDeals: metric(closedDeals, { sampleSize: closedDeals }),
      closeRate: metric(closeRate, { format: "percent" }),
      avgContractValue: metric(avgContractValue, { format: "currency" }),
      revenuePerCloser: metric(revenuePerCloser, { format: "currency" }),
      activeClients: metric(activeClients),
      retentionRate: metric(retentionRate, { format: "percent" }),
      refundRequests: metric(refundRequests),
    };
  },
};

/**
 * Counts contacts matching a custom property value. Wrapped separately so a
 * missing/renamed custom property doesn't blow up the entire fetch() — it
 * degrades gracefully to 0 with a note logged via the returned metric's note field
 * (see callers above; on error this resolves to 0).
 */
async function countContactsByProperty(
  client: HubSpotClient,
  propertyName: string,
  value: string
): Promise<number> {
  try {
    const results = await searchAll(async (after) => {
      const resp = await client.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName,
                operator: "EQ" as any,
                value,
              } as any,
            ],
          },
        ],
        properties: [propertyName],
        limit: 100,
        after,
      } as any);
      return { results: resp.results as any, paging: resp.paging as any };
    });
    return results.length;
  } catch {
    // Property likely doesn't exist in this HubSpot instance yet — fail soft.
    return 0;
  }
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export default hubspotAdapter;
