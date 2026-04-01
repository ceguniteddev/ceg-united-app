/**
 * Tests for GET /api/user/[userId]/business
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
  authenticateRequest: vi.fn(),
  validateToken: vi.fn(),
  validateXIDToken: vi.fn(),
}));

vi.mock("@/service/business", () => ({
  getBusiness: vi.fn(),
  createBusiness: vi.fn(),
  updateBusiness: vi.fn(),
  deleteBusiness: vi.fn(),
}));

import { GET } from "@/app/api/user/[userId]/business/route";
import { getBusiness } from "@/service/business";
import AppError from "@/error/AppError";

const params = (userId: string) =>
  ({ params: Promise.resolve({ userId }) }) as any;

describe("GET /api/user/[userId]/business", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when userId is missing", async () => {
    const req = new NextRequest("http://localhost/api/user/u1/business");
    const res = await GET(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it("should return business data on success", async () => {
    const mockBiz = [{ id: "b1", businessName: "Acme" }];
    (getBusiness as any).mockResolvedValue(mockBiz);
    const req = new NextRequest("http://localhost/api/user/u1/business");
    const res = await GET(req, params("u1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockBiz);
  });

  it("should return 400 when service throws AppError", async () => {
    (getBusiness as any).mockRejectedValue(new AppError("Not found"));
    const req = new NextRequest("http://localhost/api/user/u1/business");
    const res = await GET(req, params("u1"));
    expect(res.status).toBe(400);
  });

  it("should return 500 on unexpected error", async () => {
    (getBusiness as any).mockRejectedValue(new Error("DB error"));
    const req = new NextRequest("http://localhost/api/user/u1/business");
    const res = await GET(req, params("u1"));
    expect(res.status).toBe(500);
  });
});
