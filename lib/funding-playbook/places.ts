import type { Branch } from "@/types/funding-playbook";
import { findNearestBranchesN8N } from "@/service/n8n";
import { logInfo } from "@/lib/logger";

export class PlacesApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PlacesApiError";
  }
}

/**
 * Returns mapped branch locations for the given lender near the client's ZIP.
 *
 * Delegates the actual location lookup to the n8n `branches-near-me` webhook.
 * The webhook responds with either an array-wrapped object
 * `[ { branches: [...] } ]` or a direct `{ branches: [...] }` object; both
 * shapes are normalized here. On failure this throws so the caller can decide
 * how to degrade (the funding-playbook route continues with an empty list).
 */
export async function findNearestBranches({
  lenderDisplayName,
  limit = 5,
  userId = "",
}: {
  lenderDisplayName: string;
  limit?: number;
  userId?: string;
}): Promise<Branch[]> {
  const raw = await findNearestBranchesN8N({
    userId,
    lenderDisplayName: lenderDisplayName || "Lender",
  });

  const branches = extractBranches(raw);
  return branches.slice(0, limit).map(normalizeBranch);
}

/**
 * Extracts the `branches` array from the n8n webhook response, tolerating the
 * array-wrapped and direct-object response shapes.
 */
function extractBranches(raw: unknown): unknown[] {
  const container = Array.isArray(raw) ? raw[0] : raw;
  if (
    container &&
    typeof container === "object" &&
    Array.isArray((container as { branches?: unknown }).branches)
  ) {
    return (container as { branches: unknown[] }).branches;
  }
  // Also accept a bare array of branch objects.
  if (Array.isArray(raw)) {
    return raw.filter(
      (item) => item && typeof item === "object" && "placeId" in item,
    );
  }
  return [];
}

/**
 * Coerces a raw branch object from the webhook into the canonical Branch type.
 */
function normalizeBranch(item: unknown): Branch {
  const b = (item ?? {}) as Record<string, unknown>;
  return {
    placeId: String(b.placeId ?? ""),
    name: String(b.name ?? ""),
    address: String(b.address ?? ""),
    lat: Number(b.lat ?? 0),
    lng: Number(b.lng ?? 0),
    distanceMiles: Number(b.distanceMiles ?? 0),
    ...(b.phone != null ? { phone: String(b.phone) } : {}),
    ...(Array.isArray(b.hours) ? { hours: b.hours.map(String) } : {}),
    ...(typeof b.openNow === "boolean" ? { openNow: b.openNow } : {}),
    ...(b.rating != null ? { rating: Number(b.rating) } : {}),
    ...(b.googleMapsUrl != null
      ? { googleMapsUrl: String(b.googleMapsUrl) }
      : {}),
  };
}
