/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  charge: vi.fn(),
  getUser: vi.fn(),
  getFees: vi.fn(),
  activate: vi.fn(),
  synchronize: vi.fn(),
  activateAddon: vi.fn(),
  sendEmail: vi.fn(),
  add: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  runTransaction: vi.fn(),
  txGet: vi.fn(),
  txSet: vi.fn(),
  txUpdate: vi.fn(),
  docCreate: vi.fn(),
}));

vi.mock("@/lib/dodo-sdk", () => ({
  dodoClient: {
    checkoutSessions: { create: mocks.create },
    subscriptions: { charge: mocks.charge, retrieve: vi.fn() },
  },
}));
vi.mock("@/service/user", () => ({ getUserById: mocks.getUser }));
vi.mock("@/service/fee-settings", () => ({ getFeeSettings: mocks.getFees }));
vi.mock("@/service/membership", () => ({
  activateUserMembership: mocks.activate,
  synchronizeDodoMembership: mocks.synchronize,
}));
vi.mock("@/lib/membership-cache", () => ({
  default: { invalidate: vi.fn() },
}));
vi.mock("@/service/addons", () => ({
  activateUserAddon: mocks.activateAddon,
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
      create: mocks.docCreate,
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
  createCourseCheckoutConfig,
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
  recordSubscriptionLifecycle,
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
    delete process.env.DODO_PAYMENTS_RETURN_URL;
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
        return_url: "http://localhost:3000/client/home",
      }),
    );
    delete process.env.DODO_AUDIT_FULL_AMOUNT;
  });

  it("uses an explicit checkout return URL when provided", async () => {
    await createDodoCheckoutConfig({
      userId: "u1",
      paymentKey: "TradelinePurchase",
      customAmount: 12345,
      returnUrl: "https://app.test/client/my-credit",
    });

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        return_url: "https://app.test/client/my-credit",
      }),
    );
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
          return_url: "https://app.test/client/home?membershipCheckout=1",
          metadata: expect.objectContaining({
            userId: "u1",
            planId,
            membershipAmount: expect.any(String),
          }),
          product_cart: [
            expect.objectContaining({ product_id: productId, amount: price }),
          ],
        }),
      );
      expect(mocks.create.mock.calls.at(-1)?.[0]).not.toHaveProperty(
        "subscription_data",
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
        product_cart: [expect.objectContaining({ amount: 100000 })],
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
        product_cart: [expect.objectContaining({ amount: 119700 })],
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

  it("activates membership and bundled addons from a verified payment", async () => {
    queryResult = {
      empty: false,
      docs: [
        {
          id: "checkout",
          data: () => ({
            userId: "u1",
            productId: "p_pro",
            paymentKey: "tier_pro",
            metadata: {
              userId: "u1",
              planId: "tier_pro",
              membershipAmount: "2000",
              selectedAddonIds: '["credit_module_pro"]',
            },
          }),
        },
      ],
    };

    await recordPaymentSucceeded({
      payment: payment({ metadata: undefined, total_amount: 240000 }),
    });

    expect(mocks.activate).not.toHaveBeenCalled();
    expect(mocks.activateAddon).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        addonId: "credit_module_pro",
        amount: 400,
        checkoutId: "cks_1",
        receiptId: "pay_1",
        triggerCRSWorkflow: false,
      }),
    );

    // Fallback when metadata.selectedAddonIds is undefined
    queryResult = {
      empty: false,
      docs: [
        {
          id: "checkout",
          data: () => ({
            userId: "u1",
            productId: "p_pro",
            paymentKey: "tier_pro",
            metadata: {
              userId: "u1",
              planId: "tier_pro",
            },
          }),
        },
      ],
    };
    await recordPaymentSucceeded({
      payment: payment({ metadata: undefined, total_amount: 200000 }),
    });

    // Fallback when creditModuleProAddonPrice is undefined and checkout_session_id is undefined
    mocks.getFees.mockResolvedValueOnce({
      creditModuleProAddonPrice: undefined as any,
    });
    await recordPaymentSucceeded({
      payment: {
        ...payment({
          metadata: {
            userId: "u1",
            paymentKey: "tier_pro",
            selectedAddonIds: '["credit_module_pro"]',
          },
          total_amount: 240000,
        }),
        checkout_session_id: undefined,
      } as any,
    });
    expect(mocks.activateAddon).toHaveBeenLastCalledWith(
      expect.objectContaining({
        amount: 197,
        checkoutId: undefined,
      }),
    );
  });

  it("activates a standalone addon from a verified payment with amount fallback branches", async () => {
    queryResult = {
      empty: false,
      docs: [
        {
          id: "checkout",
          data: () => ({
            userId: "u1",
            productId: "p_addon",
            paymentKey: "credit_module_pro",
            metadata: {
              userId: "u1",
              paymentKey: "credit_module_pro",
              planId: "credit_module_pro",
              isAddon: "true",
            },
          }),
        },
      ],
    };

    // Case 1: metadata.addonAmount is present
    await recordPaymentSucceeded({
      payment: {
        ...payment({
          metadata: {
            userId: "u1",
            paymentKey: "credit_module_pro",
            addonAmount: "500",
          },
          total_amount: 40000,
        }),
        checkout_session_id: undefined,
      } as any,
    });
    expect(mocks.activateAddon).toHaveBeenLastCalledWith(
      expect.objectContaining({ amount: 500, checkoutId: undefined }),
    );

    // Case 2: falls back to fees.creditModuleProAddonPrice
    mocks.getFees.mockResolvedValueOnce({ creditModuleProAddonPrice: 250 });
    await recordPaymentSucceeded({
      payment: payment({ metadata: undefined, total_amount: 0 }),
    });
    expect(mocks.activateAddon).toHaveBeenLastCalledWith(
      expect.objectContaining({ amount: 250 }),
    );

    // Case 3: fees price is undefined/0, falls back to total_amount / 100
    mocks.getFees.mockResolvedValueOnce({
      creditModuleProAddonPrice: undefined as any,
    });
    await recordPaymentSucceeded({
      payment: payment({ metadata: undefined, total_amount: 30000 }),
    });
    expect(mocks.activateAddon).toHaveBeenLastCalledWith(
      expect.objectContaining({ amount: 300 }),
    );

    // Case 4: all zero/falsy, falls back to 197
    mocks.getFees.mockResolvedValueOnce({
      creditModuleProAddonPrice: 0 as any,
    });
    await recordPaymentSucceeded({
      payment: payment({ metadata: undefined, total_amount: 0 }),
    });
    expect(mocks.activateAddon).toHaveBeenLastCalledWith(
      expect.objectContaining({ amount: 197 }),
    );
  });

  it("activates addon subscription with fallback branches for planId and amount", async () => {
    // metadata.planId missing (falls back to "credit_module_pro") and falls back through price options
    mocks.getFees.mockResolvedValueOnce({
      creditModuleProAddonPrice: 0 as any,
    });
    await recordSubscriptionActive({
      subscription: {
        metadata: {
          userId: "u1",
          isAddon: "true",
        },
        recurring_pre_tax_amount: 15000,
        subscription_id: "sub_addon_fallback",
        product_id: "pdt_credit_module_pro",
      } as any,
    });
    expect(mocks.activateAddon).toHaveBeenLastCalledWith(
      expect.objectContaining({
        addonId: "credit_module_pro",
        amount: 150,
      }),
    );

    // all pricing undefined/0, falls back to 197
    mocks.getFees.mockResolvedValueOnce({
      creditModuleProAddonPrice: 0 as any,
    });
    await recordSubscriptionActive({
      subscription: {
        metadata: {
          userId: "u1",
          isAddon: "true",
        },
        recurring_pre_tax_amount: 0,
        subscription_id: "sub_addon_197",
        product_id: "pdt_credit_module_pro",
      } as any,
    });
    expect(mocks.activateAddon).toHaveBeenLastCalledWith(
      expect.objectContaining({
        addonId: "credit_module_pro",
        amount: 197,
      }),
    );
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
    expect(mocks.synchronize).not.toHaveBeenCalled();
    await recordSubscriptionActive({
      subscription: {
        metadata: { userId: "u1", planId: "tier_pro" },
        recurring_pre_tax_amount: 2000,
        subscription_id: "sub",
        product_id: "p_pro",
      } as any,
    });
    expect(mocks.synchronize).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 20 }),
    );
  });

  it("activates addon subscription when metadata isAddon or addon planId is provided", async () => {
    mocks.getFees.mockResolvedValueOnce({ creditModuleProAddonPrice: 197 });
    await recordSubscriptionActive({
      subscription: {
        metadata: {
          userId: "u1",
          planId: "credit_module_pro",
          isAddon: "true",
        },
        recurring_pre_tax_amount: 19700,
        subscription_id: "sub_addon_1",
        product_id: "pdt_credit_module_pro",
      } as any,
    });
    expect(mocks.activateAddon).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        addonId: "credit_module_pro",
        amount: 197,
        checkoutId: "sub_addon_1",
        planId: "pdt_credit_module_pro",
        receiptId: "sub_addon_1",
        triggerCRSWorkflow: true,
      }),
    );
    expect(mocks.synchronize).not.toHaveBeenCalled();
  });

  it("handles missing userId when activating addon subscription and handles invalid selectedAddonIds JSON", async () => {
    await recordSubscriptionActive({
      subscription: {
        metadata: {
          planId: "credit_module_pro",
          isAddon: "true",
        },
        subscription_id: "sub_addon_no_user",
      } as any,
    });
    expect(mocks.activateAddon).not.toHaveBeenCalled();

    queryResult = {
      empty: false,
      docs: [
        {
          id: "checkout",
          data: () => ({
            userId: "u1",
            productId: "p_pro",
            paymentKey: "tier_pro",
            metadata: {
              userId: "u1",
              planId: "tier_pro",
              selectedAddonIds: "invalid-json",
            },
          }),
        },
      ],
    };

    await recordPaymentSucceeded({
      payment: payment({ metadata: undefined, total_amount: 200000 }),
    });
    expect(mocks.activate).not.toHaveBeenCalled();
  });

  it("recovers subscription membership context from product and payments", async () => {
    paymentDocs = [
      {
        id: "payment",
        data: () => ({ userId: "u1", created_at: "2026-08-20" }),
      },
    ];

    await recordSubscriptionActive({
      subscription: {
        metadata: {},
        customer: { customer_id: "cus_1" },
        recurring_pre_tax_amount: 200000,
        subscription_id: "sub_1",
        product_id: "p_pro",
      } as any,
    });

    expect(mocks.synchronize).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        tier: "tier_pro",
        amount: 2000,
        subscriptionId: "sub_1",
      }),
    );
  });

  it("sends one deterministic access-ended notice for a terminal subscription", async () => {
    mocks.docCreate.mockResolvedValueOnce(undefined);
    await recordSubscriptionLifecycle({
      eventType: "subscription.expired",
      eventCreatedAt: "2026-01-01T00:00:00.000Z",
      subscription: {
        metadata: { userId: "u1", planId: "tier_pro" },
        customer: { customer_id: "cus_1" },
        recurring_pre_tax_amount: 39700,
        subscription_id: "sub_terminal",
        product_id: "p_pro",
        status: "expired",
        cancel_at_next_billing_date: false,
      } as any,
    });
    expect(mocks.synchronize).toHaveBeenCalledWith(
      expect.objectContaining({
        providerStatus: "expired",
        subscriptionId: "sub_terminal",
      }),
    );
    expect(mocks.docCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        job: "MEMBERSHIP_ACCESS_ENDED",
        to: "person@example.com",
      }),
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

  describe("course checkout & webhook fulfillment", () => {
    it("creates course checkout session using Dodo Payments", async () => {
      mocks.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          isPublished: true,
          price: 99,
          title: "Masterclass",
        }),
      });
      mocks.create.mockResolvedValueOnce({
        session_id: "cks_course_123",
        checkout_url: "https://checkout.dodopayments.com/course",
      });

      const res = await createCourseCheckoutConfig({
        userId: "u1",
        courseId: "course_1",
      });

      expect(res).toEqual({
        checkoutId: "cks_course_123",
        url: "https://checkout.dodopayments.com/course",
      });
    });

    it("returns lumino checkout url when course specifies luminoCheckoutUrl", async () => {
      mocks.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          isPublished: true,
          luminoCheckoutUrl: "https://lumino.com/pay/course_1",
        }),
      });

      const res = await createCourseCheckoutConfig({
        userId: "u1",
        courseId: "course_1",
      });

      expect(res).toEqual({
        checkoutId: "lumino_course_1",
        url: "https://lumino.com/pay/course_1",
      });
    });

    it("fulfills course enrollment on CoursePurchase payment succeeded", async () => {
      mocks.runTransaction.mockImplementation(async (cb: any) => {
        const tx = {
          get: vi
            .fn()
            .mockResolvedValueOnce({ empty: true })
            .mockResolvedValueOnce({
              exists: true,
              data: () => ({ enrolledStudentsCount: 2 }),
            }),
          set: vi.fn(),
          update: vi.fn(),
        };
        await cb(tx);
        expect(tx.set).toHaveBeenCalled();
        expect(tx.update).toHaveBeenCalled();
      });

      await recordPaymentSucceeded({
        payment: {
          payment_id: "pay_course_1",
          checkout_session_id: "cks_course_1",
          total_amount: 9900,
          metadata: {
            userId: "u1",
            courseId: "course_1",
            type: "COURSE_PURCHASE",
            paymentKey: "CoursePurchase",
          },
        },
      } as any);

      expect(mocks.runTransaction).toHaveBeenCalled();
    });
  });
});
