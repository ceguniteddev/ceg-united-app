/**
 * Tests for GET /api/user/[userId]/statistics
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
  getClientStatistics: vi.fn(),
  getAdminStatistics: vi.fn(),
}));

import { GET } from "@/app/api/user/[userId]/statistics/route";
import { getClientStatistics } from "@/service/statistics";
import AppError from "@/error/AppError";

const params = (userId: string) =>
  ({ params: Promise.resolve({ userId }) }) as any;

describe("GET /api/user/[userId]/statistics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when userId is missing", async () => {
    const req = new NextRequest("http://localhost/api/user/u1/statistics");
    const res = await GET(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it("should return statistics data on success", async () => {
    const mockStats = { totalFunding: 50000 };
    (getClientStatistics as any).mockResolvedValue(mockStats);
    const req = new NextRequest("http://localhost/api/user/u1/statistics");
    const res = await GET(req, params("u1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockStats);
  });

  it("should call getClientStatistics with the userId", async () => {
    (getClientStatistics as any).mockResolvedValue({});
    const req = new NextRequest("http://localhost/api/user/u1/statistics");
    await GET(req, params("u1"));
    expect(getClientStatistics).toHaveBeenCalledWith("u1");
  });

  it("should return 400 when service throws AppError", async () => {
    (getClientStatistics as any).mockRejectedValue(new AppError("Bad data"));
    const req = new NextRequest("http://localhost/api/user/u1/statistics");
    const res = await GET(req, params("u1"));
    expect(res.status).toBe(400);
  });

  it("should return 500 on unexpected error", async () => {
    (getClientStatistics as any).mockRejectedValue(new Error("DB error"));
    const req = new NextRequest("http://localhost/api/user/u1/statistics");
    const res = await GET(req, params("u1"));
    expect(res.status).toBe(500);
  });
});
