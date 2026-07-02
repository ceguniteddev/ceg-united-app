import { vi, describe, beforeEach, it, expect, Mock } from "vitest";

// Mock server-only BEFORE imports
vi.mock("server-only", () => {
  return {};
});

import { NextRequest, NextResponse } from "next/server";
import { proxy } from "@/proxy";
import { verifySession } from "@/lib/session";
import { getUserById } from "@/service/user";

vi.mock("@/lib/session", () => ({
  verifySession: vi.fn(),
}));

vi.mock("@/service/user", () => ({
  getUserById: vi.fn(),
}));

describe("proxy middleware API validation", () => {
  let nextSpy: any;
  let jsonSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Spy on NextResponse methods
    nextSpy = vi.spyOn(NextResponse, "next");
    jsonSpy = vi.spyOn(NextResponse, "json");
  });

  const createMockReq = (
    pathname: string,
    token?: string,
    headers: Record<string, string> = {},
  ) => {
    const req = new NextRequest(`http://localhost:3000${pathname}`, {
      headers,
    });

    // Mock the cookie getter
    vi.spyOn(req.cookies, "get").mockImplementation(((name: string) => {
      return name === "auth_token" && token
        ? ({ value: token } as any)
        : undefined;
    }) as any);

    return req;
  };

  it("should bypass role validation for external tokens (x-id-token)", async () => {
    const req = createMockReq("/api/admin/income-funding", "session_token", {
      "x-id-token": "id_token",
    });
    await proxy(req);
    expect(nextSpy).toHaveBeenCalled();
  });

  it("should block Client from accessing Admin API with session cookie", async () => {
    const req = createMockReq("/api/admin/income-funding", "valid_session");

    (verifySession as Mock).mockResolvedValue({
      email: "client@test.com",
      uid: "client_uid",
    });
    (getUserById as Mock).mockResolvedValue({ role: "Client" });

    await proxy(req);

    expect(jsonSpy).toHaveBeenCalledWith("Unauthorized: Access denied", {
      status: 403,
    });
  });

  it("should block Client from accessing Broker API with session cookie", async () => {
    const req = createMockReq("/api/broker/clients", "valid_session");

    (verifySession as Mock).mockResolvedValue({
      email: "client@test.com",
      uid: "client_uid",
    });
    (getUserById as Mock).mockResolvedValue({ role: "Client" });

    await proxy(req);

    expect(jsonSpy).toHaveBeenCalledWith("Unauthorized: Access denied", {
      status: 403,
    });
  });

  it("should block Client from accessing unknown API (not in allowed prefixes)", async () => {
    const req = createMockReq("/api/unknown/endpoint", "valid_session");

    (verifySession as Mock).mockResolvedValue({
      email: "client@test.com",
      uid: "client_uid",
    });
    (getUserById as Mock).mockResolvedValue({ role: "Client" });

    await proxy(req);

    expect(jsonSpy).toHaveBeenCalledWith("Unauthorized: Access denied", {
      status: 403,
    });
  });

  it("should block Client from accessing another user's API route", async () => {
    const req = createMockReq(
      "/api/user/other_user_uid/profile",
      "valid_session",
    );

    (verifySession as Mock).mockResolvedValue({
      email: "client@test.com",
      uid: "client_uid",
    });
    (getUserById as Mock).mockResolvedValue({ role: "Client" });

    await proxy(req);

    expect(jsonSpy).toHaveBeenCalledWith("Unauthorized: Access denied", {
      status: 403,
    });
  });

  it("should allow Client to access their own API route", async () => {
    const req = createMockReq("/api/user/client_uid/profile", "valid_session");

    (verifySession as Mock).mockResolvedValue({
      email: "client@test.com",
      uid: "client_uid",
    });
    (getUserById as Mock).mockResolvedValue({ role: "Client" });

    await proxy(req);

    expect(nextSpy).toHaveBeenCalled();
  });

  it("should allow Client to access allowed public API routes directly", async () => {
    const req = createMockReq("/api/leads", "valid_session");
    await proxy(req);

    // Bypasses because isPublic is true before checking roles
    expect(nextSpy).toHaveBeenCalled();
  });

  it("should allow Client to access allowed client prefixes (e.g. /api/pdf/generate)", async () => {
    const req = createMockReq("/api/pdf/generate", "valid_session");

    (verifySession as Mock).mockResolvedValue({
      email: "client@test.com",
      uid: "client_uid",
    });
    (getUserById as Mock).mockResolvedValue({ role: "Client" });

    await proxy(req);

    expect(nextSpy).toHaveBeenCalled();
  });

  it("should allow Admin to access Admin API", async () => {
    const req = createMockReq("/api/admin/income-funding", "valid_session");

    (verifySession as Mock).mockResolvedValue({
      email: "admin@test.com",
      uid: "admin_uid",
    });
    (getUserById as Mock).mockResolvedValue({ role: "Admin" });

    await proxy(req);

    expect(nextSpy).toHaveBeenCalled();
  });
});
