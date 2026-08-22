/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({
  transactionGet: vi.fn(),
  transactionSet: vi.fn(),
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

vi.mock("@/lib/logger", () => ({ logInfo: vi.fn() }));

import { activateUserAddon } from "@/service/addons";

describe("activateUserAddon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it("updates existing active addon document idempotently if already exists", async () => {
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
  });
});
