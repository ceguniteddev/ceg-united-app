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
  triggerActivationCRSWorkflow,
} from "@/service/membership";

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
