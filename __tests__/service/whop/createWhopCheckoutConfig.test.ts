import { describe, it, expect, vi, beforeEach } from "vitest";

// Set env vars before module-level consts are evaluated
vi.hoisted(() => {
  process.env.WHOP_COMPANY_ID = "test-company-id";
  process.env.WHOP_PRODUCT_ID = "test-product-id";
  process.env.WHOP_TRADELINE_PRODUCT_ID = "test-tradeline-product-id";
  process.env.WHOP_WALLET_PRODUCT_ID = "test-wallet-product-id";
});

// --- Firestore mocks (before vi.mock calls) ---
const mockGet = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockAdd = vi.fn();

const mockCollectionRef = {
  where: mockWhere,
  limit: mockLimit,
  get: mockGet,
  add: mockAdd,
};

mockWhere.mockReturnValue(mockCollectionRef);
mockLimit.mockReturnValue(mockCollectionRef);

const mockDb = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
};

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  authenticationAdmin: vi.fn(),
  storageAdmin: vi.fn(),
}));

// --- Whop SDK mock ---
const mockWhopCreate = vi.fn();
vi.mock("@/lib/whop-sdk", () => ({
  whopSdk: {
    checkoutConfigurations: {
      create: (...args: any[]) => mockWhopCreate(...args),
    },
  },
}));

// --- Other mocks ---
const mockGetUserById = vi.fn();
vi.mock("@/service/user", () => ({
  getUserById: (...args: any[]) => mockGetUserById(...args),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

vi.mock("@/constant/collection-name", () => ({
  WHOP_CHECKOUTS_COLLECTION: "whop-checkouts",
  PAYMENT_REQUESTS_COLLECTION: "payment-requests",
  USER_WHOP_PAYMENTS: "user-whop-payments",
}));

vi.mock("@/service/trigger-email", () => ({
  sendTriggerEmail: vi.fn(),
}));

vi.mock("@/schema/payments", () => ({
  PaymentPlan: {},
}));

vi.mock("@/schema/trigger-email", () => ({
  EmailJobs: {},
}));

vi.mock("@/lib/utils", () => ({
  currency: vi.fn(),
}));

import { createWhopCheckoutConfig } from "@/service/whop";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  firstName: "John",
  lastName: "Doe",
  paymentAmount: "15000",
};

describe("createWhopCheckoutConfig — tradeline cache bypass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
    mockDb.collection.mockReturnValue(mockCollectionRef);
    mockGetUserById.mockResolvedValue(mockUser);
    mockWhopCreate.mockResolvedValue({
      id: "new-checkout-id",
      purchase_url: "https://whop.com/checkout/new",
    });
    // Default: Firestore add succeeds
    mockAdd.mockResolvedValue({ id: "doc-id" });
  });

  it("skips existing checkout lookup for TradelinePurchase paymentKey", async () => {
    const result = await createWhopCheckoutConfig({
      userId: "user-1",
      paymentKey: "TradelinePurchase" as any,
      customAmount: 500,
    });

    // Firestore should NOT have been queried for existing checkout
    expect(mockWhere).not.toHaveBeenCalledWith(
      "paymentKey",
      "==",
      "TradelinePurchase",
    );
    expect(mockGet).not.toHaveBeenCalled();

    // Whop SDK should have been called to create a new checkout
    expect(mockWhopCreate).toHaveBeenCalledTimes(1);
    expect(mockWhopCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: expect.objectContaining({
          initial_price: 500,
          product_id: "test-tradeline-product-id",
        }),
      }),
    );

    expect(result).toEqual({
      checkoutId: "new-checkout-id",
      url: "https://whop.com/checkout/new",
    });
  });

  it("reuses existing checkout for non-tradeline paymentKey", async () => {
    // Simulate Firestore returning an existing checkout
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          data: () => ({
            checkoutId: "existing-checkout-id",
            url: "https://whop.com/checkout/existing",
          }),
        },
      ],
    });

    const result = await createWhopCheckoutConfig({
      userId: "user-1",
      paymentKey: "AuditFull" as any,
    });

    // Should have queried Firestore for existing checkout
    expect(mockWhere).toHaveBeenCalledWith("userId", "==", "user-1");
    expect(mockWhere).toHaveBeenCalledWith("paymentKey", "==", "AuditFull");
    expect(mockGet).toHaveBeenCalledTimes(1);

    // Should NOT create a new checkout via Whop SDK
    expect(mockWhopCreate).not.toHaveBeenCalled();

    expect(result).toEqual({
      checkoutId: "existing-checkout-id",
      url: "https://whop.com/checkout/existing",
    });
  });

  it("creates fresh checkout for TradelinePurchase even when previous checkout exists", async () => {
    // First call — amount 300
    mockWhopCreate.mockResolvedValueOnce({
      id: "checkout-1",
      purchase_url: "https://whop.com/checkout/1",
    });

    const result1 = await createWhopCheckoutConfig({
      userId: "user-1",
      paymentKey: "TradelinePurchase" as any,
      customAmount: 300,
    });

    expect(result1.checkoutId).toBe("checkout-1");

    // Second call — different amount 750
    mockWhopCreate.mockResolvedValueOnce({
      id: "checkout-2",
      purchase_url: "https://whop.com/checkout/2",
    });

    const result2 = await createWhopCheckoutConfig({
      userId: "user-1",
      paymentKey: "TradelinePurchase" as any,
      customAmount: 750,
    });

    expect(result2.checkoutId).toBe("checkout-2");

    // Both calls should have created new checkouts (no cache query)
    expect(mockWhopCreate).toHaveBeenCalledTimes(2);
    // Firestore .where().get() should never have been called for lookups
    // (only .add() for saving the new checkout docs)
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("uses customAmount as initial_price for tradeline checkout", async () => {
    await createWhopCheckoutConfig({
      userId: "user-1",
      paymentKey: "TradelinePurchase" as any,
      customAmount: 2000,
    });

    expect(mockWhopCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: expect.objectContaining({
          initial_price: 2000,
          company_id: "test-company-id",
          currency: "usd",
          plan_type: "one_time",
          product_id: "test-tradeline-product-id",
          visibility: "hidden",
        }),
        metadata: expect.objectContaining({
          userId: "user-1",
          email: "test@example.com",
          name: "John Doe",
        }),
      }),
    );
  });
});
