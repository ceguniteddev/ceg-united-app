import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mock objects BEFORE vi.mock calls
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockAdd = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();

const mockDocRef = {
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
};

const mockCollectionRef = {
  add: mockAdd,
  doc: vi.fn().mockReturnValue(mockDocRef),
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  get: mockGet,
};

mockWhere.mockReturnValue(mockCollectionRef);
mockOrderBy.mockReturnValue(mockCollectionRef);
mockLimit.mockReturnValue(mockCollectionRef);

const mockDb = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
};

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  authenticationAdmin: vi.fn(),
  storageAdmin: vi.fn(),
}));

vi.mock("@/constant/collection-name", () => ({
  WEBHOOK_DATA_COLLECTION: "webhook-data",
}));

vi.mock("firebase-admin/firestore", () => ({
  Timestamp: {
    now: vi.fn().mockReturnValue({ seconds: 1234567890, nanoseconds: 0 }),
  },
  FieldValue: {
    serverTimestamp: vi.fn().mockReturnValue("SERVER_TIMESTAMP"),
    delete: vi.fn().mockReturnValue("DELETE_SENTINEL"),
  },
}));

import { Timestamp } from "firebase-admin/firestore";
import { recordWebhookData } from "@/service/webhook";

const MOCK_TIMESTAMP = { seconds: 1234567890, nanoseconds: 0 };

describe("service/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc = vi.fn().mockReturnValue(mockDocRef);
    mockDb.collection = vi.fn().mockReturnValue(mockCollectionRef);
    vi.mocked(Timestamp.now).mockReturnValue(MOCK_TIMESTAMP as any);
  });

  describe("recordWebhookData", () => {
    it("adds webhook data with Timestamp.now() as createdAt", async () => {
      mockAdd.mockResolvedValueOnce({ id: "webhook-doc-1" });

      const webhookData = {
        type: "TRANSACTIONS_REMOVED",
        itemId: "item-123",
        webhookCode: "DEFAULT",
      };

      await recordWebhookData(webhookData);

      expect(mockDb.collection).toHaveBeenCalledWith("webhook-data");
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "TRANSACTIONS_REMOVED",
          itemId: "item-123",
          webhookCode: "DEFAULT",
          createdAt: MOCK_TIMESTAMP,
        }),
      );
    });

    it("spreads all webhook data fields into the document", async () => {
      mockAdd.mockResolvedValueOnce({ id: "webhook-doc-2" });

      const webhookData = {
        type: "ITEM_ERROR",
        error: { errorCode: "ITEM_LOGIN_REQUIRED" },
        itemId: "item-456",
      };

      await recordWebhookData(webhookData);

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "ITEM_ERROR",
          error: { errorCode: "ITEM_LOGIN_REQUIRED" },
          itemId: "item-456",
          createdAt: MOCK_TIMESTAMP,
        }),
      );
    });
  });
});
