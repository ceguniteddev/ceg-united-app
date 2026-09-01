/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({
  verifySession: vi.fn(),
  getUserById: vi.fn(),
  getUserMembership: vi.fn(),
  getUserAddons: vi.fn(),
  hasActiveAddon: vi.fn(),
  getSystemConfig: vi.fn(),
  getClientEntitlements: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  verifySession: mocks.verifySession,
}));

vi.mock("@/service/user", () => ({
  getUserById: mocks.getUserById,
}));

vi.mock("@/service/membership", () => ({
  getUserMembership: mocks.getUserMembership,
}));

vi.mock("@/service/addons", () => ({
  getUserAddons: mocks.getUserAddons,
  hasActiveAddon: mocks.hasActiveAddon,
}));

vi.mock("@/service/system-config", () => ({
  getSystemConfig: mocks.getSystemConfig,
}));

vi.mock("@/service/course-capabilities", () => ({
  getClientEntitlements: mocks.getClientEntitlements,
}));

import { NextRequest, NextResponse } from "next/server";
import { proxy } from "@/proxy";

describe("proxy middleware API validation", () => {
  let nextSpy: any;
  let jsonSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClientEntitlements.mockResolvedValue({
      hasNonIncomeFundingAccess: true,
      hasDisputeAccess: true,
    });

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

    mocks.verifySession.mockResolvedValue({
      email: "client@test.com",
      uid: "client_uid",
    });
    mocks.getUserById.mockResolvedValue({ role: "Client" });

    await proxy(req);

    expect(jsonSpy).toHaveBeenCalledWith("Unauthorized: Access denied", {
      status: 403,
    });
  });

  it("should block Client from accessing Broker API with session cookie", async () => {
    const req = createMockReq("/api/broker/clients", "valid_session");

    mocks.verifySession.mockResolvedValue({
      email: "client@test.com",
      uid: "client_uid",
    });
    mocks.getUserById.mockResolvedValue({ role: "Client" });

    await proxy(req);

    expect(jsonSpy).toHaveBeenCalledWith("Unauthorized: Access denied", {
      status: 403,
    });
  });

  it("should block Client from accessing unknown API (not in allowed prefixes)", async () => {
    const req = createMockReq("/api/unknown/endpoint", "valid_session");

    mocks.verifySession.mockResolvedValue({
      email: "client@test.com",
      uid: "client_uid",
    });
    mocks.getUserById.mockResolvedValue({ role: "Client" });

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

    mocks.verifySession.mockResolvedValue({
      email: "client@test.com",
      uid: "client_uid",
    });
    mocks.getUserById.mockResolvedValue({ role: "Client" });

    await proxy(req);

    expect(jsonSpy).toHaveBeenCalledWith("Unauthorized: Access denied", {
      status: 403,
    });
  });

  it("should allow Client to access their own API route", async () => {
    const req = createMockReq("/api/user/client_uid/profile", "valid_session");

    mocks.verifySession.mockResolvedValue({
      email: "client@test.com",
      uid: "client_uid",
    });
    mocks.getUserById.mockResolvedValue({ role: "Client" });

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

    mocks.verifySession.mockResolvedValue({
      email: "client@test.com",
      uid: "client_uid",
    });
    mocks.getUserById.mockResolvedValue({ role: "Client" });

    await proxy(req);

    expect(nextSpy).toHaveBeenCalled();
  });

  it("should allow Admin to access Admin API", async () => {
    const req = createMockReq("/api/admin/income-funding", "valid_session");

    mocks.verifySession.mockResolvedValue({
      email: "admin@test.com",
      uid: "admin_uid",
    });
    mocks.getUserById.mockResolvedValue({ role: "Admin" });

    await proxy(req);

    expect(nextSpy).toHaveBeenCalled();
  });

  describe("client page routing for /client/my-learning", () => {
    it("allows access to /client/my-learning when client has active membership", async () => {
      const req = createMockReq("/client/my-learning", "valid_session");

      mocks.verifySession.mockResolvedValue({
        email: "client@test.com",
        uid: "client_uid",
      });
      mocks.getUserById.mockResolvedValue({ role: "Client" });
      mocks.getUserMembership.mockResolvedValue({ status: "active" });

      await proxy(req);

      expect(nextSpy).toHaveBeenCalled();
    });

    it("allows access to /client/my-learning for any client even without membership or addon", async () => {
      const req = createMockReq("/client/my-learning", "valid_session");

      mocks.verifySession.mockResolvedValue({
        email: "client@test.com",
        uid: "client_uid",
      });
      mocks.getUserById.mockResolvedValue({ role: "Client" });
      mocks.getUserMembership.mockResolvedValue(null);
      mocks.getUserAddons.mockResolvedValue([]);

      await proxy(req);

      expect(nextSpy).toHaveBeenCalled();
    });

    it("redirects /client/my-analysis to Platform Access when the client has only an addon", async () => {
      const redirectSpy = vi.spyOn(NextResponse, "redirect");
      const req = createMockReq("/client/my-analysis", "valid_session");

      mocks.verifySession.mockResolvedValue({
        email: "client@test.com",
        uid: "client_uid",
      });
      mocks.getUserById.mockResolvedValue({ role: "Client" });
      mocks.getUserMembership.mockResolvedValue(null);
      mocks.getUserAddons.mockResolvedValue([
        { addonId: "credit_module_pro", status: "active" },
      ]);

      await proxy(req);

      expect(redirectSpy).toHaveBeenCalledWith(
        new URL(
          "/client/platform-access?required=platform",
          "http://localhost:3000",
        ),
      );
    });
  });

  describe("course preview and educational materials routing", () => {
    it("allows Admin to access /client/courses/[courseId] for preview without redirection to admin home", async () => {
      const req = createMockReq("/client/courses/course_123", "valid_session");

      mocks.verifySession.mockResolvedValue({
        email: "admin@test.com",
        uid: "admin_uid",
      });
      mocks.getUserById.mockResolvedValue({ role: "Admin" });

      await proxy(req);

      expect(nextSpy).toHaveBeenCalled();
    });

    it("allows Broker to access /client/courses/[courseId] without redirection to broker home", async () => {
      const req = createMockReq("/client/courses/course_123", "valid_session");

      mocks.verifySession.mockResolvedValue({
        email: "broker@test.com",
        uid: "broker_uid",
      });
      mocks.getUserById.mockResolvedValue({ role: "Broker" });

      await proxy(req);

      expect(nextSpy).toHaveBeenCalled();
    });

    it("allows unauthenticated user to access /client/courses/[courseId] without redirect", async () => {
      const req = createMockReq("/client/courses/course_123");

      await proxy(req);

      expect(nextSpy).toHaveBeenCalled();
    });

    it("allows Client to access /api/courses and /api/courses/[courseId]", async () => {
      const req = createMockReq("/api/courses/course_123", "valid_session");

      mocks.verifySession.mockResolvedValue({
        email: "client@test.com",
        uid: "client_uid",
      });
      mocks.getUserById.mockResolvedValue({ role: "Client" });

      await proxy(req);

      expect(nextSpy).toHaveBeenCalled();
    });
  });
});
