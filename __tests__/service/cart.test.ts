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
  USER_CART_COLLECTION: "user-tradeline-cart",
}));

vi.mock("@/types/tradelines", () => ({}));

import { getUserCart, updateUserCart, clearUserCart } from "@/service/cart";

describe("service/cart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc = vi.fn().mockReturnValue(mockDocRef);
    mockDb.collection = vi.fn().mockReturnValue(mockCollectionRef);
  });

  describe("getUserCart", () => {
    it("returns items from cart when doc exists", async () => {
      const items = [{ tradelineId: "t1", quantity: 1 }];
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ items }),
      });

      const result = await getUserCart("user-123");

      expect(mockDb.collection).toHaveBeenCalledWith("user-tradeline-cart");
      expect(mockCollectionRef.doc).toHaveBeenCalledWith("user-123");
      expect(result).toEqual(items);
    });

    it("returns empty array when cart document does not exist", async () => {
      mockGet.mockResolvedValueOnce({ exists: false });

      const result = await getUserCart("user-123");

      expect(result).toEqual([]);
    });

    it("returns empty array when items field is missing from cart data", async () => {
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({}),
      });

      const result = await getUserCart("user-123");

      expect(result).toEqual([]);
    });
  });

  describe("updateUserCart", () => {
    it("sets items in cart with merge option and updatedAt", async () => {
      mockSet.mockResolvedValueOnce(undefined);
      const items = [{ tradelineId: "t1", quantity: 2 }];

      await updateUserCart("user-123", items as any);

      expect(mockDb.collection).toHaveBeenCalledWith("user-tradeline-cart");
      expect(mockCollectionRef.doc).toHaveBeenCalledWith("user-123");
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ items, updatedAt: expect.any(String) }),
        { merge: true },
      );
    });

    it("sets empty array when items is empty", async () => {
      mockSet.mockResolvedValueOnce(undefined);

      await updateUserCart("user-abc", []);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ items: [] }),
        { merge: true },
      );
    });
  });

  describe("clearUserCart", () => {
    it("deletes the user cart document", async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      await clearUserCart("user-123");

      expect(mockDb.collection).toHaveBeenCalledWith("user-tradeline-cart");
      expect(mockCollectionRef.doc).toHaveBeenCalledWith("user-123");
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
