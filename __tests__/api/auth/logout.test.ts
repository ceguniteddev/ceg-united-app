import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/fireabase-admin", () => ({
  authenticationAdmin: vi.fn(),
  firestoreAdmin: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getCookie: vi.fn(),
  verifySession: vi.fn(),
  createSession: vi.fn(),
  refreshSession: vi.fn(),
}));

// Mock withAuth to pass-through for testing
vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
  authenticateRequest: vi.fn(),
  validateToken: vi.fn(),
  validateXIDToken: vi.fn(),
}));

import { POST } from "@/app/api/auth/logout/route";
import { authenticationAdmin } from "@/lib/fireabase-admin";
import { authenticateRequest } from "@/lib/api-validation";

const fakeDecodedToken = { uid: "user-123" };

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should revoke tokens and return 200 on success", async () => {
    const revokeRefreshTokens = vi.fn().mockResolvedValue(undefined);
    (authenticationAdmin as any).mockReturnValue({ revokeRefreshTokens });
    (authenticateRequest as any).mockResolvedValue(fakeDecodedToken);

    const req = new NextRequest("http://localhost/api/auth/logout", {
      method: "POST",
      headers: { Authorization: "Bearer valid-token" },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/logged out/i);
  });

  it("should clear the auth_token cookie on success", async () => {
    const revokeRefreshTokens = vi.fn().mockResolvedValue(undefined);
    (authenticationAdmin as any).mockReturnValue({ revokeRefreshTokens });
    (authenticateRequest as any).mockResolvedValue(fakeDecodedToken);

    const req = new NextRequest("http://localhost/api/auth/logout", {
      method: "POST",
      headers: { Authorization: "Bearer valid-token" },
    });
    const res = await POST(req);

    // The Set-Cookie header should contain max-age=-1 to clear the cookie
    const setCookieHeader = res.headers.get("set-cookie") ?? "";
    expect(setCookieHeader).toMatch(/auth_token/i);
  });

  it("should return 500 when revokeRefreshTokens throws", async () => {
    const revokeRefreshTokens = vi
      .fn()
      .mockRejectedValue(new Error("Firebase error"));
    (authenticationAdmin as any).mockReturnValue({ revokeRefreshTokens });
    (authenticateRequest as any).mockResolvedValue(fakeDecodedToken);

    const req = new NextRequest("http://localhost/api/auth/logout", {
      method: "POST",
      headers: { Authorization: "Bearer valid-token" },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
