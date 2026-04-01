/**
 * Tests for POST /api/user/[userId]/status
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
  authenticateRequest: vi.fn(),
  validateToken: vi.fn(),
  validateXIDToken: vi.fn(),
}));

vi.mock("@/service/user", () => ({
  updateUserStatus: vi.fn(),
  getUserById: vi.fn(),
}));

import { POST } from "@/app/api/user/[userId]/status/route";
import { updateUserStatus } from "@/service/user";

const params = (userId: string) =>
  ({ params: Promise.resolve({ userId }) }) as any;

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/user/u1/status", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/user/[userId]/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when status is missing", async () => {
    const res = await POST(makeRequest({}), params("u1"));
    expect(res.status).toBe(400);
  });

  it("should return 400 when status is invalid", async () => {
    const res = await POST(makeRequest({ status: "Banned" }), params("u1"));
    expect(res.status).toBe(400);
  });

  it("should return 400 when userId is missing", async () => {
    const res = await POST(makeRequest({ status: "Active" }), {
      params: Promise.resolve({}),
    } as any);
    expect(res.status).toBe(400);
  });

  it("should accept Active status and return 200", async () => {
    (updateUserStatus as any).mockResolvedValue(undefined);
    const res = await POST(makeRequest({ status: "Active" }), params("u1"));
    expect(updateUserStatus).toHaveBeenCalledWith({
      id: "u1",
      status: "Active",
    });
    expect(res.status).toBe(200);
  });

  it("should accept InActive status and return 200", async () => {
    (updateUserStatus as any).mockResolvedValue(undefined);
    const res = await POST(makeRequest({ status: "InActive" }), params("u1"));
    expect(res.status).toBe(200);
  });

  it("should accept Paused status and return 200", async () => {
    (updateUserStatus as any).mockResolvedValue(undefined);
    const res = await POST(makeRequest({ status: "Paused" }), params("u1"));
    expect(res.status).toBe(200);
  });

  it("should return 500 when service throws", async () => {
    (updateUserStatus as any).mockRejectedValue(new Error("DB error"));
    const res = await POST(makeRequest({ status: "Active" }), params("u1"));
    expect(res.status).toBe(500);
  });
});
