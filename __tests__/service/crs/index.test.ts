import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock objects (defined before vi.mock so factories can close over them) ────
const mockGet = vi.fn();
const mockSet = vi.fn().mockResolvedValue(undefined);
const mockUpdate = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn().mockResolvedValue(undefined);

const mockDocRef: any = {
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
  collection: vi.fn(),
  listCollections: vi.fn().mockResolvedValue([]),
};

const mockCollectionRef: any = {
  doc: vi.fn().mockReturnValue(mockDocRef),
  get: mockGet,
  orderBy: vi.fn(),
  limit: vi.fn(),
};

// Support nested collection chains: docRef.collection(...).doc(...)
mockDocRef.collection.mockReturnValue(mockCollectionRef);

const mockBatch = {
  set: vi.fn(),
  delete: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
};

const mockDb: any = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
  batch: vi.fn().mockReturnValue(mockBatch),
};

const mockFetch = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal("fetch", mockFetch);
process.env.n8n_HOST = "https://n8n.example.com";

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
}));
vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn() }));
vi.mock("@/lib/n8n", () => ({
  generateCRSReportN8N: vi.fn().mockResolvedValue("webhook-1"),
  deleteCRSReportN8N: vi.fn().mockResolvedValue("webhook-2"),
  getFundingAnalysis: vi.fn().mockResolvedValue("webhook-3"),
  sendClientAnalysisN8N: vi.fn().mockResolvedValue("webhook-4"),
  sendClientCongratsMessageN8N: vi.fn().mockResolvedValue("webhook-5"),
}));
vi.mock("@/service/user", () => ({ getUserById: vi.fn() }));
vi.mock("@/service/business", () => ({ getBusiness: vi.fn() }));

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import {
  recordCRSReport,
  recordCRSBusinessProfile,
  recordCRSBusinessScore,
  getCRSReport,
  getCRSBusinessProfile,
  getCRSBusinessScore,
  deleteCRSReport,
  generateCRSReport,
  fundAnalysis,
} from "@/service/crs";
import { getUserById } from "@/service/user";

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("service/crs/index", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset collection/doc chain mocks
    mockCollectionRef.doc = vi.fn().mockReturnValue(mockDocRef);
    mockDocRef.collection = vi.fn().mockReturnValue(mockCollectionRef);
    mockDocRef.listCollections = vi.fn().mockResolvedValue([]);
    mockDb.collection = vi.fn().mockReturnValue(mockCollectionRef);
    mockDb.batch = vi.fn().mockReturnValue(mockBatch);

    // Reset defaults
    mockSet.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockFetch.mockResolvedValue({ ok: true });

    // Reset batch
    mockBatch.set.mockReset();
    mockBatch.delete.mockReset();
    mockBatch.commit.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── recordCRSReport ───────────────────────────────────────────────────────
  describe("recordCRSReport", () => {
    it("throws when userId is empty string", async () => {
      await expect(recordCRSReport("", "experian", {})).rejects.toThrow(
        "User ID is required.",
      );
    });

    it("throws when user is not found in the database", async () => {
      vi.mocked(getUserById).mockResolvedValue(null);

      await expect(recordCRSReport("u1", "experian", {})).rejects.toThrow(
        "User not found.",
      );
    });

    it("sets parent doc and subdoc on success (no old doc to rename)", async () => {
      vi.mocked(getUserById).mockResolvedValue({ id: "u1" } as any);
      // renameDocument checks old doc via get() — return not-exists to skip batch
      mockGet.mockResolvedValue({ exists: false });

      await recordCRSReport("u1", "experian", { score: 750 });

      // set() called twice: once for parent doc, once for the sub-doc
      expect(mockSet).toHaveBeenCalledTimes(2);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "u1" }),
        { merge: true },
      );
    });

    it("performs rename batch when old doc exists", async () => {
      vi.mocked(getUserById).mockResolvedValue({ id: "u1" } as any);
      // renameDocument gets old doc — return exists with data
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ userId: "u1", report: {} }),
      });

      await recordCRSReport("u1", "experian", { score: 800 });

      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.delete).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  // ── recordCRSBusinessProfile ──────────────────────────────────────────────
  describe("recordCRSBusinessProfile", () => {
    it("sets business profile document using businessId as the doc ID", async () => {
      await recordCRSBusinessProfile("u1", "biz-1", { score: 80 });

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("biz-1");
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "u1", businessId: "biz-1" }),
        { merge: true },
      );
    });
  });

  // ── recordCRSBusinessScore ────────────────────────────────────────────────
  describe("recordCRSBusinessScore", () => {
    it("sets business score document using businessId as the doc ID", async () => {
      await recordCRSBusinessScore("u1", "biz-1", { score: 70 });

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("biz-1");
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "u1", businessId: "biz-1" }),
        { merge: true },
      );
    });
  });

  // ── getCRSReport ──────────────────────────────────────────────────────────
  describe("getCRSReport", () => {
    it("returns null when parent CRS document does not exist", async () => {
      mockGet.mockResolvedValue({ exists: false });

      const result = await getCRSReport("u1");

      expect(result).toBeNull();
    });

    it("returns empty array when parent exists but has no matching subcollections", async () => {
      mockGet.mockResolvedValue({ exists: true });
      mockDocRef.listCollections.mockResolvedValue([]);

      const result = await getCRSReport("u1");

      expect(result).toEqual([]);
    });

    it("returns report docs from matching subcollections", async () => {
      mockGet.mockResolvedValue({ exists: true });

      const mockSubGet = vi.fn().mockResolvedValue({
        docs: [{ id: "experian-1", data: () => ({ score: 750 }) }],
      });
      const mockSubOrderBy = vi.fn().mockReturnValue({ get: mockSubGet });

      mockDocRef.listCollections.mockResolvedValue([
        { id: "experian", orderBy: mockSubOrderBy },
      ]);

      const result = await getCRSReport("u1");

      expect(result).toHaveLength(1);
      expect(result![0].type).toBe("experian");
      expect(result![0].id).toBe("experian-1");
    });

    it("applies limit(1) when isLatest is true", async () => {
      mockGet.mockResolvedValue({ exists: true });

      const mockSubGet = vi.fn().mockResolvedValue({ docs: [] });
      const mockSubLimit = vi.fn().mockReturnValue({ get: mockSubGet });
      const mockSubOrderBy = vi
        .fn()
        .mockReturnValue({ limit: mockSubLimit, get: mockSubGet });

      mockDocRef.listCollections.mockResolvedValue([
        { id: "experian", orderBy: mockSubOrderBy },
      ]);

      await getCRSReport("u1", true);

      expect(mockSubLimit).toHaveBeenCalledWith(1);
    });

    it("filters subcollections to only the requested reportTypes", async () => {
      mockGet.mockResolvedValue({ exists: true });

      const mockSubGet = vi.fn().mockResolvedValue({ docs: [] });
      const mockSubOrderBy = vi.fn().mockReturnValue({ get: mockSubGet });

      mockDocRef.listCollections.mockResolvedValue([
        { id: "experian", orderBy: mockSubOrderBy },
        { id: "issues", orderBy: mockSubOrderBy }, // not in default reportTypes
      ]);

      await getCRSReport("u1");

      // orderBy called once for "experian" (in default reportTypes), not for "issues"
      expect(mockSubOrderBy).toHaveBeenCalledTimes(1);
    });
  });

  // ── getCRSBusinessProfile ─────────────────────────────────────────────────
  describe("getCRSBusinessProfile", () => {
    it("returns null when business profile document does not exist", async () => {
      mockGet.mockResolvedValue({ exists: false });

      const result = await getCRSBusinessProfile("biz-1");

      expect(result).toBeNull();
    });

    it("returns profile data with businessId as id when document exists", async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ businessId: "biz-1", userId: "u1", score: 80 }),
      });

      const result = await getCRSBusinessProfile("biz-1");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("biz-1");
    });
  });

  // ── getCRSBusinessScore ───────────────────────────────────────────────────
  describe("getCRSBusinessScore", () => {
    it("returns null when business score document does not exist", async () => {
      mockGet.mockResolvedValue({ exists: false });

      const result = await getCRSBusinessScore("biz-1");

      expect(result).toBeNull();
    });

    it("returns score data with businessId as id when document exists", async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ businessId: "biz-1", userId: "u1", score: 70 }),
      });

      const result = await getCRSBusinessScore("biz-1");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("biz-1");
    });
  });

  // ── deleteCRSReport ───────────────────────────────────────────────────────
  describe("deleteCRSReport", () => {
    it("deletes the report document by reportId", async () => {
      await deleteCRSReport("report-1");

      expect(mockCollectionRef.doc).toHaveBeenCalledWith("report-1");
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });
  });

  // ── generateCRSReport ─────────────────────────────────────────────────────
  describe("generateCRSReport", () => {
    it("calls fetch to n8n webhook URL with correct payload", async () => {
      const promise = generateCRSReport({
        userId: "u1",
        referenceNumber: "r1",
        bureaus: { equifax: true, experian: false, transunion: false },
      });
      await vi.runAllTimersAsync();
      await promise;

      expect(mockFetch).toHaveBeenCalledWith(
        "https://n8n.example.com/webhook-1",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"userId":"u1"'),
        }),
      );
    });

    it("includes referenceNumber and type:personal in request body", async () => {
      const promise = generateCRSReport({
        userId: "u1",
        referenceNumber: "ref-123",
        bureaus: { equifax: true, experian: true, transunion: true },
      });
      await vi.runAllTimersAsync();
      await promise;

      const body = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(body.referenceNumber).toBe("ref-123");
      expect(body.type).toBe("personal");
    });
  });

  // ── fundAnalysis ──────────────────────────────────────────────────────────
  describe("fundAnalysis", () => {
    it("calls fetch to n8n funding analysis webhook URL", async () => {
      const promise = fundAnalysis({ referenceNumber: "r1", userId: "u1" });
      await vi.runAllTimersAsync();
      await promise;

      expect(mockFetch).toHaveBeenCalledWith(
        "https://n8n.example.com/webhook-3",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("includes referenceNumber and userId in request body", async () => {
      const promise = fundAnalysis({
        referenceNumber: "ref-456",
        userId: "u2",
      });
      await vi.runAllTimersAsync();
      await promise;

      const body = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(body.referenceNumber).toBe("ref-456");
      expect(body.userId).toBe("u2");
    });
  });
});
