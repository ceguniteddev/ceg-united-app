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
  FUNDING_PRODUCTS_COLLECTION: "funding-products",
}));

vi.mock("@/schema/funding-products", () => ({}));

import {
  recordFundingProduct,
  getFundingProducts,
  getFundingProduct,
  deleteFundingProduct,
  updateFundingProduct,
} from "@/service/funding-products";

describe("service/funding-products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc = vi.fn().mockReturnValue(mockDocRef);
    mockDb.collection = vi.fn().mockReturnValue(mockCollectionRef);
  });

  describe("recordFundingProduct", () => {
    it("adds the product values to the collection", async () => {
      mockAdd.mockResolvedValueOnce({ id: "prod-1" });

      const values = { productName: "Business Loan", rate: 5.5 };
      await recordFundingProduct(values as any);

      expect(mockDb.collection).toHaveBeenCalledWith("funding-products");
      expect(mockAdd).toHaveBeenCalledWith(values);
    });
  });

  describe("getFundingProducts", () => {
    it("returns all products ordered by productName asc", async () => {
      const docs = [
        { id: "prod-1", data: () => ({ productName: "Auto Loan" }) },
        { id: "prod-2", data: () => ({ productName: "Business Loan" }) },
      ];
      mockGet.mockResolvedValueOnce({ docs });

      const result = await getFundingProducts();

      expect(mockOrderBy).toHaveBeenCalledWith("productName", "asc");
      expect(result).toEqual([
        { id: "prod-1", productName: "Auto Loan" },
        { id: "prod-2", productName: "Business Loan" },
      ]);
    });

    it("returns empty array when no products exist", async () => {
      mockGet.mockResolvedValueOnce({ docs: [] });

      const result = await getFundingProducts();

      expect(result).toEqual([]);
    });
  });

  describe("getFundingProduct", () => {
    it("returns the product with id merged from data", async () => {
      mockGet.mockResolvedValueOnce({
        id: "prod-1",
        data: () => ({ productName: "Business Loan", rate: 5.5 }),
      });

      const result = await getFundingProduct("prod-1");

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("prod-1");
      expect(result).toEqual({
        id: "prod-1",
        productName: "Business Loan",
        rate: 5.5,
      });
    });
  });

  describe("deleteFundingProduct", () => {
    it("deletes the product by id", async () => {
      // getFundingProduct is called without await internally, set up get to resolve
      mockGet.mockResolvedValue({
        id: "prod-1",
        data: () => ({ productName: "Business Loan" }),
      });
      mockDelete.mockResolvedValueOnce(undefined);

      await deleteFundingProduct("prod-1");

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("prod-1");
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("updateFundingProduct", () => {
    it("updates the product by id with provided values", async () => {
      // getFundingProduct is called without await internally
      mockGet.mockResolvedValue({
        id: "prod-1",
        data: () => ({ productName: "Business Loan" }),
      });
      mockUpdate.mockResolvedValueOnce(undefined);

      const values = { productName: "Updated Loan", rate: 6.0 };
      await updateFundingProduct("prod-1", values as any);

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("prod-1");
      expect(mockUpdate).toHaveBeenCalledWith(values);
    });
  });
});
