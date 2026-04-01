import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------
// Mock Firebase Admin BEFORE importing api-validation
// ---------------------------------------------------------------
vi.mock("@/lib/fireabase-admin", () => ({
  authenticationAdmin: vi.fn(),
  firestoreAdmin: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getCookie: vi.fn(),
  createSession: vi.fn(),
}));

import {
  withAuth,
  validateToken,
  validateXIDToken,
} from "@/lib/api-validation";
import { authenticationAdmin } from "@/lib/fireabase-admin";
import { getCookie } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function makeRequest(
  headers: Record<string, string> = {},
  url = "http://localhost/api/test",
): NextRequest {
  return new NextRequest(url, { headers });
}

const fakeDecodedToken = { uid: "user-123", email: "test@test.com" } as any;

// ---------------------------------------------------------------
// validateXIDToken
// ---------------------------------------------------------------
describe("validateXIDToken()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null for an empty string", async () => {
    const result = await validateXIDToken("");
    expect(result).toBeNull();
  });

  it("should call verifyIdToken with the token", async () => {
    const verifyIdToken = vi.fn().mockResolvedValue(fakeDecodedToken);
    (authenticationAdmin as any).mockReturnValue({ verifyIdToken });

    const result = await validateXIDToken("valid-token");
    expect(verifyIdToken).toHaveBeenCalledWith("valid-token");
    expect(result).toEqual(fakeDecodedToken);
  });

  it("should return null when verifyIdToken throws", async () => {
    const verifyIdToken = vi.fn().mockRejectedValue(new Error("Invalid token"));
    (authenticationAdmin as any).mockReturnValue({ verifyIdToken });

    const result = await validateXIDToken("bad-token");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------
// validateToken
// ---------------------------------------------------------------
describe("validateToken()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null for an empty token", async () => {
    const result = await validateToken("");
    expect(result).toBeNull();
  });

  it("should return decoded token when verifySessionCookie succeeds", async () => {
    const verifySessionCookie = vi.fn().mockResolvedValue(fakeDecodedToken);
    const verifyIdToken = vi.fn();
    (authenticationAdmin as any).mockReturnValue({
      verifySessionCookie,
      verifyIdToken,
    });

    const result = await validateToken("session-cookie");
    expect(verifySessionCookie).toHaveBeenCalledWith("session-cookie");
    expect(result).toEqual(fakeDecodedToken);
  });

  it("should fall back to verifyIdToken when verifySessionCookie fails", async () => {
    const verifySessionCookie = vi
      .fn()
      .mockRejectedValue(new Error("Invalid session cookie"));
    const verifyIdToken = vi.fn().mockResolvedValue(fakeDecodedToken);
    (authenticationAdmin as any).mockReturnValue({
      verifySessionCookie,
      verifyIdToken,
    });

    const result = await validateToken("id-token");
    expect(verifyIdToken).toHaveBeenCalledWith("id-token");
    expect(result).toEqual(fakeDecodedToken);
  });

  it("should return null when both verifySessionCookie and verifyIdToken fail", async () => {
    const verifySessionCookie = vi
      .fn()
      .mockRejectedValue(new Error("Invalid session"));
    const verifyIdToken = vi
      .fn()
      .mockRejectedValue(new Error("Invalid id token"));
    (authenticationAdmin as any).mockReturnValue({
      verifySessionCookie,
      verifyIdToken,
    });

    const result = await validateToken("bad-token");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------
// withAuth
// ---------------------------------------------------------------
describe("withAuth()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call the handler when Bearer token is valid", async () => {
    const verifyIdToken = vi.fn().mockResolvedValue(fakeDecodedToken);
    (authenticationAdmin as any).mockReturnValue({ verifyIdToken });

    const handler = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withAuth(handler);

    const req = makeRequest({ Authorization: "Bearer valid-token" });
    const res = await wrapped(req);

    expect(handler).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });

  it("should return 401 when Bearer token is invalid", async () => {
    const verifyIdToken = vi.fn().mockRejectedValue(new Error("bad token"));
    (authenticationAdmin as any).mockReturnValue({ verifyIdToken });
    (getCookie as any).mockResolvedValue(null);

    const handler = vi.fn();
    const wrapped = withAuth(handler);

    const req = makeRequest({ Authorization: "Bearer bad-token" });
    const res = await wrapped(req);

    expect(handler).not.toHaveBeenCalled();
    // authenticateRequest catches the thrown error and returns 403 ("Invalid or expired token")
    expect(res.status).toBe(403);
  });

  it("should accept x-id-token header", async () => {
    const verifyIdToken = vi.fn().mockResolvedValue(fakeDecodedToken);
    (authenticationAdmin as any).mockReturnValue({ verifyIdToken });

    const handler = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withAuth(handler);

    const req = makeRequest({ "x-id-token": "x-token-value" });
    const res = await wrapped(req);

    expect(handler).toHaveBeenCalledOnce();
  });

  it("should accept ADMIN_ACCESS_KEY when it matches env", async () => {
    const handler = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withAuth(handler);

    const req = makeRequest({ ADMIN_ACCESS_KEY: "test-admin-key" });
    const res = await wrapped(req);

    expect(handler).toHaveBeenCalledOnce();
  });

  it("should return 401 when ADMIN_ACCESS_KEY does not match", async () => {
    (getCookie as any).mockResolvedValue(null);

    const handler = vi.fn();
    const wrapped = withAuth(handler);

    const req = makeRequest({ ADMIN_ACCESS_KEY: "wrong-key" });
    const res = await wrapped(req);

    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });

  it("should fall back to session cookie", async () => {
    const verifySessionCookie = vi.fn().mockResolvedValue(fakeDecodedToken);
    (authenticationAdmin as any).mockReturnValue({ verifySessionCookie });
    (getCookie as any).mockResolvedValue("session-cookie-value");

    const handler = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));
    const wrapped = withAuth(handler);

    const req = makeRequest({}); // No auth headers
    const res = await wrapped(req);

    expect(handler).toHaveBeenCalledOnce();
  });

  it("should return 401 when no auth is provided", async () => {
    (getCookie as any).mockResolvedValue(null);

    const handler = vi.fn();
    const wrapped = withAuth(handler);

    const req = makeRequest({});
    const res = await wrapped(req);

    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });
});
