import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock objects ──────────────────────────────────────────────────────────────
const mockGet = vi.fn();
const mockAdd = vi.fn();
const mockWhere = vi.fn();
const mockDelete = vi.fn();

const mockDocRef: any = {
  get: mockGet,
  delete: mockDelete,
  ref: { delete: mockDelete },
};

const mockCollectionRef: any = {
  add: mockAdd,
  doc: vi.fn().mockReturnValue(mockDocRef),
  where: mockWhere,
  get: mockGet,
};

mockWhere.mockReturnValue(mockCollectionRef);

const mockDb: any = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
}));
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));
vi.mock("firebase-admin/firestore", () => ({
  Timestamp: { now: vi.fn(() => "mock-ts") },
}));
vi.mock("@/service/plaid", () => ({
  getAccessToken: vi.fn(),
  getItem: vi.fn(),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import { recordWebhookData } from "@/service/plaid/item";

// ── Tests ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  mockWhere.mockReturnValue(mockCollectionRef);
  mockCollectionRef.doc.mockReturnValue(mockDocRef);
  mockDb.collection.mockReturnValue(mockCollectionRef);
});

describe("recordWebhookData", () => {
  it("adds webhook data to PLAID_ITEM_WEBHOOK_COLLECTION for a basic webhook code", async () => {
    mockAdd.mockResolvedValue(undefined);
    const webhookData = {
      webhook_code: "TRANSACTIONS_REMOVED",
      item_id: "item-abc",
    };

    await recordWebhookData(webhookData as any);

    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith({
      ...webhookData,
      createdAt: "mock-ts",
    });
  });

  it("adds to USER_LINK_UPDATE_MODE collection when webhook_code is PENDING_DISCONNECT", async () => {
    mockAdd.mockResolvedValue(undefined);
    const webhookData = {
      webhook_code: "PENDING_DISCONNECT",
      item_id: "item-abc",
    };

    await recordWebhookData(webhookData as any);

    // Called twice: once for PLAID_ITEM_WEBHOOK_COLLECTION, once for USER_LINK_UPDATE_MODE
    expect(mockAdd).toHaveBeenCalledTimes(2);
    expect(mockAdd).toHaveBeenNthCalledWith(1, {
      ...webhookData,
      createdAt: "mock-ts",
    });
    expect(mockAdd).toHaveBeenNthCalledWith(2, {
      ...webhookData,
      createdAt: "mock-ts",
    });
  });

  it("adds to NEW_ACCOUNTS_AVAILABLE collection when webhook_code is NEW_ACCOUNTS_AVAILABLE", async () => {
    mockAdd.mockResolvedValue(undefined);
    const webhookData = {
      webhook_code: "NEW_ACCOUNTS_AVAILABLE",
      item_id: "item-abc",
    };

    await recordWebhookData(webhookData as any);

    // Called twice: once for PLAID_ITEM_WEBHOOK_COLLECTION, once for NEW_ACCOUNTS_AVAILABLE
    expect(mockAdd).toHaveBeenCalledTimes(2);
  });

  it("invokes removeItemLinkUpdateModeData when webhook_code is LOGIN_REPAIRED", async () => {
    mockAdd.mockResolvedValue(undefined);
    // removeItemLinkUpdateModeData queries USER_LINK_UPDATE_MODE; return empty to skip deletes
    mockGet.mockResolvedValueOnce({ empty: true });
    const webhookData = { webhook_code: "LOGIN_REPAIRED", item_id: "item-abc" };

    await recordWebhookData(webhookData as any);

    // Only one add call (no extra collection add for LOGIN_REPAIRED)
    expect(mockAdd).toHaveBeenCalledTimes(1);
    // Firestore query was triggered by removeItemLinkUpdateModeData
    expect(mockGet).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalledWith("item_id", "==", "item-abc");
  });
});
