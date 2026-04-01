import { describe, it, expect, vi, beforeEach } from "vitest";

// lib/session.ts calls authenticationAdmin() inside each function body,
// not at module level. vi.hoisted() lets us reference mock variables
// inside the vi.mock() factory AND inside the test bodies.
const { mockCookieStore, mockAuthAdmin } = vi.hoisted(() => {
  const mockCookieStore = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  };

  const mockAuthAdmin = {
    verifyIdToken: vi.fn(),
    createSessionCookie: vi.fn(),
    verifySessionCookie: vi.fn(),
    revokeRefreshTokens: vi.fn(),
  };

  return { mockCookieStore, mockAuthAdmin };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock("@/lib/fireabase-admin", () => ({
  authenticationAdmin: vi.fn(() => mockAuthAdmin),
}));

import {
  createSession,
  getCookie,
  setCookie,
  deleteCookie,
  verifySession,
  refreshSession,
  revokeAllSessions,
} from "@/lib/session";

// ---------------------------------------------------------------------------
// getCookie
// ---------------------------------------------------------------------------

describe("getCookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the cookie value when the cookie exists", async () => {
    mockCookieStore.get.mockReturnValue({ value: "my-session-value" });

    const result = await getCookie("auth_token");

    expect(result).toBe("my-session-value");
    expect(mockCookieStore.get).toHaveBeenCalledWith("auth_token");
  });

  it("returns null when the cookie does not exist", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const result = await getCookie("auth_token");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// setCookie
// ---------------------------------------------------------------------------

describe("setCookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls cookieStore.set with the correct key and value", async () => {
    await setCookie("auth_token", "session-abc");

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "auth_token",
        value: "session-abc",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );
  });

  it("merges custom options into the cookie config", async () => {
    await setCookie("my_key", "val", { maxAge: 3600 });

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: "my_key", value: "val", maxAge: 3600 }),
    );
  });
});

// ---------------------------------------------------------------------------
// deleteCookie
// ---------------------------------------------------------------------------

describe("deleteCookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls cookieStore.delete with the given key", async () => {
    await deleteCookie("auth_token");

    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth_token");
  });
});

// ---------------------------------------------------------------------------
// verifySession
// ---------------------------------------------------------------------------

describe("verifySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns decoded claims when the session cookie is valid", async () => {
    const claims = { uid: "user1", email: "user@test.com" };
    mockAuthAdmin.verifySessionCookie.mockResolvedValueOnce(claims);

    const result = await verifySession("valid-cookie");

    expect(result).toEqual(claims);
    expect(mockAuthAdmin.verifySessionCookie).toHaveBeenCalledWith(
      "valid-cookie",
      true,
    );
  });

  it("returns null when the session cookie is invalid", async () => {
    mockAuthAdmin.verifySessionCookie.mockRejectedValueOnce(
      Object.assign(new Error("Invalid session"), {
        code: "auth/argument-error",
      }),
    );

    const result = await verifySession("bad-cookie");

    expect(result).toBeNull();
  });

  it("calls deleteCookie when the session cookie is expired", async () => {
    mockAuthAdmin.verifySessionCookie.mockRejectedValueOnce(
      Object.assign(new Error("Expired"), {
        code: "auth/session-cookie-expired",
      }),
    );

    await verifySession("expired-cookie");

    // deleteCookie → cookieStore.delete should have been called
    expect(mockCookieStore.delete).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null immediately when idToken is empty", async () => {
    const result = await createSession("");

    expect(result).toBeNull();
    expect(mockAuthAdmin.verifyIdToken).not.toHaveBeenCalled();
  });

  it("verifies the token, creates a session cookie, and stores it", async () => {
    mockAuthAdmin.verifyIdToken.mockResolvedValueOnce({ uid: "u1" });
    mockAuthAdmin.createSessionCookie.mockResolvedValueOnce(
      "session-cookie-val",
    );

    await createSession("id-token-123");

    expect(mockAuthAdmin.verifyIdToken).toHaveBeenCalledWith("id-token-123");
    expect(mockAuthAdmin.createSessionCookie).toHaveBeenCalledWith(
      "id-token-123",
      expect.objectContaining({ expiresIn: 6 * 60 * 60 * 1000 }),
    );
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ value: "session-cookie-val" }),
    );
  });

  it("throws 'Error creating session.' when verifyIdToken rejects", async () => {
    mockAuthAdmin.verifyIdToken.mockRejectedValueOnce(
      new Error("auth/invalid-id-token"),
    );

    await expect(createSession("bad-token")).rejects.toThrow(
      "Error creating session.",
    );
  });
});

// ---------------------------------------------------------------------------
// refreshSession
// ---------------------------------------------------------------------------

describe("refreshSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when idToken is empty", async () => {
    const result = await refreshSession("");

    expect(result).toBeNull();
  });

  it("creates a new session cookie and returns true", async () => {
    mockAuthAdmin.createSessionCookie.mockResolvedValueOnce("refreshed-cookie");

    const result = await refreshSession("valid-id-token");

    expect(result).toBe(true);
    expect(mockAuthAdmin.createSessionCookie).toHaveBeenCalledWith(
      "valid-id-token",
      expect.objectContaining({ expiresIn: 6 * 60 * 60 * 1000 }),
    );
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ value: "refreshed-cookie" }),
    );
  });
});

// ---------------------------------------------------------------------------
// revokeAllSessions
// ---------------------------------------------------------------------------

describe("revokeAllSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies the session cookie and revokes refresh tokens", async () => {
    mockAuthAdmin.verifySessionCookie.mockResolvedValueOnce({ sub: "uid1" });
    mockAuthAdmin.revokeRefreshTokens.mockResolvedValueOnce(undefined);

    await revokeAllSessions("valid-session-cookie");

    expect(mockAuthAdmin.verifySessionCookie).toHaveBeenCalledWith(
      "valid-session-cookie",
    );
    expect(mockAuthAdmin.revokeRefreshTokens).toHaveBeenCalledWith("uid1");
  });
});
