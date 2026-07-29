/**
 * adapters/calendly.ts
 * ----------------------------------------------------------------------------
 * Calendly adapter — audit bookings, show rate.
 *
 * No official Node SDK exists for Calendly; this adapter calls the documented
 * REST API directly via `fetch`.
 *
 * Auth: Personal Access Token (see docs/START-HERE-DEVELOPER.md Section 3).
 *
 * Env vars:
 *   CALENDLY_ACCESS_TOKEN   (required) Personal access token
 *   CALENDLY_ORG_URI        (required) Your organization URI, e.g. "https://api.calendly.com/organizations/XXXX"
 *   CALENDLY_AUDIT_EVENT_TYPE_NAME  (optional) Event type name to filter as "audit" bookings, default "Audit Call"
 * ----------------------------------------------------------------------------
 */

import { Adapter, AdapterTestResult, DateRange, MetricValue } from "../shared/types";
import { metric, optionalEnv, requireEnv, safeDiv, withRetry } from "./_util";

const API_BASE = "https://api.calendly.com";

interface CalendlyScheduledEvent {
  uri: string;
  name: string;
  status: "active" | "canceled";
  start_time: string;
  event_type: string;
}

interface CalendlyListResponse<T> {
  collection: T[];
  pagination: { next_page_token: string | null };
}

async function calendlyGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const accessToken = requireEnv("CALENDLY_ACCESS_TOKEN");
  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  return withRetry(
    async () => {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const body = await res.text();
        const error = new Error(`Calendly API error ${res.status}: ${body}`);
        (error as any).status = res.status;
        throw error;
      }
      return (await res.json()) as T;
    },
    {
      isRetryable: (err) => {
        const status = (err as any)?.status;
        return status === 429 || (typeof status === "number" && status >= 500);
      },
    }
  );
}

async function fetchScheduledEvents(range: DateRange): Promise<CalendlyScheduledEvent[]> {
  const orgUri = requireEnv("CALENDLY_ORG_URI");
  const events: CalendlyScheduledEvent[] = [];
  let pageToken: string | undefined;

  do {
    const params: Record<string, string> = {
      organization: orgUri,
      min_start_time: `${range.start}T00:00:00.000000Z`,
      max_start_time: `${range.end}T23:59:59.999999Z`,
      count: "100",
      ...(pageToken ? { page_token: pageToken } : {}),
    };
    const resp = await calendlyGet<CalendlyListResponse<CalendlyScheduledEvent>>(
      "/scheduled_events",
      params
    );
    events.push(...resp.collection);
    pageToken = resp.pagination.next_page_token ?? undefined;
  } while (pageToken);

  return events;
}

export const calendlyAdapter: Adapter = {
  id: "calendly",
  displayName: "Calendly",

  async test(): Promise<AdapterTestResult> {
    try {
      await calendlyGet("/users/me", {});
      return { ok: true, message: "Calendly connection OK" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  },

  async fetch(range: DateRange): Promise<Record<string, MetricValue>> {
    const auditEventTypeName = optionalEnv("CALENDLY_AUDIT_EVENT_TYPE_NAME", "Audit Call");

    const allEvents = await fetchScheduledEvents(range);
    const auditEvents = allEvents.filter((e) =>
      e.name.toLowerCase().includes(auditEventTypeName.toLowerCase())
    );

    const auditsBooked = auditEvents.length;

    // Calendly's public API does not expose a native "no-show" flag without the
    // Enterprise-only Invitee No Show API. We treat `status === 'active'` events
    // whose start_time has passed as "attended" (best-effort) unless a no-show
    // has been explicitly logged elsewhere (e.g. synced from HubSpot activity).
    // If you have the No Show add-on enabled, replace this with a call to
    // GET /invitee_no_shows for precise show-rate accuracy.
    const now = Date.now();
    const pastEvents = auditEvents.filter((e) => new Date(e.start_time).getTime() < now);
    const attendedEvents = pastEvents.filter((e) => e.status === "active");
    const auditShowRate = safeDiv(attendedEvents.length, pastEvents.length || 1);

    return {
      auditsBooked: metric(auditsBooked, { sampleSize: auditsBooked }),
      auditShowRate: metric(auditShowRate, {
        format: "percent",
        sampleSize: pastEvents.length,
        note:
          pastEvents.length === 0
            ? "No past events in range yet to compute a show rate."
            : "Approximated from event status; enable Calendly's No-Show API for exact figures.",
      }),
    };
  },
};

export default calendlyAdapter;
