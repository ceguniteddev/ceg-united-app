import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
}));

vi.mock("@/service/apply-funding", () => ({
  getApplyFunding: vi.fn(),
  getApplyFundingByReferenceNumber: vi.fn(),
}));

import { GET as getFundingApplications } from "@/app/api/user/[userId]/funding-application/route";
import {
  getApplyFunding,
  getApplyFundingByReferenceNumber,
} from "@/service/apply-funding";
import AppError from "@/error/AppError";

describe("GET /api/user/[userId]/funding-application", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when userId is missing", async () => {
    const req = new NextRequest(
      "http://localhost/api/user//funding-application",
    );
    const res = await getFundingApplications(req, {
      params: Promise.resolve({ userId: "" }),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toEqual(["Missing User ID"]);
  });

  it("should return a list of funding applications for a valid user", async () => {
    const mockData = [{ id: "app1", userId: "u1" }];
    (getApplyFunding as any).mockResolvedValue(mockData);

    const req = new NextRequest(
      "http://localhost/api/user/u1/funding-application",
    );
    const res = await getFundingApplications(req, {
      params: Promise.resolve({ userId: "u1" }),
    } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockData);
  });

  it("should handle AppError appropriately", async () => {
    (getApplyFunding as any).mockRejectedValue(new AppError("User not found"));

    const req = new NextRequest(
      "http://localhost/api/user/u1/funding-application",
    );
    const res = await getFundingApplications(req, {
      params: Promise.resolve({ userId: "u1" }),
    } as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toEqual(["User not found"]);
  });

  it("should handle unexpected errors appropriately", async () => {
    (getApplyFunding as any).mockRejectedValue(new Error("Unexpected"));

    const req = new NextRequest(
      "http://localhost/api/user/u1/funding-application",
    );
    const res = await getFundingApplications(req, {
      params: Promise.resolve({ userId: "u1" }),
    } as any);
    expect(res.status).toBe(500);
  });
});
