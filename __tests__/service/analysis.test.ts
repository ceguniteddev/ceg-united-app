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
  getFundingAnalysisNewRegistrationFlow: vi.fn(),
  mapBankProductsN8nNewRegistration: vi.fn(),
  sendClientCongratsMessageN8NNewRegistration: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  Timestamp: {
    now: vi.fn(() => "mock-ts"),
  },
}));

vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));

import {
  getAnalysis,
  recordAnalysis,
  updateAnalysis,
  deleteAnalysis,
  refreshAnalysis,
  getCongrats,
  recordCongrats,
  updateCongrats,
  deleteCongrats,
  markCongratsAsRead,
  sendClientAnalysisData,
} from "@/service/analysis";
import { getApplyFundingByReferenceNumber } from "@/service/apply-funding";
import { getUserById } from "@/service/user";
import { getFundMappingAnalysis } from "@/service/bank-products";
import { fundAnalysis } from "@/service/crs";
import { deleteFundingAnalysis, sendClientAnalysisN8N } from "@/lib/n8n";
import AppError from "@/error/AppError";

const mockFetch = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal("fetch", mockFetch);
process.env.n8n_HOST = "https://n8n.example.com";

describe("service/analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
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

  describe("updateAnalysis", () => {
    it("throws if docId is empty", async () => {
      await expect(updateAnalysis("REF", "", "text")).rejects.toThrow(AppError);
    });
    it("updates the document", async () => {
      await updateAnalysis("REF", "doc-1", "updated");
      expect(mockUpdate).toHaveBeenCalledWith({ analysis: "updated" });
    });
  });

  describe("deleteAnalysis", () => {
    it("throws if docId is empty", async () => {
      await expect(deleteAnalysis("REF", "")).rejects.toThrow(AppError);
    });
    it("deletes the document", async () => {
      await deleteAnalysis("REF", "doc-1");
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("refreshAnalysis", () => {
    it("throws if funding app not found", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue(
        null as any,
      );
      await expect(refreshAnalysis("REF-001")).rejects.toThrow(AppError);
    });
    it("deletes existing analysis, calls fundAnalysis", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
        referenceNumber: "REF-001",
        userId: "u1",
      } as any);
      mockGet.mockResolvedValueOnce({ empty: true, docs: [] }); // getAnalysis subcollection
      vi.mocked(getFundMappingAnalysis).mockResolvedValue([] as any);
      vi.mocked(deleteFundingAnalysis).mockResolvedValue("webhook" as any);
      await refreshAnalysis("REF-001");
      expect(mockFetch).toHaveBeenCalled();
      expect(vi.mocked(fundAnalysis)).toHaveBeenCalledWith({
        referenceNumber: "REF-001",
        userId: "u1",
      });
    });
  });

  describe("getCongrats", () => {
    it("throws if app not found", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue(
        null as any,
      );
      await expect(getCongrats("REF")).rejects.toThrow(AppError);
    });
    it("returns null if empty", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
        referenceNumber: "REF",
      } as any);
      mockGet.mockResolvedValue({ empty: true, docs: [] });
      expect(await getCongrats("REF")).toBeNull();
    });
    it("returns congrats docs", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
        referenceNumber: "REF",
      } as any);
      mockGet.mockResolvedValue({
        empty: false,
        docs: [{ id: "c1", data: () => ({ message: "Congrats!" }) }],
      });
      const result = await getCongrats("REF");
      expect(result).toHaveLength(1);
      expect(result![0].message).toBe("Congrats!");
    });
  });

  describe("recordCongrats", () => {
    it("throws if userId is empty", async () => {
      await expect(recordCongrats("", "REF", "msg")).rejects.toThrow(AppError);
    });
    it("throws if referenceNumber is empty", async () => {
      await expect(recordCongrats("u1", "", "msg")).rejects.toThrow(AppError);
    });
    it("throws if message is empty", async () => {
      await expect(recordCongrats("u1", "REF", "")).rejects.toThrow(AppError);
    });
    it("throws if app not found", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue(
        null as any,
      );
      await expect(recordCongrats("u1", "REF", "msg")).rejects.toThrow(
        AppError,
      );
    });
    it("throws if user not found", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
        referenceNumber: "REF",
      } as any);
      vi.mocked(getUserById).mockResolvedValue(null as any);
      await expect(recordCongrats("u1", "REF", "msg")).rejects.toThrow(
        AppError,
      );
    });
    it("adds congrats document on success", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
        referenceNumber: "REF",
      } as any);
      vi.mocked(getUserById).mockResolvedValue({ id: "u1" } as any);
      await recordCongrats("u1", "REF", "Great job!");
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Great job!",
          userId: "u1",
          isRead: false,
        }),
      );
    });
  });

  describe("updateCongrats", () => {
    it("throws if docId is empty", async () => {
      await expect(updateCongrats("REF", "", "msg")).rejects.toThrow(AppError);
    });
    it("updates the message", async () => {
      await updateCongrats("REF", "doc-1", "updated msg");
      expect(mockUpdate).toHaveBeenCalledWith({ message: "updated msg" });
    });
  });

  describe("deleteCongrats", () => {
    it("throws if docId is empty", async () => {
      await expect(deleteCongrats("REF", "")).rejects.toThrow(AppError);
    });
    it("deletes the document", async () => {
      await deleteCongrats("REF", "doc-1");
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("markCongratsAsRead", () => {
    it("throws if docId is empty", async () => {
      await expect(markCongratsAsRead("REF", "")).rejects.toThrow(AppError);
    });
    it("updates isRead to true", async () => {
      await markCongratsAsRead("REF", "doc-1");
      expect(mockUpdate).toHaveBeenCalledWith({ isRead: true });
    });
  });

  describe("sendClientAnalysisData", () => {
    it("throws if app not found", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue(
        null as any,
      );
      await expect(sendClientAnalysisData("REF")).rejects.toThrow(AppError);
    });
    it("throws if user not found", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
        referenceNumber: "REF",
        userId: "u1",
      } as any);
      vi.mocked(getUserById).mockResolvedValue(null as any);
      await expect(sendClientAnalysisData("REF")).rejects.toThrow(AppError);
    });
    it("calls fetch on success", async () => {
      vi.mocked(getApplyFundingByReferenceNumber).mockResolvedValue({
        referenceNumber: "REF",
        userId: "u1",
      } as any);
      vi.mocked(getUserById).mockResolvedValue({
        id: "u1",
        email: "u@t.com",
      } as any);
      vi.mocked(sendClientAnalysisN8N).mockResolvedValue(
        "send-client-analysis",
      );
      await sendClientAnalysisData("REF");
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
