import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock objects (defined before vi.mock so factories can close over them) ────
const mockGet = vi.fn();
const mockSet = vi.fn().mockResolvedValue(undefined);
const mockUpdate = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn().mockResolvedValue(undefined);
const mockAdd = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

const mockDocRef: any = {
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
  collection: vi.fn(),
  create: vi.fn().mockResolvedValue(undefined),
  path: "user-funding-application/FUNDING-TEST-PATH",
};

const mockCollectionRef: any = {
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
// Support nested collection chains: docRef.collection(...).doc(...)
mockDocRef.collection.mockReturnValue(mockCollectionRef);

const mockBucket = {
  deleteFiles: vi.fn().mockResolvedValue(undefined),
};

const mockDb: any = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
  recursiveDelete: vi.fn().mockResolvedValue(undefined),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  storageAdmin: vi.fn(() => mockBucket),
}));
vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("@/service/user", () => ({ getUserById: vi.fn() }));
vi.mock("@/service/crs", () => ({
  getCRSReport: vi.fn(),
  generateCRSReport: vi.fn(),
  generateCRSReportBusiness: vi.fn(),
  getCRSBusinessProfile: vi.fn(),
  fundAnalysis: vi.fn(),
}));
vi.mock("@/service/documents", () => ({ uploadDocument: vi.fn() }));
vi.mock("@/schema/notes", () => ({
  noteSchema: {
    safeParse: vi.fn().mockReturnValue({ success: true, data: {} }),
  },
}));
vi.mock("firebase-admin/firestore", () => ({
  Timestamp: { now: vi.fn(() => "mock-ts") },
  Query: vi.fn(),
}));
vi.mock("node:crypto", () => ({
  randomBytes: vi.fn(() => Buffer.from("abcdef")),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import {
  getApplyFunding,
  getApplyFundingByReferenceNumber,
  deleteApplyFunding,
  updateApplicationStatus,
  addFundApplicationNotes,
  getFundApplicationNotes,
  getFundApplicationNote,
  updateFundApplicationNote,
  createReferenceId,
  getFundingApplications,
  updateApplyFunding,
} from "@/service/apply-funding";
import { noteSchema } from "@/schema/notes";
import { uploadDocument } from "@/service/documents";

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("service/apply-funding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc = vi.fn().mockReturnValue(mockDocRef);
    mockDocRef.collection = vi.fn().mockReturnValue(mockCollectionRef);
    mockDb.collection = vi.fn().mockReturnValue(mockCollectionRef);
    mockDb.recursiveDelete = vi.fn().mockResolvedValue(undefined);
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    mockBucket.deleteFiles.mockResolvedValue(undefined);
    mockDocRef.create.mockResolvedValue(undefined);
    vi.mocked(noteSchema.safeParse).mockReturnValue({
      success: true,
      data: {},
    } as any);
  });

  // ── getApplyFunding ───────────────────────────────────────────────────────
  describe("getApplyFunding", () => {
    it("returns null when no matching documents exist", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const result = await getApplyFunding("u1");

      expect(result).toBeNull();
    });

    it("queries by userId and returns apps sorted by appliedDate descending", async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: "ref1",
            data: () => ({ userId: "u1", appliedDate: "2024-01-01" }),
          },
          {
            id: "ref2",
            data: () => ({ userId: "u1", appliedDate: "2024-06-01" }),
          },
        ],
      });

      const result = await getApplyFunding("u1");

      expect(result).toHaveLength(2);
      // June (ref2) should come first in descending order
      expect(result![0].referenceNumber).toBe("ref2");
      expect(result![1].referenceNumber).toBe("ref1");
      expect(mockWhere).toHaveBeenCalledWith("userId", "==", "u1");
    });
  });

  // ── getApplyFundingByReferenceNumber ──────────────────────────────────────
  describe("getApplyFundingByReferenceNumber", () => {
    it("throws AppError when referenceNumber is empty", async () => {
      await expect(
        getApplyFundingByReferenceNumber({ referenceNumber: "" }),
      ).rejects.toThrow("Reference number is required.");
    });

    it("returns null when document does not exist", async () => {
      mockGet.mockResolvedValue({ exists: false });

      const result = await getApplyFundingByReferenceNumber({
        referenceNumber: "ref1",
      });

      expect(result).toBeNull();
    });

    it("returns funding application data with referenceNumber when found", async () => {
      mockGet.mockResolvedValue({
        id: "ref1",
        exists: true,
        data: () => ({ userId: "u1", status: "New" }),
      });

      const result = await getApplyFundingByReferenceNumber({
        referenceNumber: "ref1",
      });

      expect(result).not.toBeNull();
      expect(result!.referenceNumber).toBe("ref1");
      expect(result!.userId).toBe("u1");
    });
  });

  // ── deleteApplyFunding ────────────────────────────────────────────────────
  describe("deleteApplyFunding", () => {
    it("throws AppError when referenceNumber is empty", async () => {
      await expect(deleteApplyFunding("")).rejects.toThrow(
        "Reference number is required.",
      );
    });

    it("throws AppError when funding application is not found", async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(deleteApplyFunding("ref1")).rejects.toThrow(
        "Funding application not found.",
      );
    });

    it("throws AppError when application status is not New", async () => {
      mockGet.mockResolvedValue({
        id: "ref1",
        exists: true,
        data: () => ({ userId: "u1", status: "Processing" }),
      });

      await expect(deleteApplyFunding("ref1")).rejects.toThrow(
        "Funding application cannot be deleted.",
      );
    });

    it("calls recursiveDelete and storage deleteFiles on success", async () => {
      mockGet.mockResolvedValue({
        id: "ref1",
        exists: true,
        data: () => ({ userId: "u1", status: "New" }),
      });

      await deleteApplyFunding("ref1");

      expect(mockDb.recursiveDelete).toHaveBeenCalledWith(mockDocRef);
      expect(mockBucket.deleteFiles).toHaveBeenCalledWith({
        prefix: "documents/u1/ref1",
      });
    });
  });

  // ── updateApplicationStatus ───────────────────────────────────────────────
  describe("updateApplicationStatus", () => {
    it("throws AppError when application is not found", async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        updateApplicationStatus("ref1", "Processing"),
      ).rejects.toThrow("Funding application not found.");
    });

    it("calls update with new status when application exists", async () => {
      mockGet.mockResolvedValue({
        id: "ref1",
        exists: true,
        data: () => ({ userId: "u1", status: "New" }),
      });

      await updateApplicationStatus("ref1", "Processing");

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "Processing" }),
      );
    });

    it("includes approveOrDecline value when provided", async () => {
      mockGet.mockResolvedValue({
        id: "ref1",
        exists: true,
        data: () => ({ userId: "u1", status: "New" }),
      });

      await updateApplicationStatus("ref1", "Approved", {
        reason: "Good credit",
      } as any);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "Approved",
          approveOrDecline: { reason: "Good credit" },
        }),
      );
    });
  });

  // ── addFundApplicationNotes ───────────────────────────────────────────────
  describe("addFundApplicationNotes", () => {
    it("throws AppError when referenceNumber is empty", async () => {
      await expect(
        addFundApplicationNotes({ referenceNumber: "", notes: ["note1"] }),
      ).rejects.toThrow("Reference number is required.");
    });

    it("throws AppError when notes is missing", async () => {
      await expect(
        addFundApplicationNotes({
          referenceNumber: "ref1",
          notes: undefined as any,
        }),
      ).rejects.toThrow("Notes is required.");
    });

    it("sets notes subcollection document on success", async () => {
      mockGet.mockResolvedValue({
        id: "ref1",
        exists: true,
        data: () => ({ userId: "u1" }),
      });

      await addFundApplicationNotes({
        referenceNumber: "ref1",
        notes: ["note1", "note2"],
      });

      expect(mockSet).toHaveBeenCalledWith({ notes: ["note1", "note2"] });
    });
  });

  // ── getFundApplicationNotes ───────────────────────────────────────────────
  describe("getFundApplicationNotes", () => {
    it("throws AppError when referenceNumber is empty", async () => {
      await expect(getFundApplicationNotes("")).rejects.toThrow(
        "Reference number is required.",
      );
    });

    it("returns empty array when notes document does not exist", async () => {
      mockGet
        .mockResolvedValueOnce({ id: "ref1", exists: true, data: () => ({}) }) // getApplyFundingByReferenceNumber
        .mockResolvedValueOnce({ exists: false }); // notes doc

      const result = await getFundApplicationNotes("ref1");

      expect(result).toEqual([]);
    });

    it("returns notes array from the subcollection document", async () => {
      mockGet
        .mockResolvedValueOnce({ id: "ref1", exists: true, data: () => ({}) })
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ notes: ["note1", "note2"] }),
        });

      const result = await getFundApplicationNotes("ref1");

      expect(result).toEqual(["note1", "note2"]);
    });
  });

  // ── getFundApplicationNote ────────────────────────────────────────────────
  describe("getFundApplicationNote", () => {
    it("throws AppError when referenceNumber is empty", async () => {
      await expect(getFundApplicationNote("")).rejects.toThrow(
        "Reference number is required.",
      );
    });

    it("returns default empty state when note document does not exist", async () => {
      mockGet.mockResolvedValue({ exists: false });

      const result = await getFundApplicationNote("ref1");

      expect(result).toEqual({ description: "", comments: [] });
    });

    it("returns note with timestamps converted via toDate()", async () => {
      const mockDate = new Date("2024-01-15");
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          description: "Internal note",
          comments: [
            { text: "A comment", createdAt: { toDate: () => mockDate } },
          ],
        }),
      });

      const result = await getFundApplicationNote("ref1");

      expect(result.description).toBe("Internal note");
      expect(result.comments[0].createdAt).toBe(mockDate);
    });

    it("uses nested collection chain to find document", async () => {
      mockGet.mockResolvedValue({ exists: false });

      await getFundApplicationNote("ref1");

      // Verify the chain: db.collection(APP).doc(ref).collection('internalNotes').doc('main')
      expect(mockDocRef.collection).toHaveBeenCalledWith("internalNotes");
      expect(mockCollectionRef.doc).toHaveBeenCalledWith("main");
    });
  });

  // ── updateFundApplicationNote ─────────────────────────────────────────────
  describe("updateFundApplicationNote", () => {
    it("throws AppError when referenceNumber is empty", async () => {
      await expect(
        updateFundApplicationNote({ referenceNumber: "", note: {} as any }),
      ).rejects.toThrow("Reference number is required.");
    });

    it("throws AppError when schema validation fails", async () => {
      vi.mocked(noteSchema.safeParse).mockReturnValueOnce({
        success: false,
        error: { message: "Invalid note data" },
      } as any);

      await expect(
        updateFundApplicationNote({ referenceNumber: "ref1", note: {} as any }),
      ).rejects.toThrow("Invalid note data");
    });

    it("sets validated note document on success", async () => {
      const validNote = { description: "Test note", comments: [] };
      vi.mocked(noteSchema.safeParse).mockReturnValueOnce({
        success: true,
        data: validNote,
      } as any);

      await updateFundApplicationNote({
        referenceNumber: "ref1",
        note: validNote,
      });

      expect(mockSet).toHaveBeenCalledWith(validNote);
    });
  });

  // ── createReferenceId ─────────────────────────────────────────────────────
  describe("createReferenceId", () => {
    it("returns id matching FUNDING-YYYYMMDD-XXXXXXXX format and the doc path", async () => {
      mockDocRef.create.mockResolvedValue(undefined);

      const result = await createReferenceId();

      expect(result.id).toMatch(/^FUNDING-\d{8}-[A-Z2-9]{8}$/);
      expect(result.path).toBe(mockDocRef.path);
      expect(mockDocRef.create).toHaveBeenCalledTimes(1);
    });

    it("retries on already-exists collision (code 6) and succeeds on second attempt", async () => {
      mockDocRef.create
        .mockRejectedValueOnce({ code: 6 }) // first attempt: collision
        .mockResolvedValueOnce(undefined); // second attempt: success

      const result = await createReferenceId();

      expect(mockDocRef.create).toHaveBeenCalledTimes(2);
      expect(result.id).toMatch(/^FUNDING-\d{8}-[A-Z2-9]{8}$/);
    });

    it("retries on already-exists collision (string code) and succeeds", async () => {
      mockDocRef.create
        .mockRejectedValueOnce({ code: "already-exists" })
        .mockResolvedValueOnce(undefined);

      const result = await createReferenceId();

      expect(mockDocRef.create).toHaveBeenCalledTimes(2);
      expect(result.id).toMatch(/^FUNDING-\d{8}-[A-Z2-9]{8}$/);
    });

    it("propagates non-collision errors immediately", async () => {
      const dbError = new Error("Firestore unavailable");
      mockDocRef.create.mockRejectedValue(dbError);

      await expect(createReferenceId()).rejects.toThrow(
        "Firestore unavailable",
      );
    });
  });

  describe("getFundingApplications", () => {
    it("returns null when no matching docs", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });
      const result = await getFundingApplications({});
      expect(result).toBeNull();
    });
    it("returns null when users collection is empty", async () => {
      mockGet
        .mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: "d1",
              data: () => ({ userId: "u1", appliedDate: "2024-01-01" }),
            },
          ],
        })
        .mockResolvedValueOnce({ empty: true, docs: [] }); // users
      const result = await getFundingApplications({});
      expect(result).toBeNull();
    });
    it("returns applications with user data", async () => {
      mockGet
        .mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: "d1",
              data: () => ({ userId: "u1", appliedDate: "2024-01-01" }),
            },
          ],
        })
        .mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: "u1",
              data: () => ({ firstName: "John" }),
              forEach: undefined,
            },
          ],
          forEach: function (cb: any) {
            this.docs.forEach(cb);
          },
        });
      const result = await getFundingApplications({});
      expect(result).not.toBeNull();
    });
    it("applies userId filter when provided", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });
      await getFundingApplications({ userId: "u1" });
      expect(mockWhere).toHaveBeenCalledWith("userId", "==", "u1");
    });
    it("applies state filter when provided", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });
      await getFundingApplications({ state: "CA" });
      expect(mockWhere).toHaveBeenCalledWith("addressState", "==", "CA");
    });
  });

  describe("updateApplyFunding", () => {
    it("throws if referenceNumber is missing", async () => {
      await expect(updateApplyFunding({ value: {} as any })).rejects.toThrow(
        "Reference number is required",
      );
    });
    it("throws if document not found", async () => {
      mockGet.mockResolvedValue({ exists: false });
      await expect(
        updateApplyFunding({ value: { referenceNumber: "REF-001" } as any }),
      ).rejects.toThrow("Funding application not found");
    });
    it("updates document with merge on success", async () => {
      mockGet.mockResolvedValue({ exists: true });
      await updateApplyFunding({
        value: { referenceNumber: "REF-001", fundingType: "Personal" } as any,
      });
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ fundingType: "Personal" }),
        { merge: true },
      );
    });
    it("uploads bank statements when provided", async () => {
      mockGet.mockResolvedValue({ exists: true });
      vi.mocked(uploadDocument).mockResolvedValue({} as any);
      await updateApplyFunding({
        value: {
          referenceNumber: "REF-001",
          userId: "u1",
          bankStatements: [
            {
              name: "stmt.pdf",
              size: 100,
              type: "application/pdf",
              base64: "data:application/pdf;base64,AQID",
            },
          ],
        } as any,
      });
      expect(vi.mocked(uploadDocument)).toHaveBeenCalled();
    });
  });
});
