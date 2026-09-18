import "server-only";

const BASE_URL = "https://api.tradelinesupply.com/rest-api-public/tradelines";
const PAGE_SIZE = 100;
const MAX_PAGES = 100;

// Preserve the contract used by both client and admin pricing views.
export interface PricingItem {
  image: string;
  bank_name: string;
  card_id: string;
  credit_limit: string;
  credit_limit_original: number;
  date_opened: string;
  date_opened_original: number;
  purchase_deadline: string;
  purchase_deadline_original: number;
  reporting_period: string;
  reporting_period_original: number;
  stock: number;
  price: number;
}

export class TradelinePricingError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = "TradelinePricingError";
  }
}

function invalidResponse(): never {
  throw new TradelinePricingError("Invalid response from tradeline provider.");
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalidResponse();
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) invalidResponse();
  return value.trim();
}

function nonNegativeNumber(value: unknown): number {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  ) {
    invalidResponse();
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) invalidResponse();
  return number;
}

function date(value: unknown): Date {
  const result = new Date(text(value));
  if (!Number.isFinite(result.getTime())) invalidResponse();
  return result;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function reportingSortValue(reportingPeriod: string, deadline: Date): number {
  // The live API returns ranges such as "Oct 28th - Nov 4th", not ISO dates.
  const start = reportingPeriod.match(/^([A-Za-z]{3})[a-z]*\s+(\d{1,2})/i);
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  const month = start ? months.indexOf(start[1].toLowerCase()) : -1;
  if (start && month >= 0) {
    let year = deadline.getUTCFullYear();
    let timestamp = Date.UTC(year, month, Number(start[2]));
    if (
      timestamp < Date.UTC(year, deadline.getUTCMonth(), deadline.getUTCDate())
    ) {
      timestamp = Date.UTC(++year, month, Number(start[2]));
    }
    return timestamp;
  }
  // Also support a dated reporting value, without parsing a yearless range.
  if (/^\d{4}-\d{2}-\d{2}/.test(reportingPeriod)) {
    const timestamp = Date.parse(reportingPeriod);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  // Keep an unfamiliar provider label readable and its sort key deterministic.
  return deadline.getTime();
}

function normalizeRecord(value: unknown): PricingItem {
  const record = object(value);
  const bank = object(record.bank);
  const sku = record.sku;
  if (typeof sku !== "string" && typeof sku !== "number") invalidResponse();
  if (typeof sku === "number" && !Number.isSafeInteger(sku)) invalidResponse();
  const cardId = text(String(sku));
  const creditLimit = nonNegativeNumber(record.credit_limit);
  const opened = date(record.date_opened);
  const deadline = date(record.purchase_deadline_at);
  const reportingPeriod = text(record.reporting_date_at);
  const stock = nonNegativeNumber(record.stock);
  if (!Number.isSafeInteger(stock)) invalidResponse();

  // Explicit allowlist: never forward provider account/internal fields.
  return {
    image: typeof record.image === "string" ? record.image : "",
    bank_name: text(bank.name),
    card_id: cardId,
    credit_limit: currencyFormatter.format(creditLimit),
    credit_limit_original: creditLimit,
    date_opened: dateFormatter.format(opened),
    date_opened_original: opened.getTime(),
    purchase_deadline: dateFormatter.format(deadline),
    purchase_deadline_original: deadline.getTime(),
    reporting_period: reportingPeriod,
    reporting_period_original: reportingSortValue(reportingPeriod, deadline),
    stock,
    price: nonNegativeNumber(record.price),
  };
}

export async function getTradelinePricing(): Promise<PricingItem[]> {
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!key?.trim() || !secret?.trim()) {
    throw new TradelinePricingError(
      "Tradeline pricing is not configured.",
      503,
    );
  }

  const items = new Map<string, PricingItem>();
  // Bound the entire catalog request, not each page independently.
  const signal = AbortSignal.timeout(30_000);
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = new URL(BASE_URL);
      url.search = new URLSearchParams({
        client_id: key,
        client_secret: secret,
        page: String(page),
        take: String(PAGE_SIZE),
      }).toString();
      const response = await fetch(url, {
        cache: "no-store",
        redirect: "error",
        headers: { "cache-control": "no-cache" },
        signal,
      });
      if (!response.ok) {
        // Provider auth errors are upstream failures, not app session failures.
        throw new TradelinePricingError(
          `Tradeline provider request failed (HTTP ${response.status}).`,
        );
      }

      const data = object(await response.json());
      if (!Array.isArray(data.records)) invalidResponse();
      const total = nonNegativeNumber(data.total);
      if (!Number.isSafeInteger(total) || total > MAX_PAGES * PAGE_SIZE) {
        invalidResponse();
      }
      const previousCount = items.size;
      for (const record of data.records) {
        const item = normalizeRecord(record);
        items.set(item.card_id, item);
      }
      if (items.size >= total) return [...items.values()];
      // Do not return a silently truncated catalog if pagination stalls.
      if (items.size === previousCount) {
        throw new TradelinePricingError(
          "Incomplete catalog from tradeline provider.",
        );
      }
    }
    throw new TradelinePricingError(
      "Tradeline provider pagination limit exceeded.",
    );
  } catch (error) {
    if (error instanceof TradelinePricingError) throw error;
    // Fetch/JSON errors can contain the credential-bearing URL or response body.
    // Never propagate or log the original error.
    throw new TradelinePricingError(
      "Unable to load tradeline pricing. Please try again.",
    );
  }
}
