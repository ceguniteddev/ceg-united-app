/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  charge: vi.fn(),
  getUser: vi.fn(),
  getFees: vi.fn(),
  activate: vi.fn(),
  sendEmail: vi.fn(),
  add: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  runTransaction: vi.fn(),
  txGet: vi.fn(),
  txSet: vi.fn(),
  txUpdate: vi.fn(),
}));

vi.mock("@/lib/dodo-sdk", () => ({
  dodoClient: {
    checkoutSessions: { create: mocks.create },
    subscriptions: { charge: mocks.charge },
  },
}));
vi.mock("@/service/user", () => ({ getUserById: mocks.getUser }));
vi.mock("@/service/fee-settings", () => ({ getFeeSettings: mocks.getFees }));
vi.mock("@/service/membership", () => ({
  activateUserMembership: mocks.activate,
}));
vi.mock("@/service/trigger-email", () => ({
  sendTriggerEmail: mocks.sendEmail,
}));
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));

let queryResult: any = { empty: true, docs: [] };
let paymentDocs: any[] = [];
const collection = vi.fn((name: string) => {
  const query: any = {
    __query: true,
    where: vi.fn(() => query),
    limit: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    get: vi.fn(async () =>
      name === "user-dodo-payments"
        ? { empty: paymentDocs.length === 0, docs: paymentDocs }
        : queryResult,
    ),
    add: mocks.add,
    doc: vi.fn((id?: string) => ({
      id: id || "generated",
      __doc: true,
      set: mocks.set,
      update: mocks.update,
      get: mocks.get,
    })),
  };
  return query;
});

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: () => ({
    collection,
    runTransaction: mocks.runTransaction,
  }),
}));

import {
  chargeMembership,
  createAddonCheckoutConfig,
  createCRSReportCheckoutConfig,
  createDodoCheckoutConfig,
  createMembershipCheckoutConfig,
  createPsfInvoiceCheckoutConfig,
  createWalletCheckoutConfig,
  getDodoCheckoutDetailByCheckoutId,
  getDodoCustomerIdByUserId,
  getDodoPayments,
  mapDodoPaymentToUser,
  recordPaymentSucceeded,
  recordSubscriptionActive,
  sendPaymentLink,
  unmapDodoPayment,
} from "@/service/dodo";

const user = {
  email: "person@example.com",
  firstName: "Test",
  lastName: "User",
};
const payment = (overrides: any = {}) =>
  ({
    payment_id: "pay_1",
    checkout_session_id: "cks_1",
    total_amount: 2500,
    metadata: { userId: "u1", paymentKey: "Other" },
    created_at: "2025-01-01",
    ...overrides,
  }) as any;

describe("Dodo payment service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResult = { empty: true, docs: [] };
    paymentDocs = [];
    Object.assign(process.env, {
      NEXT_PUBLIC_APP_URL: "https://app.test",
      DODO_PRODUCT_BUSINESS_SERVICES_ID: "p_business_services",
      DODO_PRODUCT_TRADELINE_ID: "p_tradeline",
      DODO_PRODUCT_CRS_REPORT_ID: "p_crs",
      DODO_PRODUCT_WALLET_ID: "p_wallet",
      DODO_PRODUCT_PSF_ID: "p_psf",
      DODO_PRODUCT_MEMBERSHIP_STARTER_ID: "p_starter",
      DODO_PRODUCT_MEMBERSHIP_PRO_ID: "p_pro",
      DODO_PRODUCT_MEMBERSHIP_EXECUTIVE_ID: "p_exec",
      DODO_PRODUCT_CREDIT_MODULE_PRO_ID: "p_addon",
    });
    mocks.getUser.mockResolvedValue(user);
    mocks.getFees.mockResolvedValue({
      tierStarterPrice: 1000,
      tierProPrice: 2000,
      tierExecutivePrice: 3000,
      creditModuleProAddonPrice: 400,
    });
    mocks.create.mockResolvedValue({
      session_id: "cks_1",
      checkout_url: "https://test.dodopayments.com/checkout/cks_1",
    });
    mocks.runTransaction.mockImplementation(async (fn) =>
      fn({
        get: mocks.txGet,
        set: mocks.txSet,
        update: mocks.txUpdate,
      }),
    );
  });

  it("reuses a cached checkout", async () => {
    queryResult = {
      empty: false,
      docs: [{ data: () => ({ checkoutId: "old", url: "https://old" }) }],
    };
    await expect(
      createDodoCheckoutConfig({ userId: "u1", paymentKey: "AuditFull" }),
    ).resolves.toEqual({ checkoutId: "old", url: "https://old" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each([
    ["AuditFull", "p_business_services", 200000],
    ["IntelligenceFull", "p_business_services", 500000],
    ["AcceleratorFull", "p_business_services", 1500000],
    ["AuditDownPayment", "p_business_services", 75000],
    ["IntelligenceDownPayment", "p_business_services", 100000],
    ["AcceleratorDownPayment", "p_business_services", 500000],
    ["TradelinePurchase", "p_tradeline", 12345],
  ] as const)(
    "creates %s checkout",
    async (paymentKey, productId, expectedAmount) => {
      const result = await createDodoCheckoutConfig({
        userId: "u1",
        paymentKey,
        ...(paymentKey === "TradelinePurchase" ? { customAmount: 12345 } : {}),
      });
      expect(result.checkoutId).toBe("cks_1");
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          product_cart: [
            expect.objectContaining({
              product_id: productId,
              amount: expectedAmount,
            }),
          ],
        }),
      );
      expect(mocks.add).toHaveBeenCalled();
    },
  );

  it("rejects missing users, products, and incomplete sessions", async () => {
    mocks.getUser.mockResolvedValueOnce(null);
    await expect(
      createDodoCheckoutConfig({
        userId: "x",
        paymentKey: "TradelinePurchase",
        customAmount: 1,
      }),
    ).rejects.toThrow("User not found");
    delete process.env.DODO_PRODUCT_WALLET_ID;
    await expect(
      createWalletCheckoutConfig({ userId: "u1", amount: 1 }),
    ).rejects.toThrow("Missing Dodo product ID");
    process.env.DODO_PRODUCT_WALLET_ID = "p_wallet";
    mocks.create.mockResolvedValueOnce({ session_id: "cks" });
    await expect(
      createWalletCheckoutConfig({ userId: "u1", amount: 1 }),
    ).rejects.toThrow("complete checkout session");
    mocks.create.mockResolvedValueOnce({ checkout_url: "https://checkout" });
    await expect(
      createWalletCheckoutConfig({ userId: "u1", amount: 1 }),
    ).rejects.toThrow("complete checkout session");
    await expect(
      createDodoCheckoutConfig({
        userId: "u1",
        paymentKey: "CreditReportFee",
      }),
    ).rejects.toThrow("Missing Dodo amount");
    await expect(
      createDodoCheckoutConfig({
        userId: "u1",
        paymentKey: "CreditReportFee",
        customAmount: 500,
      }),
    ).resolves.toEqual({
      checkoutId: "cks_1",
      url: "https://test.dodopayments.com/checkout/cks_1",
    });
    await expect(
      createDodoCheckoutConfig({
        userId: "u1",
        paymentKey: "WalletTopUp",
        customAmount: 2500,
      }),
    ).resolves.toEqual(expect.objectContaining({ checkoutId: "cks_1" }));
    await expect(
      createDodoCheckoutConfig({
        userId: "u1",
        paymentKey: "UnknownPlan" as any,
        customAmount: 100,
      }),
    ).rejects.toThrow("Missing Dodo product ID");
    delete process.env.DODO_PRODUCT_BUSINESS_SERVICES_ID;
    await expect(
      createDodoCheckoutConfig({ userId: "u1", paymentKey: "AuditFull" }),
    ).rejects.toThrow("Missing Dodo product ID for AuditFull");
    process.env.DODO_PRODUCT_BUSINESS_SERVICES_ID = "p_business_services";
  });

  it("uses configured amounts, fallback URLs, and refreshes partial cache entries", async () => {
    process.env.DODO_AUDIT_FULL_AMOUNT = "123";
    delete process.env.NEXT_PUBLIC_APP_URL;
    queryResult = {
      empty: false,
      docs: [{ data: () => ({ checkoutId: "partial" }) }],
    };
    await createDodoCheckoutConfig({ userId: "u1", paymentKey: "AuditFull" });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        product_cart: [expect.objectContaining({ amount: 123 })],
        return_url: "http://localhost:3000/checkout/success",
      }),
    );
    delete process.env.DODO_AUDIT_FULL_AMOUNT;
  });

  it.each([
    ["tier_starter", "p_starter", 140000],
    ["tier_pro", "p_pro", 240000],
    ["tier_executive", "p_exec", 340000],
  ] as const)(
    "creates dynamic %s membership",
    async (planId, productId, price) => {
      await createMembershipCheckoutConfig({
        userId: "u1",
        planId,
        selectedAddonIds: ["credit_module_pro"],
        isAddon: true,
      });
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          product_cart: [expect.objectContaining({ product_id: productId })],
          subscription_data: {
            on_demand: expect.objectContaining({ product_price: price }),
          },
        }),
      );
    },
  );

  it("uses membership defaults, no-addon pricing, and addon fallback pricing", async () => {
    await createMembershipCheckoutConfig({
      userId: "u1",
      planId: "tier_starter",
    });
    expect(mocks.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        subscription_data: {
          on_demand: expect.objectContaining({ product_price: 100000 }),
        },
      }),
    );
    mocks.getFees.mockResolvedValueOnce({
      tierStarterPrice: 1000,
      tierProPrice: 2000,
      tierExecutivePrice: 3000,
      creditModuleProAddonPrice: undefined,
    });
    await createMembershipCheckoutConfig({
      userId: "u1",
      planId: "tier_starter",
      selectedAddonIds: ["credit_module_pro"],
    });
    expect(mocks.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        subscription_data: {
          on_demand: expect.objectContaining({ product_price: 119700 }),
        },
      }),
    );
  });

  it("creates addon, CRS, wallet, and PSF sessions and charges membership", async () => {
    await createAddonCheckoutConfig({
      userId: "u1",
      addonId: "credit_module_pro",
    });
    await createCRSReportCheckoutConfig({
      userId: "u1",
      paymentKey: "CreditReportFee",
      feeAmount: 500,
      metadata: { reportType: "personal" },
    });
    await createWalletCheckoutConfig({ userId: "u1", amount: 2500 });
    await createPsfInvoiceCheckoutConfig({
      userId: "u1",
      invoiceId: "inv",
      feeAmount: 900,
    });
    await chargeMembership({
      subscriptionId: "sub",
      amountInCents: 777,
      metadata: { userId: "u1" },
    });
    expect(mocks.create).toHaveBeenCalledTimes(4);
    expect(mocks.charge).toHaveBeenCalledWith("sub", {
      product_price: 777,
      product_currency: "USD",
      metadata: { userId: "u1" },
    });
    await createCRSReportCheckoutConfig({
      userId: "u1",
      paymentKey: "BusinessCreditReportFee",
      feeAmount: 600,
    });
    await chargeMembership({ subscriptionId: "sub2", amountInCents: 888 });
  });

  it("gets checkout detail or null", async () => {
    await expect(getDodoCheckoutDetailByCheckoutId("none")).resolves.toBeNull();
    queryResult = {
      empty: false,
      docs: [{ id: "doc", data: () => ({ checkoutId: "cks" }) }],
    };
    await expect(getDodoCheckoutDetailByCheckoutId("cks")).resolves.toEqual({
      id: "doc",
      checkoutId: "cks",
    });
  });

  it("records wallet and PSF payments idempotently", async () => {
    mocks.txGet
      .mockResolvedValueOnce({ empty: false })
      .mockResolvedValueOnce({ empty: true })
      .mockResolvedValueOnce({ exists: false });
    await recordPaymentSucceeded({
      payment: payment({
        metadata: { userId: "u1", paymentKey: "WalletTopUp" },
      }),
    });
    await recordPaymentSucceeded({
      payment: payment({
        payment_id: "pay_2",
        metadata: { userId: "u1", paymentKey: "WalletTopUp" },
      }),
    });
    await recordPaymentSucceeded({
      payment: payment({
        payment_id: "pay_3",
        metadata: { userId: "u1", paymentKey: "PSF_INVOICE", invoiceId: "inv" },
      }),
    });
    expect(mocks.txSet).toHaveBeenCalled();
    expect(mocks.set).toHaveBeenCalled();
  });

  it("records an unmapped wallet payment without crediting a wallet", async () => {
    await recordPaymentSucceeded({
      payment: payment({ metadata: { paymentKey: "WalletTopUp" } }),
    });
    expect(mocks.runTransaction).not.toHaveBeenCalled();
    expect(mocks.set).toHaveBeenCalled();
  });

  it("uses checkout metadata fallbacks and handles absent payment metadata", async () => {
    queryResult = {
      empty: false,
      docs: [
        {
          id: "checkout",
          data: () => ({
            paymentKey: "PSF_INVOICE",
            metadata: { invoiceId: "from-checkout" },
          }),
        },
      ],
    };
    await recordPaymentSucceeded({
      payment: payment({ metadata: undefined }),
    });
    await recordPaymentSucceeded({
      payment: payment({
        payment_id: "no-checkout",
        checkout_session_id: null,
        metadata: { userId: "u1", paymentKey: "PSF_INVOICE" },
      }),
    });
    expect(mocks.set).toHaveBeenCalled();
  });

  it("updates an existing wallet", async () => {
    mocks.txGet
      .mockResolvedValueOnce({ empty: true })
      .mockResolvedValueOnce({ exists: true, data: () => ({ balance: 5 }) });
    await recordPaymentSucceeded({
      payment: payment({
        metadata: { userId: "u1", paymentKey: "WalletTopUp" },
      }),
    });
    expect(mocks.txUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ balance: 30 }),
    );
  });

  it("treats a missing existing wallet balance as zero", async () => {
    mocks.txGet
      .mockResolvedValueOnce({ empty: true })
      .mockResolvedValueOnce({ exists: true, data: () => ({}) });
    await recordPaymentSucceeded({
      payment: payment({
        metadata: { userId: "u1", paymentKey: "WalletTopUp" },
      }),
    });
    expect(mocks.txUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ balance: 25 }),
    );
  });

  it("activates subscriptions only when metadata is complete", async () => {
    await recordSubscriptionActive({ subscription: { metadata: {} } as any });
    await recordSubscriptionActive({
      subscription: { metadata: { userId: "u1" } } as any,
    });
    await recordSubscriptionActive({ subscription: {} as any });
    expect(mocks.activate).not.toHaveBeenCalled();
    await recordSubscriptionActive({
      subscription: {
        metadata: { userId: "u1", planId: "tier_pro" },
        recurring_pre_tax_amount: 2000,
        subscription_id: "sub",
        product_id: "p_pro",
      } as any,
    });
    expect(mocks.activate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 20 }),
    );
  });

  it("lists, maps, and unmaps payments", async () => {
    paymentDocs = [
      { id: "d1", data: () => ({ userId: "u1", payment_id: "p1" }) },
      { id: "d2", data: () => ({ userId: null, payment_id: "p2" }) },
    ];
    mocks.getUser.mockResolvedValueOnce(user);
    const list = await getDodoPayments();
    expect(list).toHaveLength(2);
    paymentDocs = [
      { id: "d3", data: () => ({ userId: "broken", payment_id: "p3" }) },
    ];
    mocks.getUser.mockRejectedValueOnce(new Error("lookup"));
    await expect(getDodoPayments()).resolves.toHaveLength(1);
    await expect(
      mapDodoPaymentToUser({ docId: "d2", userId: "u1" }),
    ).resolves.toEqual({ success: true });
    await expect(unmapDodoPayment({ docId: "d2" })).resolves.toEqual({
      success: true,
    });
    mocks.getUser.mockResolvedValueOnce(null);
    await expect(
      mapDodoPaymentToUser({ docId: "d2", userId: "bad" }),
    ).rejects.toThrow("User not found");
  });

  it("resolves a user's Dodo customer ID from payment history", async () => {
    paymentDocs = [
      { id: "without", data: () => ({ userId: "u1", customer: {} }) },
      {
        id: "with",
        data: () => ({
          userId: "u1",
          customer: { customer_id: "cus_1" },
        }),
      },
    ];
    await expect(getDodoCustomerIdByUserId("u1")).resolves.toBe("cus_1");
    paymentDocs = [];
    await expect(getDodoCustomerIdByUserId("none")).resolves.toBeNull();
  });

  it("sends payment links and propagates failures", async () => {
    await expect(sendPaymentLink({ userId: "u1" })).resolves.toEqual({
      success: true,
    });
    expect(mocks.sendEmail).toHaveBeenCalled();
    mocks.sendEmail.mockRejectedValueOnce(new Error("mail down"));
    await expect(sendPaymentLink({ userId: "u1" })).rejects.toThrow(
      "mail down",
    );
  });
});
