/// <reference types="vitest/globals" />

const service = vi.hoisted(() => ({
  getDodoPayments: vi.fn(),
  mapDodoPaymentToUser: vi.fn(),
  unmapDodoPayment: vi.fn(),
  getDodoCheckoutDetailByCheckoutId: vi.fn(),
  createDodoCheckoutConfig: vi.fn(),
}));
vi.mock("@/service/dodo", () => service);
vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
}));

import { GET as list } from "@/app/api/payments/dodo/list/route";
import { POST as map } from "@/app/api/payments/dodo/map/route";
import { POST as unmap } from "@/app/api/payments/dodo/unmap/route";
import { GET as payments } from "@/app/api/dodo/payments/route";
import { GET as checkout } from "@/app/api/dodo/checkout/[checkoutId]/route";
import { POST as create } from "@/app/api/user/[userId]/dodo/route";

const request = (body: any) =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as any;

describe("Dodo API routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists payments from both endpoints and handles errors", async () => {
    service.getDodoPayments.mockResolvedValue([{ payment_id: "p" }]);
    expect(await (await list({} as any, {} as any)).json()).toEqual([
      { payment_id: "p" },
    ]);
    expect(await (await payments({} as any, {} as any)).json()).toEqual([
      { payment_id: "p" },
    ]);
    service.getDodoPayments.mockRejectedValueOnce(new Error("db"));
    expect((await list({} as any, {} as any)).status).toBe(500);
  });

  it("validates, maps, and handles mapping errors", async () => {
    expect((await map(request({}), {} as any)).status).toBe(400);
    expect((await map(request({ docId: "d" }), {} as any)).status).toBe(400);
    service.mapDodoPaymentToUser.mockResolvedValue({ success: true });
    expect(
      (await map(request({ docId: "d", userId: "u" }), {} as any)).status,
    ).toBe(200);
    service.mapDodoPaymentToUser.mockRejectedValueOnce(new Error("db"));
    expect(
      (await map(request({ docId: "d", userId: "u" }), {} as any)).status,
    ).toBe(500);
  });

  it("validates, unmaps, and handles unmapping errors", async () => {
    expect((await unmap(request({}), {} as any)).status).toBe(400);
    service.unmapDodoPayment.mockResolvedValue({ success: true });
    expect((await unmap(request({ docId: "d" }), {} as any)).status).toBe(200);
    service.unmapDodoPayment.mockRejectedValueOnce(new Error("db"));
    expect((await unmap(request({ docId: "d" }), {} as any)).status).toBe(500);
  });

  it("returns checkout details, not found, and missing-id responses", async () => {
    expect(
      (
        await checkout({} as any, {
          params: Promise.resolve({ checkoutId: "" }),
        })
      ).status,
    ).toBe(400);
    service.getDodoCheckoutDetailByCheckoutId.mockResolvedValueOnce(null);
    expect(
      (
        await checkout({} as any, {
          params: Promise.resolve({ checkoutId: "none" }),
        })
      ).status,
    ).toBe(404);
    service.getDodoCheckoutDetailByCheckoutId.mockResolvedValueOnce({
      checkoutId: "cks",
    });
    expect(
      (
        await checkout({} as any, {
          params: Promise.resolve({ checkoutId: "cks" }),
        })
      ).status,
    ).toBe(200);
  });

  it("validates and creates user checkouts", async () => {
    expect(
      (
        await create(request({ paymentKey: "AuditFull" }), {
          params: Promise.resolve({ userId: "" }),
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await create(request({ paymentKey: "invalid" }), {
          params: Promise.resolve({ userId: "u" }),
        })
      ).status,
    ).toBe(400);
    service.createDodoCheckoutConfig.mockResolvedValueOnce({
      checkoutId: "cks",
      url: "url",
    });
    expect(
      (
        await create(request({ paymentKey: "AuditFull", customAmount: 100 }), {
          params: Promise.resolve({ userId: "u" }),
        })
      ).status,
    ).toBe(200);
    service.createDodoCheckoutConfig.mockRejectedValueOnce(new Error("api"));
    expect(
      (
        await create(request({ paymentKey: "AuditFull" }), {
          params: Promise.resolve({ userId: "u" }),
        })
      ).status,
    ).toBe(500);
  });
});
