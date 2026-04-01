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
  WHATS_NEW_COLLECTION: "whats-new",
}));

vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((data) => data),
}));

vi.mock("@/schema/whats-new", () => ({}));

import {
  recordWhatsNew,
  getWhatsNew,
  getWhatsNewActive,
  deleteWhatsNew,
  updateWhatsNew,
} from "@/service/whats-new";

describe("service/whats-new", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc = vi.fn().mockReturnValue(mockDocRef);
    mockDb.collection = vi.fn().mockReturnValue(mockCollectionRef);
  });

  describe("recordWhatsNew", () => {
    it("adds the values to the whats-new collection", async () => {
      mockAdd.mockResolvedValueOnce({ id: "news-1" });

      const values = {
        title: "New Feature",
        content: "We added X",
        status: true,
      };
      await recordWhatsNew(values as any);

      expect(mockDb.collection).toHaveBeenCalledWith("whats-new");
      expect(mockAdd).toHaveBeenCalledWith(values);
    });
  });

  describe("getWhatsNew", () => {
    it("returns all whats-new items with normalized dates and id", async () => {
      const docs = [
        { id: "news-1", data: () => ({ title: "Feature A", status: true }) },
        { id: "news-2", data: () => ({ title: "Feature B", status: false }) },
      ];
      mockGet.mockResolvedValueOnce({ docs });

      const result = await getWhatsNew();

      expect(mockDb.collection).toHaveBeenCalledWith("whats-new");
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: "news-1", title: "Feature A" });
      expect(result[1]).toMatchObject({ id: "news-2", title: "Feature B" });
    });

    it("returns empty array when no items exist", async () => {
      mockGet.mockResolvedValueOnce({ docs: [] });

      const result = await getWhatsNew();

      expect(result).toEqual([]);
    });
  });

  describe("getWhatsNewActive", () => {
    it("filters by status true and returns active items", async () => {
      const docs = [
        {
          id: "news-1",
          data: () => ({ title: "Active Feature", status: true }),
        },
      ];
      mockGet.mockResolvedValueOnce({ docs });

      const result = await getWhatsNewActive();

      expect(mockWhere).toHaveBeenCalledWith("status", "==", true);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "news-1",
        title: "Active Feature",
      });
    });

    it("returns empty array when no active items exist", async () => {
      mockGet.mockResolvedValueOnce({ docs: [] });

      const result = await getWhatsNewActive();

      expect(result).toEqual([]);
    });
  });

  describe("deleteWhatsNew", () => {
    it("deletes the document by id", async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      await deleteWhatsNew("news-1");

      expect(mockDb.collection).toHaveBeenCalledWith("whats-new");
      expect(mockCollectionRef.doc).toHaveBeenCalledWith("news-1");
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("updateWhatsNew", () => {
    it("updates the document by id with provided values", async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      const values = { title: "Updated Feature", status: false };
      await updateWhatsNew("news-1", values as any);

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("news-1");
      expect(mockUpdate).toHaveBeenCalledWith(values);
    });
  });
});
