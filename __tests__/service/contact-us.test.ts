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
  REQUEST_CUSTOMER_CALL: "user-request-call",
}));

vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((data) => data),
}));

vi.mock("@/schema", () => ({}));

import {
  recordRequestCustomerCall,
  updateRequestCustomerCall,
  getRequestsCustomerCall,
  getRequestsCustomerCallIsOpen,
} from "@/service/contact-us";

describe("service/contact-us", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc = vi.fn().mockReturnValue(mockDocRef);
    mockDb.collection = vi.fn().mockReturnValue(mockCollectionRef);
  });

  describe("recordRequestCustomerCall", () => {
    it("adds a document with userId, data, and createdAt", async () => {
      mockAdd.mockResolvedValueOnce({ id: "new-call-id" });

      const data = { name: "John Doe", phone: "555-1234", status: "Open" };
      await recordRequestCustomerCall("user-123", data as any);

      expect(mockDb.collection).toHaveBeenCalledWith("user-request-call");
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          name: "John Doe",
          phone: "555-1234",
          status: "Open",
          createdAt: expect.any(Date),
        }),
      );
    });
  });

  describe("updateRequestCustomerCall", () => {
    it("updates the document by id with provided data", async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      const data = { status: "Closed" };
      await updateRequestCustomerCall("call-id-1", data as any);

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("call-id-1");
      expect(mockUpdate).toHaveBeenCalledWith(data);
    });
  });

  describe("getRequestsCustomerCall", () => {
    it("returns all calls ordered by createdAt desc with normalized dates", async () => {
      const docs = [
        {
          id: "call-1",
          data: () => ({ status: "Open", createdAt: new Date() }),
        },
        {
          id: "call-2",
          data: () => ({ status: "Closed", createdAt: new Date() }),
        },
      ];
      mockGet.mockResolvedValueOnce({ docs });

      const result = await getRequestsCustomerCall();

      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: "call-1", status: "Open" });
      expect(result[1]).toMatchObject({ id: "call-2", status: "Closed" });
    });

    it("returns empty array when no calls exist", async () => {
      mockGet.mockResolvedValueOnce({ docs: [] });

      const result = await getRequestsCustomerCall();

      expect(result).toEqual([]);
    });
  });

  describe("getRequestsCustomerCallIsOpen", () => {
    it("filters by status Open and returns results", async () => {
      const docs = [
        { id: "call-3", data: () => ({ status: "Open", name: "Jane" }) },
      ];
      mockGet.mockResolvedValueOnce({ docs });

      const result = await getRequestsCustomerCallIsOpen();

      expect(mockWhere).toHaveBeenCalledWith("status", "==", "Open");
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: "call-3", status: "Open" });
    });

    it("returns empty array when no open calls exist", async () => {
      mockGet.mockResolvedValueOnce({ docs: [] });

      const result = await getRequestsCustomerCallIsOpen();

      expect(result).toEqual([]);
    });
  });
});
