// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: unknown) => handler,
}));

import { GET } from "@/app/api/pricing/route";

const fetchMock = vi.fn();
const record = (sku: string | number = 1234) => ({
  id: 99,
  sku,
  bank: { id: 1, name: "Example Bank" },
  credit_limit: "25000.00",
  date_opened: "2019-12-01T08:00:00.000Z",
  purchase_deadline_at: "2026-10-17",
  reporting_date_at: "Oct 28th - Nov 4th",
  stock: 2,
  price: 450.5,
  last4: "9876",
  YTD_earning: "1000",
});
const page = (records: unknown[], total: number | string = records.length) =>
  Response.json({ records, total });
const request = () => GET(new NextRequest("http://localhost/api/pricing"));

describe("tradeline pricing API", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("WC_CONSUMER_KEY", "test-key&=+");
    vi.stubEnv("WC_CONSUMER_SECRET", "test-secret&=+");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("uses client credentials and preserves the client/admin pricing contract", async () => {
    fetchMock.mockResolvedValueOnce(page([record("001234")]));
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const items = await response.json();
    expect(items).toEqual([
      {
        image: "",
        bank_name: "Example Bank",
        card_id: "001234",
        credit_limit: "$25,000.00",
        credit_limit_original: 25000,
        date_opened: "12/01/2019",
        date_opened_original: Date.parse("2019-12-01T08:00:00.000Z"),
        purchase_deadline: "10/17/2026",
        purchase_deadline_original: Date.parse("2026-10-17"),
        reporting_period: "Oct 28th - Nov 4th",
        reporting_period_original: Date.parse("2026-10-28"),
        stock: 2,
        price: 450.5,
      },
    ]);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url.origin + url.pathname).toBe(
      "https://api.tradelinesupply.com/rest-api-public/tradelines",
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: "test-key&=+",
      client_secret: "test-secret&=+",
      page: "1",
      take: "100",
    });
    expect(options).toEqual(
      expect.objectContaining({
        cache: "no-store",
        redirect: "error",
        signal: expect.any(AbortSignal),
      }),
    );
    // Existing markup and cooldown logic continue to receive numeric prices/string SKUs.
    expect(items[0].price * 1.1).toBeCloseTo(495.55);
    expect(
      items.filter((item: { card_id: string }) => item.card_id !== "001234"),
    ).toEqual([]);
  });

  it("loads all pages using total, including a short provider page", async () => {
    fetchMock.mockResolvedValueOnce(page([record(1), record(2)], "3"));
    fetchMock.mockResolvedValueOnce(page([record(3)], 3));
    const response = await request();
    expect(
      (await response.json()).map((item: { card_id: string }) => item.card_id),
    ).toEqual(["1", "2", "3"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0].searchParams.get("page")).toBe("2");
    expect(fetchMock.mock.calls[1][1].signal).toBe(
      fetchMock.mock.calls[0][1].signal,
    );
  });

  it("handles an empty catalog", async () => {
    fetchMock.mockResolvedValueOnce(page([], 0));
    expect(await (await request()).json()).toEqual([]);
  });

  it.each([{ records: [] }, { records: [record(1)] }])(
    "rejects stalled pagination instead of returning a partial list",
    async ({ records }) => {
      fetchMock.mockResolvedValueOnce(page([record(1)], 2));
      fetchMock.mockResolvedValueOnce(page(records, 2));
      expect((await request()).status).toBe(502);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );

  it("does not duplicate SKUs across pages", async () => {
    fetchMock.mockResolvedValueOnce(page([record(1), record(2)], 3));
    fetchMock.mockResolvedValueOnce(page([record(2), record(3)], 3));
    expect(await (await request()).json()).toHaveLength(3);
  });

  it("keeps zero stock/price valid and retains optional images", async () => {
    fetchMock.mockResolvedValueOnce(
      page([
        {
          ...record(),
          stock: "0",
          price: "0",
          image: "https://example.com/bank.png",
        },
      ]),
    );
    expect(await (await request()).json()).toEqual([
      expect.objectContaining({
        stock: 0,
        price: 0,
        image: "https://example.com/bank.png",
      }),
    ]);
  });

  it("sorts January reporting after a December deadline", async () => {
    fetchMock.mockResolvedValueOnce(
      page([
        {
          ...record(),
          purchase_deadline_at: "2026-12-28",
          reporting_date_at: "Jan 5th - Jan 12th",
        },
      ]),
    );
    expect((await (await request()).json())[0].reporting_period_original).toBe(
      Date.parse("2027-01-05"),
    );
  });

  it.each(["WC_CONSUMER_KEY", "WC_CONSUMER_SECRET"])(
    "rejects missing %s without calling the provider",
    async (key) => {
      vi.stubEnv(key, "");
      const response = await request();
      expect(response.status).toBe(503);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([401, 403, 429, 500])(
    "sanitizes provider HTTP %s failures",
    async (status) => {
      fetchMock.mockResolvedValueOnce(
        new Response("sensitive provider response", { status }),
      );
      const response = await request();
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({
        error: `Tradeline provider request failed (HTTP ${status}).`,
      });
    },
  );

  it.each([
    {},
    { records: null, total: 0 },
    { records: [], total: -1 },
    { records: [], total: 10001 },
    { records: [], total: 1.5 },
    { records: [record()] },
    { records: [{ ...record(), price: "invalid" }], total: 1 },
    { records: [{ ...record(), credit_limit: null }], total: 1 },
    { records: [{ ...record(), stock: -1 }], total: 1 },
    { records: [{ ...record(), stock: 0.5 }], total: 1 },
    { records: [{ ...record(), sku: null }], total: 1 },
    { records: [{ ...record(), bank: null }], total: 1 },
    { records: [{ ...record(), date_opened: "not a date" }], total: 1 },
  ])(
    "rejects malformed data without exposing provider fields",
    async (body) => {
      fetchMock.mockResolvedValueOnce(Response.json(body));
      const response = await request();
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({
        error: "Invalid response from tradeline provider.",
      });
    },
  );

  it("sanitizes network errors that may contain credentials", async () => {
    fetchMock.mockRejectedValueOnce(
      new Error("https://provider/?client_secret=test-secret&=+"),
    );
    const response = await request();
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Unable to load tradeline pricing. Please try again.",
    });
  });

  it("sanitizes invalid JSON", async () => {
    fetchMock.mockResolvedValueOnce(new Response("sensitive non-JSON body"));
    expect((await request()).status).toBe(502);
  });

  it("does not return partial results when a later page fails", async () => {
    fetchMock.mockResolvedValueOnce(page([record(1)], 2));
    fetchMock.mockResolvedValueOnce(new Response("failed", { status: 500 }));
    expect((await request()).status).toBe(502);
  });
});
