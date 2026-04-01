/**
 * Tests for:
 *   GET /api/funding-application
 *   GET /api/funding-application/[referenceNumber]
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
  authenticateRequest: vi.fn(),
  validateToken: vi.fn(),
  validateXIDToken: vi.fn(),
}));

vi.mock("@/service/bank-products", () => ({
  getFundMappingAnalysisDetails: vi.fn(),
}));

vi.mock("@/service/apply-funding", () => ({
  getApplyFundingByReferenceNumber: vi.fn(),
}));

import { GET as listApplications } from "@/app/api/funding-application/route";
import { GET as getByReference } from "@/app/api/funding-application/[referenceNumber]/route";
import { getFundMappingAnalysisDetails } from "@/service/bank-products";
import { getApplyFundingByReferenceNumber } from "@/service/apply-funding";

// ---------------------------------------------------------------------------
// GET /api/funding-application
// ---------------------------------------------------------------------------
describe("GET /api/funding-application", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return all applications when no filters given", async () => {
    const mockData = [{ id: "a1" }, { id: "a2" }];
    (getFundMappingAnalysisDetails as any).mockResolvedValue(mockData);

    const req = new NextRequest("http://localhost/api/funding-application");
    const res = await listApplications(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockData);
  });

  it("should filter by userId when provided", async () => {
    (getFundMappingAnalysisDetails as any).mockResolvedValue([]);
    const req = new NextRequest(
      "http://localhost/api/funding-application?userId=u1",
    );
    await listApplications(req);
    expect(getFundMappingAnalysisDetails).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1" }),
    );
  });

  it("should filter by referenceNumber when provided", async () => {
    (getFundMappingAnalysisDetails as any).mockResolvedValue([]);
    const req = new NextRequest(
      "http://localhost/api/funding-application?referenceNumber=REF-001",
    );
    await listApplications(req);
    expect(getFundMappingAnalysisDetails).toHaveBeenCalledWith(
      expect.objectContaining({ referenceNumber: "REF-001" }),
    );
  });

  it("should return 500 on unexpected service error", async () => {
    (getFundMappingAnalysisDetails as any).mockRejectedValue(
      new Error("DB down"),
    );
    const req = new NextRequest("http://localhost/api/funding-application");
    const res = await listApplications(req);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/funding-application/[referenceNumber]
// ---------------------------------------------------------------------------
describe("GET /api/funding-application/[referenceNumber]", () => {
  const params = (referenceNumber: string) =>
    ({ params: Promise.resolve({ referenceNumber }) }) as any;

  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when referenceNumber is missing", async () => {
    const req = new NextRequest("http://localhost/api/funding-application/x");
    const res = await getByReference(req, {
      params: Promise.resolve({}),
    } as any);
    expect(res.status).toBe(400);
  });

  it("should return application data on success", async () => {
    const mockApp = { id: "a1", referenceNumber: "REF-001" };
    (getApplyFundingByReferenceNumber as any).mockResolvedValue(mockApp);

    const req = new NextRequest(
      "http://localhost/api/funding-application/REF-001",
    );
    const res = await getByReference(req, params("REF-001"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockApp);
  });

  it("should call service with the correct referenceNumber", async () => {
    (getApplyFundingByReferenceNumber as any).mockResolvedValue({});
    const req = new NextRequest(
      "http://localhost/api/funding-application/REF-999",
    );
    await getByReference(req, params("REF-999"));
    expect(getApplyFundingByReferenceNumber).toHaveBeenCalledWith({
      referenceNumber: "REF-999",
    });
  });

  it("should return 500 on unexpected error", async () => {
    (getApplyFundingByReferenceNumber as any).mockRejectedValue(
      new Error("DB error"),
    );
    const req = new NextRequest(
      "http://localhost/api/funding-application/REF-001",
    );
    const res = await getByReference(req, params("REF-001"));
    expect(res.status).toBe(500);
  });
});
