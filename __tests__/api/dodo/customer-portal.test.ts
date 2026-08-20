/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({
  portalHandler: vi.fn(),
  portalConfig: undefined as any,
  authenticate: vi.fn(),
  getCustomerId: vi.fn(),
}));

vi.mock("@/lib/dodo-nextjs", () => ({
  CustomerPortal: vi.fn((config: any) => {
    mocks.portalConfig = config;
    return mocks.portalHandler;
  }),
}));
vi.mock("@/lib/api-validation", () => ({
  authenticateRequest: mocks.authenticate,
}));
vi.mock("@/service/dodo", () => ({
  getDodoCustomerIdByUserId: mocks.getCustomerId,
}));

import { NextRequest, NextResponse } from "next/server";
import { GET } from "@/app/api/user/[userId]/dodo/customer-portal/route";

const request = (query = "") =>
  new NextRequest(`http://localhost/api/user/u1/dodo/customer-portal${query}`);

describe("Dodo customer portal adapter route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticate.mockResolvedValue({ uid: "u1" });
    mocks.getCustomerId.mockResolvedValue("cus_owned");
    mocks.portalHandler.mockResolvedValue(
      NextResponse.json({ link: "portal" }),
    );
  });

  it("returns authentication responses", async () => {
    mocks.authenticate.mockResolvedValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );
    expect(
      (await GET(request(), { params: Promise.resolve({ userId: "u1" }) }))
        .status,
    ).toBe(401);
  });

  it("prevents users from opening another user's portal", async () => {
    mocks.authenticate.mockResolvedValueOnce({ uid: "other" });
    expect(
      (await GET(request(), { params: Promise.resolve({ userId: "u1" }) }))
        .status,
    ).toBe(403);
    expect(mocks.getCustomerId).not.toHaveBeenCalled();
  });

  it("allows authenticated admin-key requests", async () => {
    mocks.authenticate.mockResolvedValueOnce(true);
    expect(
      (await GET(request(), { params: Promise.resolve({ userId: "u1" }) }))
        .status,
    ).toBe(200);
  });

  it("returns not found when the user has no Dodo customer", async () => {
    mocks.getCustomerId.mockResolvedValueOnce(null);
    expect(
      (await GET(request(), { params: Promise.resolve({ userId: "u1" }) }))
        .status,
    ).toBe(404);
  });

  it("injects the owned customer ID and preserves safe adapter options", async () => {
    const response = await GET(
      request("?customer_id=cus_attacker&send_email=true"),
      {
        params: Promise.resolve({ userId: "u1" }),
      },
    );
    expect(response.status).toBe(200);
    const adapterRequest = mocks.portalHandler.mock.calls[0][0] as NextRequest;
    expect(adapterRequest.nextUrl.searchParams.get("customer_id")).toBe(
      "cus_owned",
    );
    expect(adapterRequest.nextUrl.searchParams.get("send_email")).toBe("true");
    expect(mocks.portalConfig.environment).toMatch(/^(test|live)_mode$/);
  });
});
