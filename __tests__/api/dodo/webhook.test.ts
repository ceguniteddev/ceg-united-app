/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({
  adapterHandler: vi.fn(),
  adapterConfig: undefined as any,
  payment: vi.fn(),
  subscription: vi.fn(),
  txGet: vi.fn(),
  txCreate: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/dodo-nextjs", () => ({
  Webhooks: vi.fn((config: any) => {
    mocks.adapterConfig = config;
    return mocks.adapterHandler;
  }),
}));
vi.mock("@/service/dodo", () => ({
  recordPaymentSucceeded: mocks.payment,
  recordSubscriptionLifecycle: mocks.subscription,
}));
vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: () => ({
    runTransaction: (fn: any) =>
      fn({ get: mocks.txGet, create: mocks.txCreate }),
    collection: () => ({
      doc: () => ({ set: mocks.set, delete: mocks.remove }),
    }),
  }),
}));

import {
  POST,
  claimWebhook,
  handleDodoPayload,
} from "@/app/api/payments/dodo/route";

describe("Dodo adapter webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.txGet.mockResolvedValue({ exists: false });
    mocks.set.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
  });

  it("mounts and delegates to the official Next.js adapter", async () => {
    const response = new Response("ok");
    mocks.adapterHandler.mockResolvedValueOnce(response);
    const request = new Request("http://localhost/api/payments/dodo", {
      method: "POST",
    }) as any;
    await expect(POST(request)).resolves.toBe(response);
    expect(mocks.adapterConfig.onPayload).toBe(handleDodoPayload);
  });

  it("claims new events and rejects duplicate claims", async () => {
    await expect(claimWebhook("new")).resolves.toBe(true);
    expect(mocks.txCreate).toHaveBeenCalled();
    mocks.txGet.mockResolvedValueOnce({ exists: true });
    await expect(claimWebhook("old")).resolves.toBe(false);
  });

  it("handles payment and subscription payloads with stable event keys", async () => {
    await handleDodoPayload({
      type: "payment.succeeded",
      data: { payment_id: "pay_1" },
    });
    expect(mocks.payment).toHaveBeenCalledWith({
      payment: { payment_id: "pay_1" },
    });
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ type: "payment.succeeded" }),
      { merge: true },
    );

    await handleDodoPayload({
      type: "subscription.active",
      data: { subscription_id: "sub_1" },
    });
    expect(mocks.subscription).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription: { subscription_id: "sub_1" },
        eventType: "subscription.active",
      }),
    );

    for (const type of [
      "subscription.renewed",
      "subscription.on_hold",
      "subscription.plan_changed",
      "subscription.cancelled",
      "subscription.failed",
      "subscription.expired",
    ]) {
      await handleDodoPayload({
        type,
        timestamp: "2026-01-01T00:00:00.000Z",
        data: { subscription_id: `sub_${type}` },
      });
    }
    expect(mocks.subscription).toHaveBeenCalledTimes(7);
  });

  it("ignores unrelated and duplicate payloads", async () => {
    await handleDodoPayload({ type: "refund.succeeded", data: {} });
    expect(mocks.txGet).not.toHaveBeenCalled();

    mocks.txGet.mockResolvedValueOnce({ exists: true });
    await handleDodoPayload({
      type: "payment.succeeded",
      data: { payment_id: "duplicate" },
    });
    expect(mocks.payment).not.toHaveBeenCalled();
  });

  it("releases failed event claims and rethrows for adapter retries", async () => {
    mocks.payment.mockRejectedValueOnce(new Error("handler failed"));
    await expect(
      handleDodoPayload({
        type: "payment.succeeded",
        data: { payment_id: "failed" },
      }),
    ).rejects.toThrow("handler failed");
    expect(mocks.remove).toHaveBeenCalled();

    mocks.payment.mockRejectedValueOnce(new Error("handler failed again"));
    mocks.remove.mockRejectedValueOnce(new Error("cleanup failed"));
    await expect(
      handleDodoPayload({
        type: "payment.succeeded",
        data: { payment_id: "failed-cleanup" },
      }),
    ).rejects.toThrow("handler failed again");
  });
});
