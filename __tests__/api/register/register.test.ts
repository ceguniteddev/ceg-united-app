/**
 * Tests for POST /api/register
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/captcha/captcha", () => ({
  createEnterpriseAssessment: vi.fn(),
}));

vi.mock("@/service/user", () => ({
  registerUser: vi.fn(),
  verifyClientInvitationToken: vi.fn(),
  consumeClientInvitationToken: vi.fn(),
  getUserById: vi.fn(),
}));

import { POST } from "@/app/api/register/route";
import {
  registerUser,
  verifyClientInvitationToken,
  consumeClientInvitationToken,
} from "@/service/user";
import { createEnterpriseAssessment } from "@/lib/captcha/captcha";
import AppError from "@/error/AppError";

const step1Data = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  birthdate: "1990-01-15",
  gender: "Female",
  phoneNumber: "555-1234",
  ssn: "234-56-7890",
};
const step2Data = {
  consentConfirmTerms: true,
  consentConfirmPrivacy: true,
};

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createEnterpriseAssessment as any).mockResolvedValue(undefined);
  });

  it("should return 400 when token is missing", async () => {
    const res = await POST(makeRequest({ step1Data, step2Data }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  it("should return 400 when both step1Data and values are missing", async () => {
    const res = await POST(makeRequest({ token: "recaptcha-token" }));
    expect(res.status).toBe(400);
  });

  it("should register user with step1Data + step2Data and return 200", async () => {
    (registerUser as any).mockResolvedValue(undefined);
    const res = await POST(
      makeRequest({ token: "recaptcha-token", step1Data, step2Data }),
    );
    expect(registerUser).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("ok");
  });

  it("should register user with legacy values format and return 200", async () => {
    (registerUser as any).mockResolvedValue(undefined);
    const res = await POST(
      makeRequest({ token: "recaptcha-token", values: step1Data }),
    );
    expect(registerUser).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });

  it("should call verifyClientInvitationToken when invitationToken is provided", async () => {
    (verifyClientInvitationToken as any).mockResolvedValue({
      id: "inv-1",
      brokerId: "b1",
      brokerName: "Test Broker",
    });
    (consumeClientInvitationToken as any).mockResolvedValue(undefined);
    (registerUser as any).mockResolvedValue(undefined);

    const res = await POST(
      makeRequest({
        token: "recaptcha-token",
        step1Data,
        step2Data,
        invitationToken: "invite-abc",
        invitationType: "client",
      }),
    );
    expect(verifyClientInvitationToken).toHaveBeenCalledWith("invite-abc");
    expect(consumeClientInvitationToken).toHaveBeenCalledWith("inv-1");
    expect(res.status).toBe(200);
  });

  it("should return 400 when invitation token is invalid", async () => {
    (verifyClientInvitationToken as any).mockRejectedValue(
      new Error("Token expired"),
    );

    const res = await POST(
      makeRequest({
        token: "recaptcha-token",
        step1Data,
        step2Data,
        invitationToken: "bad-invite",
        invitationType: "client",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("should return 400 when registerUser throws AppError", async () => {
    (registerUser as any).mockRejectedValue(
      new AppError("Email already in use"),
    );
    const res = await POST(
      makeRequest({ token: "recaptcha-token", step1Data, step2Data }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toContain("Email already in use");
  });

  it("should return 500 on unexpected error", async () => {
    (registerUser as any).mockRejectedValue(new Error("Unknown error"));
    const res = await POST(
      makeRequest({ token: "recaptcha-token", step1Data, step2Data }),
    );
    expect(res.status).toBe(500);
  });
});
