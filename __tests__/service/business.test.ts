import { describe, it, expect, vi, beforeEach } from "vitest";

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

const mockDb = { collection: vi.fn().mockReturnValue(mockCollectionRef) };

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  authenticationAdmin: vi.fn(),
  storageAdmin: vi.fn(),
}));

vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
  normalizeDate: vi.fn((x: any) => x),
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  Timestamp: {
    now: vi.fn(() => "mock-timestamp"),
    fromDate: vi.fn((d: any) => d),
  },
}));

import {
  recordBusiness,
  updateBusiness,
  getBusiness,
  deleteBusiness,
  getBusinessById,
} from "@/service/business";
import AppError from "@/error/AppError";

const validBusiness = {
  businessName: "Acme Corp",
  businessStreetAddress: "123 Main St",
  businessCityAddress: "Springfield",
  businessStateAddress: "IL",
  businessPostalAddress: "62701",
  employerIdentificationNumber: "12-3456789",
  businessPhoneNumber: "555-000-1234",
  businessEmail: "contact@acme.com",
};

describe("service/business", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdd.mockResolvedValue({ id: "new-doc-id" });
    mockGet.mockResolvedValue({
      docs: [],
      empty: true,
      id: "doc-id",
      data: () => ({}),
    });
    mockUpdate.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
  });

  describe("recordBusiness", () => {
    it("creates a business and returns the document id", async () => {
      mockAdd.mockResolvedValue({ id: "abc123" });
      const id = await recordBusiness(validBusiness as any);
      expect(id).toBe("abc123");
      expect(mockAdd).toHaveBeenCalledOnce();
    });

    it("throws AppError when validation fails with empty object", async () => {
      await expect(recordBusiness({} as any)).rejects.toThrow(AppError);
    });

    it("throws AppError when required fields are missing", async () => {
      await expect(
        recordBusiness({ businessName: "Only Name" } as any),
      ).rejects.toThrow(AppError);
    });
  });

  describe("updateBusiness", () => {
    it("throws AppError if id is empty", async () => {
      await expect(updateBusiness("", validBusiness as any)).rejects.toThrow(
        AppError,
      );
    });

    it("calls doc.update with valid data", async () => {
      await updateBusiness("doc-1", validBusiness as any);
      expect(mockUpdate).toHaveBeenCalledOnce();
    });

    it("throws AppError when validation fails on update", async () => {
      await expect(updateBusiness("doc-1", {} as any)).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("getBusiness", () => {
    it("throws AppError if userId is empty", async () => {
      await expect(getBusiness("")).rejects.toThrow(AppError);
    });

    it("returns empty array when no businesses found", async () => {
      mockGet.mockResolvedValue({ docs: [] });
      const result = await getBusiness("user-1");
      expect(result).toEqual([]);
    });

    it("returns mapped business list with id", async () => {
      mockGet.mockResolvedValue({
        docs: [{ id: "b1", data: () => ({ businessName: "Acme" }) }],
      });
      const result = await getBusiness("user-1");
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: "b1", businessName: "Acme" });
    });

    it("queries with correct where and orderBy clauses", async () => {
      mockGet.mockResolvedValue({ docs: [] });
      await getBusiness("user-42");
      expect(mockWhere).toHaveBeenCalledWith("userId", "==", "user-42");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
    });
  });

  describe("deleteBusiness", () => {
    it("throws AppError if id is empty", async () => {
      await expect(deleteBusiness("")).rejects.toThrow(AppError);
    });

    it("throws AppError if business is linked to funding applications", async () => {
      mockGet.mockResolvedValue({ empty: false, docs: [{ id: "app-1" }] });
      await expect(deleteBusiness("biz-1")).rejects.toThrow(AppError);
    });

    it("throws AppError with correct message when linked apps exist", async () => {
      mockGet.mockResolvedValue({ empty: false, docs: [{ id: "app-1" }] });
      await expect(deleteBusiness("biz-1")).rejects.toThrow(
        "Cannot delete business",
      );
    });

    it("deletes the business document when no linked funding apps", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });
      await deleteBusiness("biz-1");
      expect(mockDelete).toHaveBeenCalledOnce();
    });

    it("checks for linked apps before deleting", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });
      await deleteBusiness("biz-2");
      expect(mockWhere).toHaveBeenCalledWith("businessId", "==", "biz-2");
      expect(mockLimit).toHaveBeenCalledWith(1);
    });
  });

  describe("getBusinessById", () => {
    it("throws AppError if id is empty", async () => {
      await expect(getBusinessById("")).rejects.toThrow(AppError);
    });

    it("returns business data by id", async () => {
      mockGet.mockResolvedValue({
        id: "b2",
        data: () => ({ businessName: "TestCo" }),
      });
      const result = await getBusinessById("b2");
      expect(result).toMatchObject({ id: "b2", businessName: "TestCo" });
    });
  });
});
