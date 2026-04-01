import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock objects ──────────────────────────────────────────────────────────────
const mockGet = vi.fn();
const mockAdd = vi.fn();
const mockDelete = vi.fn();
const mockSave = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockOrderBy = vi.fn();

const mockDocRef: any = {
  get: mockGet,
  delete: mockDelete,
};

const mockCollectionRef: any = {
  add: mockAdd,
  doc: vi.fn().mockReturnValue(mockDocRef),
  where: mockWhere,
  limit: mockLimit,
  orderBy: mockOrderBy,
  get: mockGet,
};

mockWhere.mockReturnValue(mockCollectionRef);
mockLimit.mockReturnValue(mockCollectionRef);
mockOrderBy.mockReturnValue(mockCollectionRef);

const mockBucketFile: any = {
  save: mockSave,
  delete: vi.fn().mockResolvedValue(undefined),
};

const mockBucket: any = {
  file: vi.fn().mockReturnValue(mockBucketFile),
};

const mockDb: any = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  storageAdmin: vi.fn(() => mockBucket),
}));
vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("firebase-admin/firestore", () => ({
  Timestamp: { now: vi.fn(() => "mock-ts") },
}));
vi.mock("@/lib/plaid", () => ({
  plaidClient: {
    assetReportCreate: vi.fn(),
    assetReportGet: vi.fn(),
    assetReportPdfGet: vi.fn(),
    assetReportRemove: vi.fn(),
  },
}));
vi.mock("@/service/plaid", () => ({ getAccessToken: vi.fn() }));
vi.mock("@/service/user", () => ({ getUserById: vi.fn() }));
vi.mock("@/service/index", () => ({
  getAppPlaidWebhookURL: vi.fn().mockResolvedValue("https://test.com/webhook"),
  getBaseUrl: vi.fn().mockResolvedValue("https://test.com"),
}));
vi.mock("plaid", () => ({
  AssetReportAddOns: { FastAssets: "fast_assets", Investments: "investments" },
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import {
  recordWebhookData,
  getAssetReportRequestByAssetReportId,
  getAssetReportRequestByUserId,
  deleteAssetReportRequest,
  createAssetReport,
} from "@/service/plaid/asset";
import { plaidClient } from "@/lib/plaid";
import { getAccessToken } from "@/service/plaid";
import { getUserById } from "@/service/user";

// ── Helpers ───────────────────────────────────────────────────────────────────
const resetCollectionChain = () => {
  mockWhere.mockReturnValue(mockCollectionRef);
  mockLimit.mockReturnValue(mockCollectionRef);
  mockOrderBy.mockReturnValue(mockCollectionRef);
  mockCollectionRef.doc.mockReturnValue(mockDocRef);
  mockDb.collection.mockReturnValue(mockCollectionRef);
};

// ── Tests ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  resetCollectionChain();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("recordWebhookData", () => {
  it("skips adding when asset_report_id already exists in collection", async () => {
    mockGet.mockResolvedValue({ empty: false, docs: [{ id: "existing-doc" }] });

    await recordWebhookData({ asset_report_id: "report-1" } as any);

    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("adds the webhook data when it does not exist yet", async () => {
    // First get: empty (no existing webhook record)
    // Second get: empty (no asset report request found)
    mockGet
      .mockResolvedValueOnce({ empty: true, docs: [] })
      .mockResolvedValueOnce({ empty: true, docs: [] });
    mockAdd.mockResolvedValue(undefined);

    await recordWebhookData({ asset_report_id: "report-new" } as any);

    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith({
      asset_report_id: "report-new",
      createdAt: "mock-ts",
    });
  });

  it("fetches the asset report when the request record is found after adding webhook", async () => {
    const fakeRequest = {
      id: "req-1",
      assetReportToken: "token-abc",
      assetReportId: "report-new",
      userId: "user-1",
      itemId: "item-1",
    };
    const fakeAssetData = { report: { items: [] } };

    // First get: empty (no existing webhook) -> add proceeds
    // Second get (getAssetReportRequestByAssetReportId): returns doc
    mockGet
      .mockResolvedValueOnce({ empty: true, docs: [] })
      .mockResolvedValueOnce({
        empty: false,
        docs: [{ id: "req-1", data: () => fakeRequest }],
      });
    mockAdd.mockResolvedValue(undefined);

    vi.mocked(plaidClient.assetReportGet).mockResolvedValue({
      data: fakeAssetData,
    } as any);
    vi.mocked(plaidClient.assetReportPdfGet).mockResolvedValue({
      data: Buffer.from("pdf-content"),
    } as any);
    mockSave.mockResolvedValue(undefined);

    // For getAssetReport -> adds to PLAID_ASSET_REPORT_DATA collection
    mockAdd.mockResolvedValue(undefined);

    await recordWebhookData({ asset_report_id: "report-new" } as any);

    expect(plaidClient.assetReportGet).toHaveBeenCalledWith({
      asset_report_token: "token-abc",
      include_insights: true,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getAssetReportRequestByAssetReportId", () => {
  it("returns null when no documents are found", async () => {
    mockGet.mockResolvedValue({ empty: true, docs: [] });

    const result = await getAssetReportRequestByAssetReportId("missing-id");

    expect(result).toBeNull();
    expect(mockWhere).toHaveBeenCalledWith("assetReportId", "==", "missing-id");
  });

  it("returns the asset report request when found", async () => {
    const fakeDoc = {
      id: "doc-1",
      data: () => ({
        userId: "user-1",
        assetReportToken: "token-1",
        assetReportId: "report-1",
        itemId: "item-1",
      }),
    };
    mockGet.mockResolvedValue({ empty: false, docs: [fakeDoc] });

    const result = await getAssetReportRequestByAssetReportId("report-1");

    expect(result).not.toBeNull();
    expect(result!.id).toBe("doc-1");
    expect(result!.assetReportId).toBe("report-1");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getAssetReportRequestByUserId", () => {
  it("returns null when no documents are found", async () => {
    mockGet.mockResolvedValue({ empty: true, docs: [] });

    const result = await getAssetReportRequestByUserId("user-1");

    expect(result).toBeNull();
    expect(mockWhere).toHaveBeenCalledWith("userId", "==", "user-1");
  });

  it("returns rows mapped from documents", async () => {
    const fakeDocs = [
      {
        id: "doc-a",
        data: () => ({
          userId: "user-1",
          itemId: "item-1",
          assetReportToken: "t1",
          assetReportId: "r1",
        }),
      },
      {
        id: "doc-b",
        data: () => ({
          userId: "user-1",
          itemId: "item-2",
          assetReportToken: "t2",
          assetReportId: "r2",
        }),
      },
    ];
    mockGet.mockResolvedValue({ empty: false, docs: fakeDocs });

    const result = await getAssetReportRequestByUserId("user-1");

    expect(result).toHaveLength(2);
    expect(result![0].id).toBe("doc-a");
    expect(result![1].id).toBe("doc-b");
  });

  it("applies itemId filter when provided", async () => {
    mockGet.mockResolvedValue({ empty: true, docs: [] });

    await getAssetReportRequestByUserId("user-1", "item-specific");

    expect(mockWhere).toHaveBeenCalledWith("userId", "==", "user-1");
    expect(mockWhere).toHaveBeenCalledWith("itemId", "==", "item-specific");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("deleteAssetReportRequest", () => {
  it("throws when docId is empty", async () => {
    await expect(deleteAssetReportRequest("")).rejects.toThrow(
      "Doc id is required",
    );
  });

  it("deletes the document by docId", async () => {
    mockDelete.mockResolvedValue(undefined);

    await deleteAssetReportRequest("doc-to-delete");

    expect(mockCollectionRef.doc).toHaveBeenCalledWith("doc-to-delete");
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("createAssetReport", () => {
  it("throws when userId is missing", async () => {
    await expect(createAssetReport("", "item-1")).rejects.toThrow(
      "User id is required",
    );
  });

  it("throws when itemId is missing", async () => {
    await expect(createAssetReport("user-1", "")).rejects.toThrow(
      "Item id is required",
    );
  });

  it("throws when user is not found", async () => {
    vi.mocked(getUserById).mockResolvedValue(null as any);

    await expect(createAssetReport("user-1", "item-1")).rejects.toThrow(
      "User not found",
    );
  });

  it("returns null when no access tokens are found", async () => {
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      firstName: "Test",
    } as any);
    vi.mocked(getAccessToken).mockResolvedValue(null);

    const result = await createAssetReport("user-1", "item-1");

    expect(result).toBeNull();
  });

  it("calls assetReportCreate and records the request on success", async () => {
    vi.mocked(getUserById).mockResolvedValue({
      id: "user-1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phoneNumber: "555-0100",
    } as any);
    vi.mocked(getAccessToken).mockResolvedValue([
      {
        id: "t1",
        accessToken: "token-a",
        itemId: "item-1",
        tokenType: "ITEM",
      } as any,
    ]);
    vi.mocked(plaidClient.assetReportCreate).mockResolvedValue({
      data: {
        asset_report_token: "asset-token-123",
        asset_report_id: "asset-id-123",
        request_id: "req-id",
      },
    } as any);

    // recordAssetReportRequest calls add then docRef.get
    const fakeDocRef = {
      get: vi.fn().mockResolvedValue({
        id: "new-req-doc",
        data: () => ({
          userId: "user-1",
          assetReportToken: "asset-token-123",
          assetReportId: "asset-id-123",
          itemId: "item-1",
        }),
      }),
    };
    mockAdd.mockResolvedValue(fakeDocRef);

    const result = await createAssetReport("user-1", "item-1");

    expect(plaidClient.assetReportCreate).toHaveBeenCalledTimes(1);
    const callArg = vi.mocked(plaidClient.assetReportCreate).mock.calls[0][0];
    expect(callArg.access_tokens).toContain("token-a");
    expect(callArg.days_requested).toBe(365);
    expect(result).toMatchObject({
      asset_report_token: "asset-token-123",
      asset_report_id: "asset-id-123",
    });
  });

  it("throws when assetReportCreate fails", async () => {
    vi.mocked(getUserById).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(getAccessToken).mockResolvedValue([
      {
        id: "t1",
        accessToken: "token-a",
        itemId: "item-1",
        tokenType: "ITEM",
      } as any,
    ]);
    vi.mocked(plaidClient.assetReportCreate).mockRejectedValue(
      new Error("Plaid API error"),
    );

    await expect(createAssetReport("user-1", "item-1")).rejects.toThrow(
      "Plaid API error",
    );
  });
});
