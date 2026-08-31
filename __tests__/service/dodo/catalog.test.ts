/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({ retrieve: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/dodo-sdk", () => ({
  dodoClient: { products: { retrieve: mocks.retrieve, update: mocks.update } },
}));

import { synchronizeDodoRecurringProductPrice } from "@/service/dodo/catalog";

describe("Dodo recurring catalog synchronization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates a recurring product to the app fee", async () => {
    mocks.retrieve.mockResolvedValue({
      price: {
        type: "recurring_price",
        price: 39692,
        currency: "USD",
        discount: 0,
        payment_frequency_count: 1,
        payment_frequency_interval: "Month",
        subscription_period_count: 1,
        subscription_period_interval: "Month",
        purchasing_power_parity: false,
        tax_inclusive: false,
      },
    });
    await expect(
      synchronizeDodoRecurringProductPrice("p_addon", 19700),
    ).resolves.toBe(true);
    expect(mocks.update).toHaveBeenCalledWith(
      "p_addon",
      expect.objectContaining({
        price: expect.objectContaining({ price: 19700 }),
      }),
    );
  });

  it("does not update an already synchronized product", async () => {
    mocks.retrieve.mockResolvedValue({
      price: { type: "recurring_price", price: 19700 },
    });
    await expect(
      synchronizeDodoRecurringProductPrice("p_addon", 19700),
    ).resolves.toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
