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
  SYSTEM_CONFIG_COLLECTION: "system-config",
  USER_TRADELINE_COLLECTION: "user-tradeline",
  USER_COLLECTION: "user",
}));

import {
  getMarkupPercentage,
  setMarkupPercentage,
  purchaseTradeline,
  getUserRecentTradelines,
} from "@/service/tradelines";

describe("service/tradelines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc = vi.fn().mockReturnValue(mockDocRef);
    mockDb.collection = vi.fn().mockReturnValue(mockCollectionRef);
  });

  describe("getMarkupPercentage", () => {
    it("returns markupPercentage from settings doc when it exists", async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ markupPercentage: 15 }),
      });

      const result = await getMarkupPercentage();

      expect(mockDb.collection).toHaveBeenCalledWith("system-config");
      expect(mockCollectionRef.doc).toHaveBeenCalledWith("settings");
      expect(result).toBe(15);
    });

    it("returns 0 when settings doc does not exist", async () => {
      mockGet.mockResolvedValueOnce({ exists: false });

      const result = await getMarkupPercentage();

      expect(result).toBe(0);
    });

    it("returns 0 when markupPercentage field is missing", async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({}),
      });

      const result = await getMarkupPercentage();

      expect(result).toBe(0);
    });
  });

  describe("setMarkupPercentage", () => {
    it("sets markupPercentage in settings doc with merge", async () => {
      mockSet.mockResolvedValueOnce(undefined);

      await setMarkupPercentage(20);

      expect(mockDb.collection).toHaveBeenCalledWith("system-config");
      expect(mockCollectionRef.doc).toHaveBeenCalledWith("settings");
      expect(mockSet).toHaveBeenCalledWith(
        { markupPercentage: 20 },
        { merge: true },
      );
    });

    it("sets markupPercentage to 0", async () => {
      mockSet.mockResolvedValueOnce(undefined);

      await setMarkupPercentage(0);

      expect(mockSet).toHaveBeenCalledWith(
        { markupPercentage: 0 },
        { merge: true },
      );
    });
  });

  describe("purchaseTradeline", () => {
    it("adds tradeline with userId, data, and createdAt", async () => {
      mockAdd.mockResolvedValueOnce({ id: "tradeline-1" });

      const tradelineData = {
        tradelineName: "Business Credit Card",
        limit: 5000,
      };
      await purchaseTradeline("user-123", tradelineData);

      expect(mockDb.collection).toHaveBeenCalledWith("user-tradeline");
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          tradelineName: "Business Credit Card",
          limit: 5000,
          createdAt: expect.any(String),
        }),
      );
    });
  });

  describe("getUserRecentTradelines", () => {
    it("queries tradelines for user within the last 60 days", async () => {
      const docs = [
        {
          id: "t1",
          data: () => ({ userId: "user-123", tradelineName: "Card A" }),
        },
        {
          id: "t2",
          data: () => ({ userId: "user-123", tradelineName: "Card B" }),
        },
      ];
      mockGet.mockResolvedValueOnce({ docs });

      const result = await getUserRecentTradelines("user-123");

      expect(mockDb.collection).toHaveBeenCalledWith("user-tradeline");
      expect(mockWhere).toHaveBeenCalledWith("userId", "==", "user-123");
      expect(mockWhere).toHaveBeenCalledWith(
        "createdAt",
        ">=",
        expect.any(String),
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: "t1", userId: "user-123" });
    });

    it("returns empty array when no recent tradelines exist", async () => {
      mockGet.mockResolvedValueOnce({ docs: [] });

      const result = await getUserRecentTradelines("user-456");

      expect(result).toEqual([]);
    });
  });
});
