/**
 * Tests for POST /api/user/[userId]/resend-verification
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
  getCurrentUser: vi.fn(),
  resendVerificationEmail: vi.fn(),
}));

import { POST } from "@/app/api/user/[userId]/resend-verification/route";
import { getCurrentUser, resendVerificationEmail } from "@/service/user";
import AppError from "@/error/AppError";

const params = (userId: string) =>
  ({ params: Promise.resolve({ userId }) }) as any;

function makeRequest() {
  return new NextRequest("http://localhost/api/user/u1/resend-verification", {
    method: "POST",
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/user/[userId]/resend-verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when userId is missing", async () => {
    const res = await POST(makeRequest(), {
      params: Promise.resolve({}),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toContain("User ID is required");
  });

  it("should return 401 when currentUser is not logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const res = await POST(makeRequest(), params("u1"));
    expect(res.status).toBe(401);
  });

  it("should return 403 when currentUser is another client", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      uid: "different-user",
      email: "other@example.com",
      name: "Other",
      picture: null,
      role: "Client",
      admin: false,
      token: {} as any,
    });

    const res = await POST(makeRequest(), params("u1"));
    expect(res.status).toBe(403);
  });

  it("should return 200 when currentUser is the user themselves", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      uid: "u1",
      email: "user@example.com",
      name: "User One",
      picture: null,
      role: "Client",
      admin: false,
      token: {} as any,
    });
    vi.mocked(resendVerificationEmail).mockResolvedValue({ success: true });

    const res = await POST(makeRequest(), params("u1"));
    expect(res.status).toBe(200);
    expect(resendVerificationEmail).toHaveBeenCalledWith("u1");
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("should return 200 when currentUser is an Admin resending for a client", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      uid: "admin1",
      email: "admin@example.com",
      name: "Admin One",
      picture: null,
      role: "Admin",
      admin: true,
      token: {} as any,
    });
    vi.mocked(resendVerificationEmail).mockResolvedValue({ success: true });

    const res = await POST(makeRequest(), params("u1"));
    expect(res.status).toBe(200);
    expect(resendVerificationEmail).toHaveBeenCalledWith("u1");
  });

  it("should return 400 when AppError is thrown by the service", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      uid: "u1",
      email: "user@example.com",
      name: "User One",
      picture: null,
      role: "Client",
      admin: false,
      token: {} as any,
    });
    vi.mocked(resendVerificationEmail).mockRejectedValue(
      new AppError("Email is already verified"),
    );

    const res = await POST(makeRequest(), params("u1"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toContain("Email is already verified");
  });

  it("should return 500 when generic Error is thrown by the service", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      uid: "u1",
      email: "user@example.com",
      name: "User One",
      picture: null,
      role: "Client",
      admin: false,
      token: {} as any,
    });
    vi.mocked(resendVerificationEmail).mockRejectedValue(
      new Error("Database connection lost"),
    );

    const res = await POST(makeRequest(), params("u1"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.message).toBe("Database connection lost");
  });
});
