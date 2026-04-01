import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock objects ──────────────────────────────────────────────────────────────
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockAdd = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockCount = vi.fn();

const mockDocRef: any = {
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
};

const mockCollectionRef: any = {
  add: mockAdd,
  doc: vi.fn().mockReturnValue(mockDocRef),
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  get: mockGet,
  count: mockCount,
};

mockWhere.mockReturnValue(mockCollectionRef);
mockOrderBy.mockReturnValue(mockCollectionRef);
mockLimit.mockReturnValue(mockCollectionRef);
mockCount.mockReturnValue({
  get: vi.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
});

const mockDb: any = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  storageAdmin: vi.fn(() => ({
    file: vi
      .fn()
      .mockReturnValue({ delete: vi.fn().mockResolvedValue(undefined) }),
  })),
}));
vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("@/lib/plaid", () => ({
  plaidClient: {
    linkTokenCreate: vi.fn(),
    itemPublicTokenExchange: vi.fn(),
    itemRemove: vi.fn(),
    accountsGet: vi.fn(),
    institutionsGetById: vi.fn(),
    assetReportRemove: vi.fn(),
  },
}));
vi.mock("@/lib/encryption", () => ({
  encrypt: vi.fn().mockReturnValue({ content: "enc-content", iv: "enc-iv" }),
  decrypt: vi.fn().mockReturnValue("decrypted-access-token"),
}));
vi.mock("@/lib/utils", () => ({ parseStringify: vi.fn((x: any) => x) }));
vi.mock("@/service/plaid/asset", () => ({
  createAssetReport: vi.fn(),
  deleteAssetReportRequest: vi.fn(),
  getAssetReportRequestByUserId: vi.fn(),
}));
vi.mock("@/service/plaid/item", () => ({
  removeItemLinkUpdateModeNewAccount: vi.fn(),
}));
vi.mock("@/service/plaid/data", () => ({
  getPlaidUserToken: vi.fn(),
  recordPlaidUserToken: vi.fn(),
}));
vi.mock("@/service/crs", () => ({ generateCRSReport: vi.fn() }));
vi.mock("@/service/index", () => ({
  getAppPlaidWebhookURL: vi
    .fn()
    .mockResolvedValue("https://test.com/api/plaid/webhook"),
}));
vi.mock("firebase-admin/firestore", () => ({
  Timestamp: { now: vi.fn(() => "mock-ts") },
}));
vi.mock("plaid", () => ({
  Products: {
    Transactions: "transactions",
    IncomeVerification: "income_verification",
  },
  CountryCode: {},
  IncomeVerificationSourceType: { Bank: "bank", Payroll: "payroll" },
  IncomeVerificationPayrollFlowType: {
    DigitalIncome: "digital",
    DocumentIncome: "document",
  },
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import {
  recordAccessToken,
  getAccessToken,
  hasAccessToken,
  deleteAccessToken,
  getPlaidLinkToken,
  exchangeAccessToken,
} from "@/service/plaid";
import { plaidClient } from "@/lib/plaid";
import { encrypt, decrypt } from "@/lib/encryption";

// ── Helpers ───────────────────────────────────────────────────────────────────
const resetCollectionChain = () => {
  mockWhere.mockReturnValue(mockCollectionRef);
  mockOrderBy.mockReturnValue(mockCollectionRef);
  mockLimit.mockReturnValue(mockCollectionRef);
  mockCount.mockReturnValue({
    get: vi.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
  });
  mockCollectionRef.doc.mockReturnValue(mockDocRef);
  mockDb.collection.mockReturnValue(mockCollectionRef);
};

// ── Tests ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  resetCollectionChain();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("recordAccessToken", () => {
  it("encrypts the access token and adds a record to the collection", async () => {
    mockAdd.mockResolvedValue(undefined);
    vi.mocked(encrypt).mockReturnValue({
      content: "enc-content",
      iv: "enc-iv",
    });

    await recordAccessToken("user-1", "raw-access-token", "item-1", "ITEM");

    expect(encrypt).toHaveBeenCalledWith("raw-access-token");
    expect(mockAdd).toHaveBeenCalledWith({
      userId: "user-1",
      iv: "enc-iv",
      accessToken: "enc-content",
      itemId: "item-1",
      tokenType: "ITEM",
      createdAt: "mock-ts",
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getAccessToken", () => {
  it("returns null when the snapshot is empty", async () => {
    mockGet.mockResolvedValue({ empty: true, docs: [] });

    const result = await getAccessToken("user-1");

    expect(result).toBeNull();
  });

  it("returns decrypted tokens when documents exist", async () => {
    const fakeDoc = {
      id: "doc-id-1",
      data: () => ({
        accessToken: "enc-content",
        iv: "enc-iv",
        itemId: "item-1",
        tokenType: "ITEM",
      }),
    };
    mockGet.mockResolvedValue({ empty: false, docs: [fakeDoc] });
    vi.mocked(decrypt).mockReturnValue("decrypted-access-token");

    const result = await getAccessToken("user-1", "ITEM", "item-1");

    expect(decrypt).toHaveBeenCalledWith({
      iv: "enc-iv",
      content: "enc-content",
    });
    expect(result).toHaveLength(1);
    expect(result![0].accessToken).toBe("decrypted-access-token");
    expect(result![0].id).toBe("doc-id-1");
  });

  it("applies tokenType and itemId where filters", async () => {
    mockGet.mockResolvedValue({ empty: true, docs: [] });

    await getAccessToken("user-2", "INCOME", "item-2");

    // where called at least twice: once for tokenType, once for itemId
    expect(mockWhere).toHaveBeenCalledWith("tokenType", "==", "INCOME");
    expect(mockWhere).toHaveBeenCalledWith("itemId", "==", "item-2");
  });

  it("handles decrypt failure gracefully and returns null accessToken", async () => {
    const fakeDoc = {
      id: "doc-id-2",
      data: () => ({
        accessToken: "bad-enc",
        iv: "bad-iv",
        itemId: "item-x",
        tokenType: "ITEM",
      }),
    };
    mockGet.mockResolvedValue({ empty: false, docs: [fakeDoc] });
    vi.mocked(decrypt).mockImplementation(() => {
      throw new Error("decryption failed");
    });

    const result = await getAccessToken("user-1");

    expect(result).toHaveLength(1);
    expect(result![0].accessToken).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("hasAccessToken", () => {
  it("returns false when count is 0", async () => {
    mockCount.mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
    });

    const result = await hasAccessToken("user-1");

    expect(result).toBe(false);
  });

  it("returns true when count is greater than 0", async () => {
    mockCount.mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: () => ({ count: 3 }) }),
    });

    const result = await hasAccessToken("user-1", "ITEM");

    expect(result).toBe(true);
  });

  it("applies tokenType and itemId filters", async () => {
    mockCount.mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: () => ({ count: 1 }) }),
    });

    await hasAccessToken("user-1", "ITEM", "item-1");

    expect(mockWhere).toHaveBeenCalledWith("tokenType", "==", "ITEM");
    expect(mockWhere).toHaveBeenCalledWith("itemId", "==", "item-1");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("deleteAccessToken", () => {
  it("deletes the document by docId", async () => {
    mockDelete.mockResolvedValue(undefined);

    await deleteAccessToken("doc-id-abc");

    expect(mockCollectionRef.doc).toHaveBeenCalledWith("doc-id-abc");
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getPlaidLinkToken", () => {
  it("throws an error when userId is missing", async () => {
    await expect(getPlaidLinkToken({ userId: "" } as any)).rejects.toThrow(
      "User id is required",
    );
  });

  it("returns link token data on success", async () => {
    vi.mocked(plaidClient.linkTokenCreate).mockResolvedValue({
      data: {
        link_token: "link-token-123",
        expiration: "2026-01-01",
        request_id: "req-1",
      },
    } as any);

    const result = await getPlaidLinkToken({ userId: "user-1" } as any);

    expect(plaidClient.linkTokenCreate).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ link_token: "link-token-123" });
  });

  it("returns null when plaidClient throws", async () => {
    vi.mocked(plaidClient.linkTokenCreate).mockRejectedValue({
      response: { data: { error_code: "INVALID_PRODUCT" } },
    });

    const result = await getPlaidLinkToken({ userId: "user-1" } as any);

    expect(result).toBeNull();
  });

  it("uses update_mode config when itemId is provided and accessToken is found", async () => {
    // getAccessToken will call orderBy -> get, return a token
    mockGet.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: "doc-1",
          data: () => ({
            accessToken: "enc",
            iv: "iv",
            itemId: "item-1",
            tokenType: "ITEM",
          }),
        },
      ],
    });
    vi.mocked(decrypt).mockReturnValue("real-access-token");
    vi.mocked(plaidClient.linkTokenCreate).mockResolvedValue({
      data: { link_token: "update-link-token" },
    } as any);

    const result = await getPlaidLinkToken({
      userId: "user-1",
      itemId: "item-1",
    } as any);

    expect(result).toMatchObject({ link_token: "update-link-token" });
    const callArg = vi.mocked(plaidClient.linkTokenCreate).mock.calls[0][0];
    expect(callArg).toHaveProperty("access_token", "real-access-token");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("exchangeAccessToken", () => {
  it("throws when userId is missing", async () => {
    await expect(exchangeAccessToken("pub-token", "", "ITEM")).rejects.toThrow(
      "User id is required",
    );
  });

  it("throws when publicToken is missing", async () => {
    await expect(exchangeAccessToken("", "user-1", "ITEM")).rejects.toThrow(
      "Public token is required",
    );
  });

  it("calls itemPublicTokenExchange and records the access token on success", async () => {
    vi.mocked(plaidClient.itemPublicTokenExchange).mockResolvedValue({
      data: { access_token: "new-access-token", item_id: "new-item-id" },
    } as any);
    mockAdd.mockResolvedValue(undefined);

    const { createAssetReport } = await import("@/service/plaid/asset");
    vi.mocked(createAssetReport).mockResolvedValue(undefined as any);

    await exchangeAccessToken("pub-token", "user-1", "ITEM");

    expect(plaidClient.itemPublicTokenExchange).toHaveBeenCalledWith({
      public_token: "pub-token",
    });
    // recordAccessToken calls encrypt + add
    expect(encrypt).toHaveBeenCalledWith("new-access-token");
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });

  it("does not record access token when itemId is provided (update mode)", async () => {
    vi.mocked(plaidClient.itemPublicTokenExchange).mockResolvedValue({
      data: { access_token: "new-access-token", item_id: "existing-item-id" },
    } as any);

    const { removeItemLinkUpdateModeNewAccount } =
      await import("@/service/plaid/item");
    vi.mocked(removeItemLinkUpdateModeNewAccount).mockResolvedValue(undefined);

    await exchangeAccessToken(
      "pub-token",
      "user-1",
      "ITEM",
      "existing-item-id",
      true,
    );

    expect(mockAdd).not.toHaveBeenCalled();
    expect(removeItemLinkUpdateModeNewAccount).toHaveBeenCalledWith(
      "existing-item-id",
    );
  });
});
