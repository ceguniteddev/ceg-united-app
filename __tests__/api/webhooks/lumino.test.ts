/// <reference types="vitest/globals" />

import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  validateLuminoWebhookAuth: vi.fn(),
  processLuminoZapierWebhook: vi.fn(),
}));

vi.mock("@/service/lumino", () => ({
  validateLuminoWebhookAuth: mocks.validateLuminoWebhookAuth,
  processLuminoZapierWebhook: mocks.processLuminoZapierWebhook,
}));

import { POST } from "@/app/api/webhooks/lumino/route";

const makeRequest = (body: any, headers: Record<string, string> = {}) => {
  return new NextRequest("http://localhost:3000/api/webhooks/lumino", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
};

describe("POST /api/webhooks/lumino", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 Unauthorized if Bearer authentication fails", async () => {
    mocks.validateLuminoWebhookAuth.mockResolvedValueOnce(false);

    const req = makeRequest({ courseId: "c1" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 Bad Request on invalid JSON", async () => {
    mocks.validateLuminoWebhookAuth.mockResolvedValueOnce(true);

    const req = makeRequest("invalid json", {
      Authorization: "Bearer secret",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain("Invalid JSON");
  });

  it("returns 400 Bad Request on missing required fields in payload", async () => {
    mocks.validateLuminoWebhookAuth.mockResolvedValueOnce(true);

    const req = makeRequest(
      {
        customerEmail: "invalid-email",
        // missing courseId, paymentId, paymentStatus
      },
      {
        Authorization: "Bearer secret",
      },
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Bad Request");
  });

  it("returns 200 on successful processing with raw payload without courseId", async () => {
    mocks.validateLuminoWebhookAuth.mockResolvedValueOnce(true);
    mocks.processLuminoZapierWebhook.mockResolvedValueOnce({
      success: true,
      duplicate: false,
      enrolled: true,
      userId: "u1",
      enrolledCourseIds: ["c1"],
      paymentId: "p1",
      status: "succeeded",
      message: "Enrolled",
    });

    // Exactly the fields sent by Lumino/Zapier
    const req = makeRequest(
      {
        customerEmail: "Luxmiamidrive@gmail.com",
        customerName: "Apple Pay PlaceHolder",
        paymentAmount: "$1,139.84",
        paymentCreatedAt: "2026-08-07T20:07:09.870Z",
        paymentCurrency: "USD",
        paymentId: "4277a5b8-4f7f-4be5-a13e-7820e504867e",
        paymentMethod: "visa_applepay",
        paymentStatus: "Succeeded",
      },
      {
        Authorization: "Bearer secret",
      },
    );
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.enrolled).toBe(true);
  });

  it("returns 404 when user or course cannot be found", async () => {
    mocks.validateLuminoWebhookAuth.mockResolvedValueOnce(true);
    const notFoundError: any = new Error(
      "Client not found for email: user@example.com",
    );
    notFoundError.statusCode = 404;
    mocks.processLuminoZapierWebhook.mockRejectedValueOnce(notFoundError);

    const req = makeRequest(
      {
        courseId: "c1",
        customerEmail: "user@example.com",
        paymentId: "p1",
        paymentStatus: "Succeeded",
      },
      {
        Authorization: "Bearer secret",
      },
    );
    const res = await POST(req);

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toContain("Client not found");
  });

  it("extracts courseId from URL query parameter if missing from body", async () => {
    mocks.validateLuminoWebhookAuth.mockResolvedValueOnce(true);
    mocks.processLuminoZapierWebhook.mockResolvedValueOnce({
      success: true,
      duplicate: false,
      enrolled: true,
      userId: "u1",
      courseId: "c_query_123",
      paymentId: "p1",
      status: "succeeded",
      message: "Enrolled",
    });

    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/lumino?courseId=c_query_123",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: "Bearer secret",
        },
        body: JSON.stringify({
          customerEmail: "user@example.com",
          paymentId: "p1",
          paymentStatus: "Succeeded",
        }),
      },
    );
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mocks.processLuminoZapierWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: "c_query_123",
        customerEmail: "user@example.com",
      }),
    );
  });
});
