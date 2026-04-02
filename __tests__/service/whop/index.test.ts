import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Env vars must be set before the module loads its module-level constants ───
vi.hoisted(() => {
  process.env.WHOP_COMPANY_ID = "test-company";
  process.env.WHOP_PRODUCT_ID = "test-product";
  process.env.WHOP_TRADELINE_PRODUCT_ID = "test-tradeline-product";
});

// ── Mock objects ──────────────────────────────────────────────────────────────
const mockGet = vi.fn();
const mockAdd = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();

const mockCollectionRef: any = {
  add: mockAdd,
  doc: vi.fn(),
  where: mockWhere,
  limit: mockLimit,
  get: mockGet,
};

mockWhere.mockReturnValue(mockCollectionRef);
mockLimit.mockReturnValue(mockCollectionRef);

const mockDb: any = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  authenticationAdmin: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("@/lib/whop-sdk", () => ({
  whopSdk: { checkoutConfigurations: { create: vi.fn() } },
}));
vi.mock("@/service/user", () => ({ getUserById: vi.fn() }));
vi.mock("@/service/trigger-email", () => ({ sendTriggerEmail: vi.fn() }));
vi.mock("@/lib/utils", () => ({ currency: vi.fn((x: any) => `$${x}`) }));
vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    randomUUID: vi.fn(() => "mock-uuid"),
  };
});

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import { createWhopCheckoutConfig } from "@/service/whop";
import { getUserById } from "@/service/user";
import { whopSdk } from "@/lib/whop-sdk";

// ── Tests ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  mockWhere.mockReturnValue(mockCollectionRef);
  mockLimit.mockReturnValue(mockCollectionRef);
  mockDb.collection.mockReturnValue(mockCollectionRef);
});

describe("createWhopCheckoutConfig", () => {
  it("returns the existing checkout config when one already exists for the user", async () => {
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          data: () => ({
            checkoutId: "existing-checkout-id",
            url: "https://whop.com/checkout/existing-checkout-id",
          }),
        },
      ],
    });

    const result = await createWhopCheckoutConfig({
      userId: "u1",
      paymentKey: "AuditFull",
    });

    expect(result).toEqual({
      checkoutId: "existing-checkout-id",
      url: "https://whop.com/checkout/existing-checkout-id",
    });
    // Should not attempt to create a new checkout
    expect(whopSdk.checkoutConfigurations.create).not.toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("throws an error when the user is not found", async () => {
    mockGet.mockResolvedValueOnce({ empty: true }); // no existing checkout
    (getUserById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    await expect(
      createWhopCheckoutConfig({ userId: "u1", paymentKey: "AuditFull" }),
    ).rejects.toThrow("User not found");
  });

  it("creates a new checkout config and saves it to Firestore", async () => {
    mockGet.mockResolvedValueOnce({ empty: true }); // no existing checkout
    (getUserById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      email: "client@test.com",
      firstName: "Jane",
      lastName: "Doe",
    });
    (
      whopSdk.checkoutConfigurations.create as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      id: "checkout-abc",
      purchase_url: "https://whop.com/checkout/checkout-abc",
    });
    mockAdd.mockResolvedValueOnce(undefined);

    const result = await createWhopCheckoutConfig({
      userId: "u1",
      paymentKey: "AuditFull",
    });

    expect(result).toEqual({
      checkoutId: "checkout-abc",
      url: "https://whop.com/checkout/checkout-abc",
    });
    expect(whopSdk.checkoutConfigurations.create).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: expect.objectContaining({
          company_id: "test-company",
          product_id: "test-product",
          plan_type: "one_time",
          currency: "usd",
        }),
        metadata: expect.objectContaining({ userId: "u1" }),
      }),
    );
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        checkoutId: "checkout-abc",
        paymentKey: "AuditFull",
        status: "created",
      }),
    );
  });

  it("uses the tradeline product ID for Tradeline payment keys", async () => {
    mockGet.mockResolvedValueOnce({ empty: true });
    (getUserById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      email: "client@test.com",
      firstName: "Jane",
      lastName: "Doe",
    });
    (
      whopSdk.checkoutConfigurations.create as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      id: "checkout-tradeline",
      purchase_url: "https://whop.com/checkout/checkout-tradeline",
    });
    mockAdd.mockResolvedValueOnce(undefined);

    await createWhopCheckoutConfig({
      userId: "u1",
      paymentKey: "Tradeline" as any,
    });

    expect(whopSdk.checkoutConfigurations.create).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: expect.objectContaining({ product_id: "test-tradeline-product" }),
      }),
    );
  });
});
