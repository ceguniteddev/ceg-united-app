import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session", () => ({
  refreshSession: vi.fn(),
  verifySession: vi.fn(),
  createSession: vi.fn(),
  getCookie: vi.fn(),
}));

import { POST } from "@/app/api/auth/refresh-session/route";
import { refreshSession } from "@/lib/session";

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/auth/refresh-session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/refresh-session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when idToken is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/id token/i);
  });

  it("should call refreshSession and return 200 on success", async () => {
    (refreshSession as any).mockResolvedValue(undefined);
    const res = await POST(makeRequest({ idToken: "valid-id-token" }));
    expect(refreshSession).toHaveBeenCalledWith("valid-id-token");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("should return 500 when refreshSession throws", async () => {
    (refreshSession as any).mockRejectedValue(new Error("Token invalid"));
    const res = await POST(makeRequest({ idToken: "bad-token" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
