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

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/service/apply-funding", () => ({
  getApplyFundingByReferenceNumber: vi.fn(),
}));

vi.mock("@/service/user", () => ({
  getUserById: vi.fn(),
}));

vi.mock("@/service/bank-products", () => ({
  deleteFundMappingAnalysis: vi.fn(),
  getFundMappingAnalysis: vi.fn(),
}));

vi.mock("@/service/crs", () => ({
  fundAnalysis: vi.fn(),
}));

vi.mock("@/lib/n8n", () => ({
  deleteFundingAnalysis: vi.fn(),
  sendClientAnalysisN8N: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  Timestamp: {
    now: vi.fn(() => "mock-ts"),
  },
}));

vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));

import { getAnalysis, recordAnalysis } from "@/service/analysis";
import { getApplyFundingByReferenceNumber } from "@/service/apply-funding";
import { getUserById } from "@/service/user";
import AppError from "@/error/AppError";

describe("service/analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdd.mockResolvedValue({ id: "new-analysis-id" });
    mockGet.mockResolvedValue({ empty: true, docs: [] });
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockWhere.mockReturnValue(mockCollectionRef);
  });

  describe("getAnalysis", () => {
    it("throws AppError if funding application is not found", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue(
        null as any,
      );
      await expect(getAnalysis("REF-001")).rejects.toThrow(AppError);
    });

    it("throws AppError with correct message when funding app not found", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue(
        null as any,
      );
      await expect(getAnalysis("REF-001")).rejects.toThrow(
        "Funding application not found",
      );
    });

    it("returns null when the analysis subcollection is empty", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
        referenceNumber: "REF-001",
      } as any);
      mockGet.mockResolvedValue({ empty: true, docs: [] });
      const result = await getAnalysis("REF-001");
      expect(result).toBeNull();
    });

    it("returns array of analysis documents when they exist", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
        referenceNumber: "REF-002",
      } as any);
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: "a1",
            data: () => ({ analysis: "First analysis", userId: "u1" }),
          },
          {
            id: "a2",
            data: () => ({ analysis: "Second analysis", userId: "u1" }),
          },
        ],
      });
      const result = await getAnalysis("REF-002");
      expect(result).toHaveLength(2);
      expect(result![0]).toMatchObject({
        id: "a1",
        analysis: "First analysis",
      });
      expect(result![1]).toMatchObject({
        id: "a2",
        analysis: "Second analysis",
      });
    });

    it("orders the subcollection by createdAt desc", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
        referenceNumber: "REF-003",
      } as any);
      mockGet.mockResolvedValue({ empty: true, docs: [] });
      await getAnalysis("REF-003");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
    });
  });

  describe("recordAnalysis", () => {
    it("throws AppError when userId is empty", async () => {
      await expect(
        recordAnalysis("", "REF-001", "Some analysis"),
      ).rejects.toThrow(AppError);
    });

    it("throws AppError with 'User ID is required' when userId is empty", async () => {
      await expect(
        recordAnalysis("", "REF-001", "Some analysis"),
      ).rejects.toThrow("User ID is required");
    });

    it("throws AppError when referenceNumber is empty", async () => {
      await expect(
        recordAnalysis("user-1", "", "Some analysis"),
      ).rejects.toThrow(AppError);
    });

    it("throws AppError with 'Reference number is required' when referenceNumber is empty", async () => {
      await expect(
        recordAnalysis("user-1", "", "Some analysis"),
      ).rejects.toThrow("Reference number is required");
    });

    it("throws AppError when analysis string is empty", async () => {
      await expect(recordAnalysis("user-1", "REF-001", "")).rejects.toThrow(
        AppError,
      );
    });

    it("throws AppError with 'Analysis is required' when analysis is empty", async () => {
      await expect(recordAnalysis("user-1", "REF-001", "")).rejects.toThrow(
        "Analysis is required",
      );
    });

    it("throws AppError if funding application reference is not found", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue(
        null as any,
      );
      await expect(
        recordAnalysis("user-1", "UNKNOWN-REF", "Some analysis"),
      ).rejects.toThrow(AppError);
    });

    it("throws AppError if user is not found", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
        referenceNumber: "REF-001",
      } as any);
      vi.mocked(getUserById).mockResolvedValue(null as any);
      await expect(
        recordAnalysis("unknown-user", "REF-001", "Some analysis"),
      ).rejects.toThrow(AppError);
    });

    it("adds analysis document to subcollection on success", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
        referenceNumber: "REF-001",
      } as any);
      vi.mocked(getUserById).mockResolvedValue({
        id: "user-1",
        email: "u@test.com",
      } as any);
      await recordAnalysis("user-1", "REF-001", "Great analysis content");
      expect(mockAdd).toHaveBeenCalledOnce();
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          analysis: "Great analysis content",
          userId: "user-1",
        }),
      );
    });
  });
});
