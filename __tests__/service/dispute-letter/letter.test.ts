import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock objects (defined before vi.mock so factories can close over them) ────
const mockGet = vi.fn();
const mockSet = vi.fn().mockResolvedValue(undefined);
const mockUpdate = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn().mockResolvedValue(undefined);
const mockAdd = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();

const mockDocRef: any = {
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
};

const mockCollectionRef: any = {
  add: mockAdd,
  doc: vi.fn().mockReturnValue(mockDocRef),
  where: mockWhere,
  orderBy: mockOrderBy,
  get: mockGet,
};

mockWhere.mockReturnValue(mockCollectionRef);
mockOrderBy.mockReturnValue(mockCollectionRef);

const mockDb: any = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
};

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
}));
vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("@/lib/letterstream", () => ({
  sendLetter: vi.fn(),
  formatLetterHTML: vi.fn(),
}));
vi.mock("firebase-admin/firestore", () => ({
  Timestamp: { now: vi.fn(() => "mock-ts"), fromDate: vi.fn((d: any) => d) },
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import {
  createDisputeLetter,
  getDisputeLetters,
  getDisputeLetter,
  deleteDisputeLetter,
  submitLetterForReview,
  approveDisputeLetter,
  getDisputeTracking,
  addDisputeTrackingNote,
  getLettersPendingReview,
} from "@/service/dispute-letter/letter";

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("service/dispute-letter/letter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc = vi.fn().mockReturnValue(mockDocRef);
    mockDb.collection = vi.fn().mockReturnValue(mockCollectionRef);
    mockSet.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
  });

  // ── createDisputeLetter ───────────────────────────────────────────────────
  describe("createDisputeLetter", () => {
    it("adds to collection with default draft status and returns letter with id", async () => {
      mockAdd.mockResolvedValue(mockDocRef);
      mockGet.mockResolvedValue({
        id: "letter-1",
        exists: true,
        data: () => ({
          userId: "u1",
          status: "draft",
          disputeType: "late-payment",
        }),
      });

      const result = await createDisputeLetter({
        userId: "u1",
        disputeType: "late-payment" as any,
      } as any);

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "u1", status: "draft" }),
      );
      expect(result.id).toBe("letter-1");
    });

    it("preserves explicitly provided status when supplied", async () => {
      mockAdd.mockResolvedValue(mockDocRef);
      mockGet.mockResolvedValue({
        id: "letter-2",
        exists: true,
        data: () => ({ userId: "u1", status: "pending-review" }),
      });

      await createDisputeLetter({
        userId: "u1",
        status: "pending-review",
      } as any);

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending-review" }),
      );
    });
  });

  // ── getDisputeLetters ─────────────────────────────────────────────────────
  describe("getDisputeLetters", () => {
    it("returns empty array when no letters exist for user", async () => {
      mockGet.mockResolvedValue({ docs: [] });

      const result = await getDisputeLetters("u1");

      expect(result).toEqual([]);
    });

    it("returns mapped letters and queries with correct filters", async () => {
      mockGet.mockResolvedValue({
        docs: [
          { id: "l1", data: () => ({ userId: "u1", status: "draft" }) },
          {
            id: "l2",
            data: () => ({ userId: "u1", status: "pending-review" }),
          },
        ],
      });

      const result = await getDisputeLetters("u1");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("l1");
      expect(mockWhere).toHaveBeenCalledWith("userId", "==", "u1");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
    });
  });

  // ── getDisputeLetter ──────────────────────────────────────────────────────
  describe("getDisputeLetter", () => {
    it("returns null when document does not exist", async () => {
      mockGet.mockResolvedValue({ exists: false });

      const result = await getDisputeLetter("missing-id");

      expect(result).toBeNull();
    });

    it("returns letter data when document exists", async () => {
      mockGet.mockResolvedValue({
        id: "l1",
        exists: true,
        data: () => ({ userId: "u1", status: "draft" }),
      });

      const result = await getDisputeLetter("l1");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("l1");
    });
  });

  // ── deleteDisputeLetter ───────────────────────────────────────────────────
  describe("deleteDisputeLetter", () => {
    it("throws AppError when letter is not found", async () => {
      // getDisputeLetter calls db.collection(DISPUTE_LETTER).doc(id).get()
      mockGet.mockResolvedValueOnce({ exists: false });

      await expect(deleteDisputeLetter("l1")).rejects.toThrow(
        "Letter not found",
      );
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it("throws AppError when letter status prevents deletion (sent)", async () => {
      mockGet.mockResolvedValueOnce({
        id: "l1",
        exists: true,
        data: () => ({ status: "sent" }),
      });

      await expect(deleteDisputeLetter("l1")).rejects.toThrow(
        "Cannot delete letter that has been sent",
      );
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it("throws AppError when letter status prevents deletion (approved)", async () => {
      mockGet.mockResolvedValueOnce({
        id: "l1",
        exists: true,
        data: () => ({ status: "approved" }),
      });

      await expect(deleteDisputeLetter("l1")).rejects.toThrow(
        "Cannot delete letter that has been sent",
      );
    });

    it("deletes successfully when status is draft", async () => {
      mockGet.mockResolvedValueOnce({
        id: "l1",
        exists: true,
        data: () => ({ status: "draft" }),
      });

      await deleteDisputeLetter("l1");

      expect(mockDelete).toHaveBeenCalledTimes(1);
    });

    it("deletes successfully when status is pending-review", async () => {
      mockGet.mockResolvedValueOnce({
        id: "l1",
        exists: true,
        data: () => ({ status: "pending-review" }),
      });

      await deleteDisputeLetter("l1");

      expect(mockDelete).toHaveBeenCalledTimes(1);
    });
  });

  // ── submitLetterForReview ─────────────────────────────────────────────────
  describe("submitLetterForReview", () => {
    it("calls updateDisputeLetter with status pending-review", async () => {
      mockUpdate.mockResolvedValue(undefined);
      mockGet.mockResolvedValue({
        id: "l1",
        exists: true,
        data: () => ({ status: "pending-review" }),
      });

      const result = await submitLetterForReview("l1");

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending-review" }),
      );
      expect(result.id).toBe("l1");
    });
  });

  // ── approveDisputeLetter ──────────────────────────────────────────────────
  describe("approveDisputeLetter", () => {
    it("calls updateDisputeLetter with status approved and approvedBy", async () => {
      mockUpdate.mockResolvedValue(undefined);
      mockGet.mockResolvedValue({
        id: "l1",
        exists: true,
        data: () => ({ status: "approved", approvedBy: "admin-1" }),
      });

      const result = await approveDisputeLetter("l1", "admin-1");

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "approved", approvedBy: "admin-1" }),
      );
      expect(result.id).toBe("l1");
    });
  });

  // ── getDisputeTracking ────────────────────────────────────────────────────
  describe("getDisputeTracking", () => {
    it("returns dispute tracking records for a user", async () => {
      mockGet.mockResolvedValue({
        docs: [
          { id: "t1", data: () => ({ userId: "u1", status: "letter-sent" }) },
        ],
      });

      const result = await getDisputeTracking("u1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("t1");
      expect(mockWhere).toHaveBeenCalledWith("userId", "==", "u1");
    });

    it("returns empty array when no tracking records exist", async () => {
      mockGet.mockResolvedValue({ docs: [] });

      const result = await getDisputeTracking("u1");

      expect(result).toEqual([]);
    });
  });

  // ── addDisputeTrackingNote ────────────────────────────────────────────────
  describe("addDisputeTrackingNote", () => {
    it("throws AppError when tracking record is not found", async () => {
      // getDisputeTrackingById calls db.collection(DISPUTE_TRACKING).doc(id).get()
      mockGet.mockResolvedValueOnce({ exists: false });

      await expect(
        addDisputeTrackingNote("t1", "a note", "u1"),
      ).rejects.toThrow("Dispute tracking not found");
    });

    it("appends note and returns updated tracking record", async () => {
      // 1st get: getDisputeTrackingById returns existing tracking with empty notes
      mockGet.mockResolvedValueOnce({
        id: "t1",
        exists: true,
        data: () => ({ userId: "u1", notes: [] }),
      });
      // 2nd get: updateDisputeTracking fetches updated doc after update()
      mockGet.mockResolvedValueOnce({
        id: "t1",
        exists: true,
        data: () => ({
          userId: "u1",
          notes: [{ note: "a note", createdBy: "u1" }],
        }),
      });

      const result = await addDisputeTrackingNote("t1", "a note", "u1");

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: expect.arrayContaining([
            expect.objectContaining({ note: "a note", createdBy: "u1" }),
          ]),
        }),
      );
      expect(result.id).toBe("t1");
    });

    it("preserves existing notes when appending", async () => {
      const existingNote = {
        note: "old note",
        createdBy: "admin",
        createdAt: new Date(),
      };

      mockGet.mockResolvedValueOnce({
        id: "t1",
        exists: true,
        data: () => ({ userId: "u1", notes: [existingNote] }),
      });
      mockGet.mockResolvedValueOnce({
        id: "t1",
        exists: true,
        data: () => ({
          userId: "u1",
          notes: [existingNote, { note: "new note", createdBy: "u1" }],
        }),
      });

      await addDisputeTrackingNote("t1", "new note", "u1");

      // update should be called with both old and new note
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: expect.arrayContaining([
            existingNote,
            expect.objectContaining({ note: "new note", createdBy: "u1" }),
          ]),
        }),
      );
    });
  });

  // ── getLettersPendingReview ───────────────────────────────────────────────
  describe("getLettersPendingReview", () => {
    it("returns letters with pending-review status ordered by createdAt asc", async () => {
      mockGet.mockResolvedValue({
        docs: [
          {
            id: "l1",
            data: () => ({ status: "pending-review", userId: "u1" }),
          },
          {
            id: "l2",
            data: () => ({ status: "pending-review", userId: "u2" }),
          },
        ],
      });

      const result = await getLettersPendingReview();

      expect(result).toHaveLength(2);
      expect(mockWhere).toHaveBeenCalledWith("status", "==", "pending-review");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "asc");
    });

    it("returns empty array when no letters are pending review", async () => {
      mockGet.mockResolvedValue({ docs: [] });

      const result = await getLettersPendingReview();

      expect(result).toEqual([]);
    });
  });
});
