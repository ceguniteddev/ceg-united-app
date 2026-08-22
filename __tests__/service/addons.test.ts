/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({
  transactionGet: vi.fn(),
  transactionSet: vi.fn(),
  triggerActivationCRSWorkflow: vi.fn(),
}));

const targetRef = { id: "credit_module_pro" };
const queryMock: any = {};
queryMock.where = vi.fn(() => queryMock);
queryMock.limit = vi.fn(() => queryMock);
queryMock.doc = vi.fn(() => targetRef);

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: () => ({
    collection: vi.fn(() => queryMock),
    runTransaction: vi.fn(async (callback) =>
      callback({
        get: mocks.transactionGet,
        set: mocks.transactionSet,
      }),
    ),
  }),
}));

vi.mock("@/service/membership", () => ({
  triggerActivationCRSWorkflow: mocks.triggerActivationCRSWorkflow,
}));

vi.mock("@/lib/logger", () => ({ logInfo: vi.fn() }));

import { activateUserAddon } from "@/service/addons";

describe("activateUserAddon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.triggerActivationCRSWorkflow.mockResolvedValue(undefined);
  });

  it("creates a new addon using target document ref if none exists", async () => {
    mocks.transactionGet
      .mockResolvedValueOnce({ exists: false })
      .mockResolvedValueOnce({ docs: [] });

    const res = await activateUserAddon({
      userId: "user_1",
      addonId: "credit_module_pro",
      amount: 197,
      checkoutId: "cks_1",
      planId: "pdt_1",
      receiptId: "pay_1",
    });

    expect(res).toEqual({ success: true });
    expect(mocks.transactionSet).toHaveBeenCalledWith(
      targetRef,
      expect.objectContaining({
        addonId: "credit_module_pro",
        amount: 197,
        checkoutId: "cks_1",
        status: "active",
      }),
    );
    expect(mocks.triggerActivationCRSWorkflow).not.toHaveBeenCalled();
  });

  it("triggers CRS workflow on first activation when triggerCRSWorkflow is true", async () => {
    mocks.transactionGet
      .mockResolvedValueOnce({ exists: false })
      .mockResolvedValueOnce({ docs: [] });

    const res = await activateUserAddon({
      userId: "user_1",
      addonId: "credit_module_pro",
      amount: 197,
      checkoutId: "cks_1",
      planId: "pdt_1",
      receiptId: "pay_1",
      triggerCRSWorkflow: true,
    });

    expect(res).toEqual({ success: true });
    expect(mocks.triggerActivationCRSWorkflow).toHaveBeenCalledWith({
      userId: "user_1",
      source: "addon",
    });
  });

  it("updates existing active addon document idempotently if already exists and skips CRS workflow", async () => {
    const existingRef = { id: "credit_module_pro" };
    mocks.transactionGet
      .mockResolvedValueOnce({
        exists: true,
        ref: existingRef,
        data: () => ({ status: "active", addonId: "credit_module_pro" }),
      })
      .mockResolvedValueOnce({ docs: [] });

    const res = await activateUserAddon({
      userId: "user_1",
      addonId: "credit_module_pro",
      amount: 197,
      checkoutId: "sub_1",
      triggerCRSWorkflow: true,
    });

    expect(res).toEqual({ success: true, alreadyActive: true });
    expect(mocks.transactionSet).toHaveBeenCalledWith(
      existingRef,
      expect.objectContaining({
        amount: 197,
        checkoutId: "sub_1",
      }),
      { merge: true },
    );
    expect(mocks.triggerActivationCRSWorkflow).not.toHaveBeenCalled();
  });
});
