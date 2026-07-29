/**
 * adapters/_util.ts
 * ----------------------------------------------------------------------------
 * Shared helpers used by every adapter: retry with exponential backoff,
 * rate-limit-aware delay, and small formatting utilities. Prefixed with `_`
 * so it sorts first in the adapters/ directory and is obviously "not a source
 * adapter" to anyone browsing the folder.
 * ----------------------------------------------------------------------------
 */

import { MetricValue } from "../shared/types";

export interface RetryOptions {
  /** Max number of attempts including the first try. Default 3. */
  maxAttempts?: number;
  /** Base delay in ms before the first retry. Doubles each subsequent attempt. Default 500ms. */
  baseDelayMs?: number;
  /** Optional predicate to decide whether an error is retryable (e.g. 429/5xx only). Defaults to always retryable. */
  isRetryable?: (err: unknown) => boolean;
  /** Called on each retry for logging/observability. */
  onRetry?: (attempt: number, err: unknown) => void;
}

/**
 * Generic retry-with-backoff wrapper. Use this around every outbound API call
 * in every adapter so transient network errors and rate limits (HTTP 429)
 * don't cause a full daily aggregation run to fail.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 500;
  const isRetryable = opts.isRetryable ?? defaultIsRetryable;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const canRetry = attempt < maxAttempts && isRetryable(err);
      if (!canRetry) {
        throw err;
      }
      opts.onRetry?.(attempt, err);
      const retryAfterMs = extractRetryAfterMs(err);
      const backoffMs = retryAfterMs ?? baseDelayMs * 2 ** (attempt - 1);
      await sleep(backoffMs);
    }
  }
  // Unreachable, but keeps TypeScript happy about return type.
  throw lastError;
}

/** Default retryability heuristic: network errors, timeouts, and HTTP 429/5xx. */
function defaultIsRetryable(err: unknown): boolean {
  const status = extractStatusCode(err);
  if (status === 429) return true;
  if (status !== undefined && status >= 500) return true;
  if (status !== undefined) return false; // other 4xx are not retryable (bad request, auth, etc.)

  const message = err instanceof Error ? err.message.toLowerCase() : "";
  return (
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("econnreset") ||
    message.includes("econnrefused") ||
    message.includes("enotfound")
  );
}

/** Best-effort extraction of an HTTP status code from common SDK error shapes (axios, fetch Response, HubSpot/Google client errors). */
function extractStatusCode(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const anyErr = err as Record<string, unknown>;
  if (typeof anyErr.status === "number") return anyErr.status;
  if (typeof anyErr.statusCode === "number") return anyErr.statusCode;
  const response = anyErr.response as Record<string, unknown> | undefined;
  if (response && typeof response.status === "number") return response.status;
  const code = anyErr.code;
  if (typeof code === "number") return code;
  return undefined;
}

/** Best-effort extraction of a Retry-After header (seconds or ms depending on SDK) from common error shapes. */
function extractRetryAfterMs(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const anyErr = err as Record<string, unknown>;
  const response = anyErr.response as
    | { headers?: Record<string, string | undefined> }
    | undefined;
  const headerVal = response?.headers?.["retry-after"] ?? response?.headers?.["Retry-After"];
  if (!headerVal) return undefined;
  const seconds = Number(headerVal);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  return undefined;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Wraps a raw numeric value into a MetricValue with a fresh computedAt timestamp. */
export function metric(
  value: number,
  extra?: Partial<Omit<MetricValue, "value" | "computedAt">>
): MetricValue {
  return {
    value,
    computedAt: new Date().toISOString(),
    ...extra,
  };
}

/** Safe divide that returns 0 instead of NaN/Infinity when the denominator is 0. */
export function safeDiv(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return numerator / denominator;
}

/** Reads a required env var or throws a clear, actionable error naming the missing variable. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Set it in your .env file — see .env.example and docs/START-HERE-DEVELOPER.md.`
    );
  }
  return value;
}

/** Reads an optional env var with a fallback default. */
export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

/** Simple in-memory rate limiter: ensures no more than `maxCalls` per `windowMs` are made through this gate. Good enough for single-process Cloud Functions; not distributed-safe. */
export class RateGate {
  private timestamps: number[] = [];
  constructor(private maxCalls: number, private windowMs: number) {}

  async wait(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxCalls) {
      const oldest = this.timestamps[0];
      const waitMs = this.windowMs - (now - oldest);
      if (waitMs > 0) await sleep(waitMs);
    }
    this.timestamps.push(Date.now());
  }
}
