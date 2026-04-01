import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session", () => ({
  verifySession: vi.fn(),
  createSession: vi.fn(),
  refreshSession: vi.fn(),
  getCookie: vi.fn(),
}));

import { GET } from "@/app/api/auth/verify-session/route";
import { verifySession } from "@/lib/session";

function makeRequest(cookieValue?: string) {
  const req = new NextRequest("http://localhost/api/auth/verify-session");
  if (cookieValue) {
    req.cookies.set("auth_token", cookieValue);
  }
  return req;
}

describe("GET /api/auth/verify-session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when no auth_token cookie is present", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.valid).toBe(false);
  });

  it("should return 401 when verifySession returns null (invalid cookie)", async () => {
    (verifySession as any).mockResolvedValue(null);
    const res = await GET(makeRequest("bad-cookie"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.valid).toBe(false);
  });

  it("should return 200 with valid:true when session is valid", async () => {
    (verifySession as any).mockResolvedValue({ uid: "user-123" });
    const res = await GET(makeRequest("valid-cookie"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.uid).toBe("user-123");
  });

  it("should return 401 when verifySession throws", async () => {
    (verifySession as any).mockRejectedValue(new Error("Session error"));
    const res = await GET(makeRequest("throws-cookie"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.valid).toBe(false);
  });
});
