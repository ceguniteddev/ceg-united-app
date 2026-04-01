/**
 * Tests for GET /api/admin/statistics
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
  authenticateRequest: vi.fn(),
  validateToken: vi.fn(),
  validateXIDToken: vi.fn(),
}));

vi.mock("@/service/statistics", () => ({
  getAdminStatistics: vi.fn(),
  getClientStatistics: vi.fn(),
}));

import { GET } from "@/app/api/admin/statistics/route";
import { getAdminStatistics } from "@/service/statistics";

describe("GET /api/admin/statistics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return admin statistics on success", async () => {
    const mockStats = { totalUsers: 100, totalFunding: 500000 };
    (getAdminStatistics as any).mockResolvedValue(mockStats);

    const req = new NextRequest("http://localhost/api/admin/statistics");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockStats);
  });

  it("should call getAdminStatistics once", async () => {
    (getAdminStatistics as any).mockResolvedValue({});
    const req = new NextRequest("http://localhost/api/admin/statistics");
    await GET(req);
    expect(getAdminStatistics).toHaveBeenCalledOnce();
  });

  it("should return 500 on unexpected error", async () => {
    (getAdminStatistics as any).mockRejectedValue(new Error("DB down"));
    const req = new NextRequest("http://localhost/api/admin/statistics");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
