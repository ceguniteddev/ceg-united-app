/**
 * Tests for POST /api/user/[userId]/premium
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
  updateUserPremiumStatus: vi.fn(),
  getUserById: vi.fn(),
}));

import { POST } from "@/app/api/user/[userId]/premium/route";
import { updateUserPremiumStatus } from "@/service/user";

const params = (userId: string) =>
  ({ params: Promise.resolve({ userId }) }) as any;

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/user/u1/premium", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/user/[userId]/premium", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when isPremium is missing", async () => {
    const res = await POST(makeRequest({}), params("u1"));
    expect(res.status).toBe(400);
  });

  it("should return 400 when isPremium is not a boolean", async () => {
    const res = await POST(makeRequest({ isPremium: "yes" }), params("u1"));
    expect(res.status).toBe(400);
  });

  it("should return 400 when userId is missing", async () => {
    const res = await POST(makeRequest({ isPremium: true }), {
      params: Promise.resolve({}),
    } as any);
    expect(res.status).toBe(400);
  });

  it("should set premium status to true and return 200", async () => {
    (updateUserPremiumStatus as any).mockResolvedValue(undefined);
    const res = await POST(makeRequest({ isPremium: true }), params("u1"));
    expect(updateUserPremiumStatus).toHaveBeenCalledWith({
      id: "u1",
      isPremium: true,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/updated/i);
  });

  it("should set premium status to false and return 200", async () => {
    (updateUserPremiumStatus as any).mockResolvedValue(undefined);
    const res = await POST(makeRequest({ isPremium: false }), params("u1"));
    expect(updateUserPremiumStatus).toHaveBeenCalledWith({
      id: "u1",
      isPremium: false,
    });
    expect(res.status).toBe(200);
  });

  it("should return 400 when service throws", async () => {
    (updateUserPremiumStatus as any).mockRejectedValue(
      new Error("Write failed"),
    );
    const res = await POST(makeRequest({ isPremium: true }), params("u1"));
    expect(res.status).toBe(400);
  });
});
