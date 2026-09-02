/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({
  transactionGet: vi.fn(),
  transactionSet: vi.fn(),
  generateCRSReport: vi.fn(),
  fundAnalysis: vi.fn(),
  getApplyFunding: vi.fn(),
  invalidateCache: vi.fn(),
}));

const currentRef = { id: "current" };
const latestQuery: any = {};
latestQuery.orderBy = vi.fn(() => latestQuery);
latestQuery.limit = vi.fn(() => latestQuery);
latestQuery.doc = vi.fn(() => currentRef);

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: () => ({
    collection: vi.fn(() => latestQuery),
    doc: vi.fn(() => currentRef),
    runTransaction: vi.fn(async (callback) =>
      callback({
        get: mocks.transactionGet,
        set: mocks.transactionSet,
      }),
    ),
  }),
}));

vi.mock("@/service/crs", () => ({
  generateCRSReport: mocks.generateCRSReport,
  fundAnalysis: mocks.fundAnalysis,
}));

vi.mock("@/service/apply-funding", () => ({
  getApplyFunding: mocks.getApplyFunding,
}));

vi.mock("@/lib/membership-cache", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    invalidate: mocks.invalidateCache,
  },
}));

vi.mock("@/lib/logger", () => ({ logInfo: vi.fn() }));

import {
  activateUserMembership,
  synchronizeDodoMembership,
  triggerActivationCRSWorkflow,
} from "@/service/membership";
import { hasPaidMembershipAccess } from "@/lib/membership-entitlement";

describe("hasPaidMembershipAccess", () => {
  it("supports paid, active legacy, grace, and expired grace states", () => {
    const now = new Date("2026-01-10T00:00:00.000Z");
    expect(
      hasPaidMembershipAccess({
        status: "inactive",
        entitlementStatus: "paid",
        retryAccessUntil: null,
      }),
    ).toBe(true);
    expect(
      hasPaidMembershipAccess({
        status: "active",
        entitlementStatus: null,
        retryAccessUntil: null,
      }),
    ).toBe(true);
    expect(
      hasPaidMembershipAccess(
        {
          status: "active",
          entitlementStatus: "grace",
          retryAccessUntil: "2026-01-11T00:00:00.000Z",
        },
        now,
      ),
    ).toBe(true);
    expect(
      hasPaidMembershipAccess(
        {
          status: "active",
          entitlementStatus: "grace",
          retryAccessUntil: "2026-01-09T00:00:00.000Z",
        },
        now,
      ),
    ).toBe(false);
  });
});

describe("synchronizeDodoMembership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("projects on-hold subscriptions to grace with a retry deadline", async () => {
    mocks.transactionGet.mockResolvedValueOnce({
      data: () => ({ entitlementStatus: "paid", createdAt: new Date() }),
    });
    await synchronizeDodoMembership({
      userId: "u1",
      tier: "tier_pro",
      providerStatus: "on_hold",
      subscriptionId: "sub_1",
      customerId: "cus_1",
      productId: "p_pro",
      amount: 397,
      nextBillingDate: "2026-02-01T00:00:00.000Z",
    });
    expect(mocks.transactionSet).toHaveBeenCalledWith(
      currentRef,
      expect.objectContaining({
        providerStatus: "on_hold",
        entitlementStatus: "grace",
        status: "active",
        retryAccessUntil: expect.any(Date),
        nextReminderAt: expect.any(Date),
      }),
      { merge: true },
    );
  });

  it("projects terminal subscriptions to Free access", async () => {
    mocks.transactionGet.mockResolvedValueOnce({
      data: () => ({ entitlementStatus: "grace", createdAt: new Date() }),
    });
    await synchronizeDodoMembership({
      userId: "u1",
      tier: "tier_pro",
      providerStatus: "expired",
      subscriptionId: "sub_1",
      amount: 397,
    });
    expect(mocks.transactionSet).toHaveBeenCalledWith(
      currentRef,
      expect.objectContaining({
        providerStatus: "expired",
        entitlementStatus: "free",
        status: "inactive",
        nextReminderAt: null,
      }),
      { merge: true },
    );
  });

  it("ignores an out-of-order provider event", async () => {
    mocks.transactionGet.mockResolvedValueOnce({
      data: () => ({
        providerEventAt: new Date("2026-02-01T00:00:00.000Z"),
      }),
    });
    await synchronizeDodoMembership({
      userId: "u1",
      tier: "tier_pro",
      providerStatus: "on_hold",
      subscriptionId: "sub_1",
      amount: 397,
      eventCreatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(mocks.transactionSet).not.toHaveBeenCalled();
  });

  it("marks only new Platform Access subscriptions with the new access model", async () => {
    mocks.transactionGet.mockResolvedValueOnce({
      data: () => ({ createdAt: new Date() }),
    });
    await synchronizeDodoMembership({
      userId: "u1",
      tier: "platform_access",
      providerStatus: "active",
      subscriptionId: "sub_platform",
      productId: "p_platform",
      amount: 499,
    });
    expect(mocks.transactionSet).toHaveBeenCalledWith(
      currentRef,
      expect.objectContaining({
        tier: "platform_access",
        accessModel: "platform_course",
        billingPlan: "platform_access",
        amount: 499,
      }),
      { merge: true },
    );
  });
});

describe("activateUserMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateCRSReport.mockResolvedValue(undefined);
    mocks.getApplyFunding.mockResolvedValue([]);
  });

  it("creates once and treats a duplicate active tier as an idempotent update", async () => {
    mocks.transactionGet
      .mockResolvedValueOnce({ exists: false })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({
        exists: true,
        ref: currentRef,
        data: () => ({ status: "active", tier: "tier_pro" }),
      })
      .mockResolvedValueOnce({ docs: [] });

    await activateUserMembership({
      userId: "u1",
      tier: "tier_pro",
      amount: 397,
      checkoutId: "cks_1",
      receiptId: "pay_1",
    });
    const duplicate = await activateUserMembership({
      userId: "u1",
      tier: "tier_pro",
      amount: 397,
      checkoutId: "sub_1",
      receiptId: "sub_1",
    });

    expect(duplicate).toEqual({ success: true, alreadyActive: true });
    expect(mocks.transactionSet).toHaveBeenNthCalledWith(
      1,
      currentRef,
      expect.objectContaining({
        tier: "tier_pro",
        status: "active",
        checkoutId: "cks_1",
      }),
    );
    expect(mocks.transactionSet).toHaveBeenNthCalledWith(
      2,
      currentRef,
      expect.objectContaining({ checkoutId: "sub_1" }),
      { merge: true },
    );
    expect(mocks.generateCRSReport).toHaveBeenCalledTimes(1);
    expect(mocks.invalidateCache).toHaveBeenCalledTimes(2);
  });
});

describe("triggerActivationCRSWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateCRSReport.mockResolvedValue(undefined);
    mocks.fundAnalysis.mockResolvedValue(undefined);
    mocks.getApplyFunding.mockResolvedValue([]);
  });

  it("generates CRS report and skips funding analysis when referenceNumber is not present", async () => {
    mocks.getApplyFunding.mockResolvedValueOnce([]);

    await triggerActivationCRSWorkflow({ userId: "u1", source: "membership" });

    expect(mocks.generateCRSReport).toHaveBeenCalledWith({
      userId: "u1",
      bureaus: { equifax: true, experian: true, transunion: true },
      bypassPremiumCheck: true,
    });
    expect(mocks.fundAnalysis).not.toHaveBeenCalled();
  });

  it("generates CRS report and triggers funding analysis when referenceNumber is present", async () => {
    mocks.getApplyFunding.mockResolvedValueOnce([
      { referenceNumber: "REF-12345" },
    ]);

    await triggerActivationCRSWorkflow({ userId: "u1", source: "addon" });

    expect(mocks.generateCRSReport).toHaveBeenCalledWith({
      userId: "u1",
      bureaus: { equifax: true, experian: true, transunion: true },
      bypassPremiumCheck: true,
    });
    expect(mocks.fundAnalysis).toHaveBeenCalledWith({
      userId: "u1",
      referenceNumber: "REF-12345",
    });
  });

  it("skips funding analysis for a Financial Education access application", async () => {
    mocks.getApplyFunding.mockResolvedValueOnce([
      {
        referenceNumber: "income-u1",
        applicationSource: "financial_education_access",
      },
    ]);

    await triggerActivationCRSWorkflow({ userId: "u1", source: "membership" });

    expect(mocks.generateCRSReport).toHaveBeenCalledWith({
      userId: "u1",
      bureaus: { equifax: true, experian: true, transunion: true },
      bypassPremiumCheck: true,
    });
    expect(mocks.fundAnalysis).not.toHaveBeenCalled();
  });

  it("swallows errors gracefully if CRS report generation fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.generateCRSReport.mockRejectedValueOnce(new Error("CRS API failure"));

    await expect(
      triggerActivationCRSWorkflow({ userId: "u1", source: "addon" }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
