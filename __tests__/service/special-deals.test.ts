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
  SPECIAL_DEALS_COLLECTION: "special-deals",
}));

vi.mock("@/schema/special-deals", () => ({}));

import {
  createSpecialDeal,
  getAllSpecialDeals,
  getActiveSpecialDeals,
  getSpecialDealById,
  updateSpecialDeal,
  deleteSpecialDeal,
  toggleSpecialDealActive,
} from "@/service/special-deals";

describe("service/special-deals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc = vi.fn().mockReturnValue(mockDocRef);
    mockDb.collection = vi.fn().mockReturnValue(mockCollectionRef);
  });

  describe("createSpecialDeal", () => {
    it("adds a document with createdAt and updatedAt and returns the doc id", async () => {
      const docId = "new-deal-id";
      mockAdd.mockResolvedValueOnce({ id: docId });

      const data = {
        title: "Summer Sale",
        isActive: true,
        expiresAt: "2025-08-01",
      };
      const result = await createSpecialDeal(data as any);

      expect(mockDb.collection).toHaveBeenCalledWith("special-deals");
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Summer Sale",
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
      expect(result).toBe(docId);
    });
  });

  describe("getAllSpecialDeals", () => {
    it("returns all deals ordered by createdAt desc", async () => {
      const docs = [
        { id: "a", data: () => ({ title: "Deal A" }) },
        { id: "b", data: () => ({ title: "Deal B" }) },
      ];
      mockGet.mockResolvedValueOnce({ docs });

      const result = await getAllSpecialDeals();

      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(result).toEqual([
        { id: "a", title: "Deal A" },
        { id: "b", title: "Deal B" },
      ]);
    });

    it("returns empty array when no deals exist", async () => {
      mockGet.mockResolvedValueOnce({ docs: [] });

      const result = await getAllSpecialDeals();

      expect(result).toEqual([]);
    });
  });

  describe("getActiveSpecialDeals", () => {
    it("filters by isActive and expiresAt then orders by expiresAt asc", async () => {
      const docs = [{ id: "c", data: () => ({ title: "Active Deal" }) }];
      mockGet.mockResolvedValueOnce({ docs });

      const result = await getActiveSpecialDeals();

      expect(mockWhere).toHaveBeenCalledWith("isActive", "==", true);
      expect(mockWhere).toHaveBeenCalledWith(
        "expiresAt",
        ">=",
        expect.any(String),
      );
      expect(mockOrderBy).toHaveBeenCalledWith("expiresAt", "asc");
      expect(result).toEqual([{ id: "c", title: "Active Deal" }]);
    });

    it("returns empty array when no active deals", async () => {
      mockGet.mockResolvedValueOnce({ docs: [] });

      const result = await getActiveSpecialDeals();

      expect(result).toEqual([]);
    });
  });

  describe("getSpecialDealById", () => {
    it("returns the deal when doc exists", async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        id: "deal-1",
        data: () => ({ title: "Deal 1" }),
      });

      const result = await getSpecialDealById("deal-1");

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("deal-1");
      expect(result).toEqual({ id: "deal-1", title: "Deal 1" });
    });

    it("returns null when doc does not exist", async () => {
      mockGet.mockResolvedValueOnce({ exists: false });

      const result = await getSpecialDealById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("updateSpecialDeal", () => {
    it("updates the document with data and updatedAt timestamp", async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      await updateSpecialDeal("deal-1", { bank_name: "Updated Bank" });

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("deal-1");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          bank_name: "Updated Bank",
          updatedAt: expect.any(String),
        }),
      );
    });
  });

  describe("deleteSpecialDeal", () => {
    it("deletes the document by id", async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      await deleteSpecialDeal("deal-1");

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("deal-1");
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("toggleSpecialDealActive", () => {
    it("updates isActive to true with updatedAt", async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      await toggleSpecialDealActive("deal-1", true);

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("deal-1");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          updatedAt: expect.any(String),
        }),
      );
    });

    it("updates isActive to false with updatedAt", async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      await toggleSpecialDealActive("deal-2", false);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
          updatedAt: expect.any(String),
        }),
      );
    });
  });
});
