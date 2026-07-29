/**
 * adapters/index.ts
 * ----------------------------------------------------------------------------
 * Barrel export + registry of all adapters. Import this single file from
 * Cloud Functions instead of reaching into individual adapter files, so
 * adding/removing a source is a one-line change.
 * ----------------------------------------------------------------------------
 */

import { Adapter } from "../shared/types";
import hubspotAdapter from "./hubspot";
import asanaAdapter from "./asana";
import firebaseBrainAdapter from "./firebase-brain";
import metaAdsAdapter from "./meta-ads";
import googleAdsAdapter from "./google-ads";
import calendlyAdapter from "./calendly";
import googleSheetsAdapter from "./google-sheets";

export {
  hubspotAdapter,
  asanaAdapter,
  firebaseBrainAdapter,
  metaAdsAdapter,
  googleAdsAdapter,
  calendlyAdapter,
  googleSheetsAdapter,
};

/** Every adapter in the system, in the order they should be called during daily aggregation. */
export const ALL_ADAPTERS: Adapter[] = [
  hubspotAdapter,
  asanaAdapter,
  firebaseBrainAdapter,
  metaAdsAdapter,
  googleAdsAdapter,
  calendlyAdapter,
  googleSheetsAdapter,
];

/** Returns only the adapters explicitly enabled via the ACTIVE_KPI_ADAPTERS env var, or all if none specified. */
export function getActiveAdapters(): Adapter[] {
  const activeParam = process.env.ACTIVE_KPI_ADAPTERS;
  if (!activeParam) return ALL_ADAPTERS; // Default to all if not specified

  const activeIds = activeParam.split(",").map((s) => s.trim().toLowerCase());
  return ALL_ADAPTERS.filter((a) => activeIds.includes(a.id));
}

/** Lookup an adapter by its `id` field (matches KPIDefinition.source for non-"computed" sources). */
export function getAdapterById(id: string): Adapter | undefined {
  return ALL_ADAPTERS.find((a) => a.id === id);
}
