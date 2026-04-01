import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/service/apply-funding", () => ({ getApplyFunding: vi.fn() }));
vi.mock("@/service/crs", () => ({
  getCRSReport: vi.fn(),
  getCRSBusinessScore: vi.fn(),
  getCRSBusinessProfile: vi.fn(),
}));

import { getBusinessAuditData } from "@/service/business-audit";
import { getApplyFunding } from "@/service/apply-funding";
import {
  getCRSReport,
  getCRSBusinessScore,
  getCRSBusinessProfile,
} from "@/service/crs";

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeApp = (overrides: Record<string, any> = {}) => ({
  businessId: "biz-1",
  annualBusinessRevenue: "120000",
  businessFiledWithIRS1: true,
  businessAmountFunding: "50000",
  ...overrides,
});

const emptyDefaults = {
  auditItems: [],
  fundabilityScore: 0,
  fundabilityStatus: "No Data",
  creditScore: 0,
  creditRating: "Good",
  creditChange: 0,
  accounts: [],
  metrics: [],
  revenueData: [],
  compatibilityFactors: [],
};

describe("service/business-audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCRSReport).mockResolvedValue([]);
    vi.mocked(getCRSBusinessScore).mockResolvedValue(null as any);
    vi.mocked(getCRSBusinessProfile).mockResolvedValue(null as any);
  });

  // ── No business apps ──────────────────────────────────────────────────────
  it("returns empty defaults when no funding applications exist for user", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue(null);

    const result = await getBusinessAuditData("user-1", "biz-1");

    expect(result).toEqual(emptyDefaults);
  });

  it("returns empty defaults when no apps match the given businessId", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([
      makeApp({ businessId: "other-biz" }),
    ]);

    const result = await getBusinessAuditData("user-1", "biz-1");

    expect(result).toEqual(emptyDefaults);
  });

  // ── Audit items from revenue ──────────────────────────────────────────────
  it("builds revenue audit item from annualBusinessRevenue", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([
      makeApp({ annualBusinessRevenue: "200000" }),
    ]);

    const result = await getBusinessAuditData("user-1", "biz-1");

    const revenueItem = result.auditItems.find((i) => i.id === "revenue");
    expect(revenueItem).toBeDefined();
    expect(revenueItem?.value).toBe("$200,000");
    expect(revenueItem?.status).toBe("verified");
  });

  it("falls back to businessGrossProjectedRevenue1 when annualBusinessRevenue is absent", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([
      makeApp({
        annualBusinessRevenue: undefined,
        businessGrossProjectedRevenue1: "90000",
      }),
    ]);

    const result = await getBusinessAuditData("user-1", "biz-1");

    const revenueItem = result.auditItems.find((i) => i.id === "revenue");
    expect(revenueItem?.value).toBe("$90,000");
  });

  // ── Tax filing data ───────────────────────────────────────────────────────
  it("adds verified tax-returns item when businessFiledWithIRS1 is true", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([
      makeApp({ businessFiledWithIRS1: true }),
    ]);

    const result = await getBusinessAuditData("user-1", "biz-1");

    const taxItem = result.auditItems.find((i) => i.id === "tax-returns");
    expect(taxItem?.status).toBe("verified");
    expect(taxItem?.statusLabel).toBe("Verified");
  });

  it("adds warning tax-returns item when businessFiledWithIRS1 is false", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([
      makeApp({ businessFiledWithIRS1: false }),
    ]);

    const result = await getBusinessAuditData("user-1", "biz-1");

    const taxItem = result.auditItems.find((i) => i.id === "tax-returns");
    expect(taxItem?.status).toBe("warning");
    expect(taxItem?.value).toBe("Not Filed");
  });

  // ── Funding utilization ───────────────────────────────────────────────────
  it("always includes funding-utilization audit item when business apps exist", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([
      makeApp({ businessAmountFunding: "75000" }),
    ]);

    const result = await getBusinessAuditData("user-1", "biz-1");

    const utilizationItem = result.auditItems.find(
      (i) => i.id === "funding-utilization",
    );
    expect(utilizationItem).toBeDefined();
    expect(utilizationItem?.value).toContain("75,000");
    expect(utilizationItem?.status).toBe("verified");
  });

  // ── Fundability score calculation ─────────────────────────────────────────
  it("calculates 100% fundability score when all items are verified", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([
      makeApp({ annualBusinessRevenue: "100000", businessFiledWithIRS1: true }),
    ]);

    const result = await getBusinessAuditData("user-1", "biz-1");

    expect(result.fundabilityScore).toBe(100);
    expect(result.fundabilityStatus).toBe("Excellent");
  });

  it("calculates partial fundability score when some items are warnings", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([
      makeApp({
        annualBusinessRevenue: "100000",
        businessFiledWithIRS1: false,
      }),
    ]);

    const result = await getBusinessAuditData("user-1", "biz-1");

    // revenue=verified, tax=warning, utilization=verified → 2/3 = 67%
    expect(result.fundabilityScore).toBe(67);
    expect(result.fundabilityStatus).toBe("Good");
  });

  // ── CRS score integration ─────────────────────────────────────────────────
  it("maps creditScore from CRS business score report", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([makeApp()]);
    vi.mocked(getCRSBusinessScore).mockResolvedValue({
      report: { score: 82, rating: "Very Good", change: 5, accounts: [] },
    } as any);

    const result = await getBusinessAuditData("user-1", "biz-1");

    expect(result.creditScore).toBe(82);
    expect(result.creditRating).toBe("Very Good");
    expect(result.creditChange).toBe(5);
  });

  it("maps accounts from CRS business score report", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([makeApp()]);
    vi.mocked(getCRSBusinessScore).mockResolvedValue({
      report: {
        score: 70,
        rating: "Good",
        accounts: [
          {
            id: "a1",
            type: "LOC",
            balance: 5000,
            limit: 10000,
            status: "Current",
            age: "2 years",
          },
        ],
      },
    } as any);

    const result = await getBusinessAuditData("user-1", "biz-1");

    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0]).toMatchObject({
      id: "a1",
      type: "LOC",
      balance: 5000,
    });
  });

  it("handles getCRSBusinessScore error gracefully (uses defaults)", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([makeApp()]);
    vi.mocked(getCRSBusinessScore).mockRejectedValue(
      new Error("CRS unavailable"),
    );

    const result = await getBusinessAuditData("user-1", "biz-1");

    expect(result.creditScore).toBe(0);
    expect(result.creditRating).toBe("Good");
    expect(result.accounts).toEqual([]);
  });

  // ── CRS profile integration ───────────────────────────────────────────────
  it("maps revenueData from CRS business profile", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([makeApp()]);
    vi.mocked(getCRSBusinessProfile).mockResolvedValue({
      report: {
        revenueData: [
          { month: "Jan", revenue: 15000 },
          { month: "Feb", revenue: 18000 },
        ],
      },
    } as any);

    const result = await getBusinessAuditData("user-1", "biz-1");

    expect(result.revenueData).toHaveLength(2);
    expect(result.revenueData[0]).toEqual({ month: "Jan", revenue: 15000 });
  });

  it("handles getCRSBusinessProfile error gracefully (uses empty array)", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([makeApp()]);
    vi.mocked(getCRSBusinessProfile).mockRejectedValue(
      new Error("Profile unavailable"),
    );

    const result = await getBusinessAuditData("user-1", "biz-1");

    expect(result.revenueData).toEqual([]);
  });

  // ── Compatibility factors ─────────────────────────────────────────────────
  it("sets registered-entity factor met=true when business apps exist", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([makeApp()]);

    const result = await getBusinessAuditData("user-1", "biz-1");

    const factor = result.compatibilityFactors.find(
      (f) => f.id === "registered-entity",
    );
    expect(factor?.met).toBe(true);
  });

  it("sets verified-ein factor always met=true", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([makeApp()]);

    const result = await getBusinessAuditData("user-1", "biz-1");

    const factor = result.compatibilityFactors.find(
      (f) => f.id === "verified-ein",
    );
    expect(factor?.met).toBe(true);
  });

  it("sets credit-score factor met=true when creditScore >= 60", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([makeApp()]);
    vi.mocked(getCRSBusinessScore).mockResolvedValue({
      report: { score: 75, rating: "Good", accounts: [] },
    } as any);

    const result = await getBusinessAuditData("user-1", "biz-1");

    const factor = result.compatibilityFactors.find(
      (f) => f.id === "credit-score",
    );
    expect(factor?.met).toBe(true);
  });

  it("sets credit-score factor met=false when creditScore < 60", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([makeApp()]);
    vi.mocked(getCRSBusinessScore).mockResolvedValue({
      report: { score: 45, rating: "Fair", accounts: [] },
    } as any);

    const result = await getBusinessAuditData("user-1", "biz-1");

    const factor = result.compatibilityFactors.find(
      (f) => f.id === "credit-score",
    );
    expect(factor?.met).toBe(false);
  });

  // ── Metrics derived from auditItems ──────────────────────────────────────
  it("maps auditItems to financial metrics", async () => {
    vi.mocked(getApplyFunding).mockResolvedValue([
      makeApp({ annualBusinessRevenue: "100000" }),
    ]);

    const result = await getBusinessAuditData("user-1", "biz-1");

    const revMetric = result.metrics.find((m) => m.id === "revenue");
    expect(revMetric).toBeDefined();
    expect(revMetric?.status).toBe("Verified");
    expect(revMetric?.icon).toBe("trending-up");
  });
});
