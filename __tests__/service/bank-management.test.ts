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
  BANK_MANAGEMENT_COLLECTION: "bank-management",
}));

vi.mock("@/schema/bank-management", () => ({}));

import {
  createBank,
  getBanks,
  updateBank,
  deleteBank,
} from "@/service/bank-management";

describe("service/bank-management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc = vi.fn().mockReturnValue(mockDocRef);
    mockDb.collection = vi.fn().mockReturnValue(mockCollectionRef);
  });

  describe("createBank", () => {
    it("strips id from data and adds to collection, returns id merged with saveData", async () => {
      const refId = "bank-ref-1";
      mockAdd.mockResolvedValueOnce({ id: refId });

      const data = {
        id: "ignored-id",
        bankName: "First National",
        routingNumber: "123456789",
      };
      const result = await createBank(data as any);

      expect(mockDb.collection).toHaveBeenCalledWith("bank-management");
      // id field should be stripped from what is added
      expect(mockAdd).toHaveBeenCalledWith(
        expect.not.objectContaining({ id: "ignored-id" }),
      );
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          bankName: "First National",
          routingNumber: "123456789",
        }),
      );
      expect(result).toEqual({
        id: refId,
        bankName: "First National",
        routingNumber: "123456789",
      });
    });

    it("works when data has no id field", async () => {
      mockAdd.mockResolvedValueOnce({ id: "bank-2" });

      const data = { bankName: "Second Bank" };
      const result = await createBank(data as any);

      expect(result.id).toBe("bank-2");
      expect(result.bankName).toBe("Second Bank");
    });
  });

  describe("getBanks", () => {
    it("returns banks ordered by bankName asc", async () => {
      const docs = [
        { id: "b1", data: () => ({ bankName: "Alpha Bank" }) },
        { id: "b2", data: () => ({ bankName: "Beta Bank" }) },
      ];
      mockGet.mockResolvedValueOnce({ docs });

      const result = await getBanks();

      expect(mockOrderBy).toHaveBeenCalledWith("bankName", "asc");
      expect(result).toEqual([
        { id: "b1", bankName: "Alpha Bank" },
        { id: "b2", bankName: "Beta Bank" },
      ]);
    });

    it("returns empty array when no banks exist", async () => {
      mockGet.mockResolvedValueOnce({ docs: [] });

      const result = await getBanks();

      expect(result).toEqual([]);
    });
  });

  describe("updateBank", () => {
    it("strips id from data and updates the document", async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      const data = { id: "should-be-stripped", bankName: "Updated Bank" };
      await updateBank("bank-1", data as any);

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("bank-1");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.not.objectContaining({ id: expect.anything() }),
      );
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ bankName: "Updated Bank" }),
      );
    });

    it("updates document when data has no id field", async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      await updateBank("bank-2", { bankName: "New Name" } as any);

      expect(mockUpdate).toHaveBeenCalledWith({ bankName: "New Name" });
    });
  });

  describe("deleteBank", () => {
    it("deletes the bank document by id", async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      await deleteBank("bank-1");

      expect(mockDb.collection).toHaveBeenCalledWith("bank-management");
      expect(mockCollectionRef.doc).toHaveBeenCalledWith("bank-1");
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
