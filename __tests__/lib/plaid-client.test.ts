import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("plaid", () => ({
  // Use regular functions so they can be called with `new`
  Configuration: vi.fn().mockImplementation(function (this: any) {}),
  PlaidApi: vi.fn().mockImplementation(function (this: any) {
    return {};
  }),
  PlaidEnvironments: { sandbox: "https://sandbox.plaid.com" },
}));

describe("plaid client", () => {
  describe("plaidClient", () => {
    it("is defined after module load", async () => {
      const { plaidClient } = await import("@/lib/plaid");
      expect(plaidClient).toBeDefined();
    });
  });

  describe("isPlaidProductionReady", () => {
    afterEach(() => {
      delete process.env.IS_PLAID_PRODUCTION_READY;
    });

    it("returns false when IS_PLAID_PRODUCTION_READY is not set", async () => {
      delete process.env.IS_PLAID_PRODUCTION_READY;
      const { isPlaidProductionReady } = await import("@/lib/plaid");
      expect(isPlaidProductionReady()).toBe(false);
    });

    it("returns false when IS_PLAID_PRODUCTION_READY is set to 'false'", async () => {
      process.env.IS_PLAID_PRODUCTION_READY = "false";
      const { isPlaidProductionReady } = await import("@/lib/plaid");
      expect(isPlaidProductionReady()).toBe(false);
    });

    it("returns true when IS_PLAID_PRODUCTION_READY is set to 'true'", async () => {
      process.env.IS_PLAID_PRODUCTION_READY = "true";
      const { isPlaidProductionReady } = await import("@/lib/plaid");
      expect(isPlaidProductionReady()).toBe(true);
    });
  });
});
