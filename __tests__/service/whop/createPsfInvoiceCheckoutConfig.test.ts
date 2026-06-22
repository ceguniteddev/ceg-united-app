import { describe, it, expect, vi, beforeEach } from "vitest";

// Set env vars before module-level consts are evaluated
vi.hoisted(() => {
  process.env.WHOP_COMPANY_ID = "test-company-id";
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

import { createPsfInvoiceCheckoutConfig } from "@/service/whop";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  firstName: "John",
  lastName: "Doe",
};

describe("createPsfInvoiceCheckoutConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserById.mockResolvedValue(mockUser);
    mockWhopCreate.mockResolvedValue({
      id: "psf-checkout-id",
      purchase_url: "https://whop.com/checkout/psf",
    });
    mockAdd.mockResolvedValue({ id: "doc-id" });
  });

  it("creates a checkout configuration on Whop and saves details in Firestore", async () => {
    const result = await createPsfInvoiceCheckoutConfig({
      userId: "user-1",
      invoiceId: "invoice-123",
      feeAmount: 250.5,
    });

    // Verify Whop SDK call
    expect(mockWhopCreate).toHaveBeenCalledTimes(1);
    expect(mockWhopCreate).toHaveBeenCalledWith({
      plan: {
        company_id: "test-company-id",
        currency: "usd",
        initial_price: 25050, // 250.5 * 100
        plan_type: "one_time",
        product_id: "test-wallet-product-id",
        visibility: "hidden",
        payment_method_configuration: {
          enabled: ["card", "apple_pay", "google_pay"],
          disabled: ["crypto", "splitit", "cashapp", "paypal"],
          include_platform_defaults: false,
        },
      },
      metadata: {
        userId: "user-1",
        email: "test@example.com",
        name: "John Doe",
        invoiceId: "invoice-123",
        paymentKey: "PSF_INVOICE",
        type: "PSF_INVOICE",
        planId: "PSF_INVOICE",
      },
    });

    // Verify Firestore save
    expect(mockDb.collection).toHaveBeenCalledWith("whop-checkouts");
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        checkoutId: "psf-checkout-id",
        url: "https://whop.com/checkout/psf",
        initialPrice: 25050,
        planType: "one_time",
        productId: "test-wallet-product-id",
        status: "created",
        paymentKey: "PSF_INVOICE",
        invoiceId: "invoice-123",
      }),
    );

    // Verify return structure
    expect(result).toEqual({
      checkoutId: "psf-checkout-id",
      url: "https://whop.com/checkout/psf",
    });
  });

  it("uses Custom PSF Product ID if set in environment", async () => {
    process.env.WHOP_PSF_PRODUCT_ID = "custom-psf-product-id";

    await createPsfInvoiceCheckoutConfig({
      userId: "user-1",
      invoiceId: "invoice-123",
      feeAmount: 100,
    });

    expect(mockWhopCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: expect.objectContaining({
          product_id: "custom-psf-product-id",
        }),
      }),
    );

    delete process.env.WHOP_PSF_PRODUCT_ID;
  });
});
