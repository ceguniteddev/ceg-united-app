/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockAdd = vi.fn();
  const mockOrderBy = vi.fn();
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();

  const mockDocRef: any = {
    get: mockGet,
    set: mockSet,
    update: mockUpdate,
    delete: mockDelete,
    collection: vi.fn(),
    listCollections: vi.fn(),
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

  const mockDb = { collection: vi.fn().mockReturnValue(mockCollectionRef) };
  const mockTimestamp = {
    now: vi.fn(() => "mock-ts"),
    fromDate: vi.fn((d: any) => d),
  };

  return {
    mockGet,
    mockSet,
    mockUpdate,
    mockDelete,
    mockAdd,
    mockOrderBy,
    mockWhere,
    mockLimit,
    mockDocRef,
    mockCollectionRef,
    mockDb,
    mockTimestamp,
  };
});

const {
  mockGet,
  mockSet,
  mockUpdate,
  mockDelete,
  mockAdd,
  mockOrderBy,
  mockWhere,
  mockLimit,
  mockDocRef,
  mockCollectionRef,
  mockDb,
  mockTimestamp,
} = mocks;

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  authenticationAdmin: vi.fn(),
  storageAdmin: vi.fn(),
}));

vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));

vi.mock("firebase-admin/firestore", () => ({
  Timestamp: mockTimestamp,
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import {
  recordChapterTitle,
  updateCourseChapter,
  updateChapter,
  getChaptersByCourseId,
  getChapterById,
  deleteChapter,
  recordMuxData,
} from "@/service/educational-materials/chapter";

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeDocSnap = (exists: boolean, data: object = {}, id = "ch-1") => ({
  exists,
  id,
  data: () => (exists ? data : undefined),
});

describe("service/educational-materials/chapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.collection.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
  });

  // ── recordChapterTitle ────────────────────────────────────────────────────
  describe("recordChapterTitle", () => {
    it("adds a document and returns id + data", async () => {
      const addedDocRef = {
        id: "new-ch",
        get: vi
          .fn()
          .mockResolvedValue(
            makeDocSnap(
              true,
              { title: "Chapter 1", courseId: "c1", position: 1 },
              "new-ch",
            ),
          ),
      };
      mockAdd.mockResolvedValue(addedDocRef);

      const result = await recordChapterTitle({
        title: "Chapter 1",
        courseId: "c1",
        position: 1,
      });

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Chapter 1",
          courseId: "c1",
          position: 1,
          createdAt: expect.anything(),
        }),
      );
      expect(result).toEqual({
        id: "new-ch",
        title: "Chapter 1",
        courseId: "c1",
        position: 1,
      });
    });
  });

  // ── updateCourseChapter ───────────────────────────────────────────────────
  describe("updateCourseChapter", () => {
    it("returns null when document does not exist", async () => {
      mockGet.mockResolvedValue(makeDocSnap(false));

      const result = await updateCourseChapter({
        courseId: "c1",
        chapterId: "ch-1",
        data: { title: "New" },
      });

      expect(result).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("updates and returns the updated document", async () => {
      const updatedData = { title: "Updated", courseId: "c1" };
      // First get (existence check), then second get (after update)
      mockGet
        .mockResolvedValueOnce(makeDocSnap(true, { title: "Old" }))
        .mockResolvedValueOnce(makeDocSnap(true, updatedData, "ch-1"));
      mockUpdate.mockResolvedValue(undefined);

      const result = await updateCourseChapter({
        courseId: "c1",
        chapterId: "ch-1",
        data: { title: "Updated" },
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Updated",
          updatedAt: expect.anything(),
        }),
      );
      expect(result).toEqual({ id: "ch-1", ...updatedData });
    });
  });

  // ── updateChapter ─────────────────────────────────────────────────────────
  describe("updateChapter", () => {
    it("calls update with merged data and updatedAt timestamp", async () => {
      mockUpdate.mockResolvedValue(undefined);

      await updateChapter({
        courseId: "c1",
        id: "ch-1",
        data: { isPublished: true },
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublished: true,
          updatedAt: expect.anything(),
        }),
      );
    });
  });

  // ── getChaptersByCourseId ─────────────────────────────────────────────────
  describe("getChaptersByCourseId", () => {
    it("returns null when query is empty", async () => {
      mockGet.mockResolvedValue({ empty: true, docs: [] });

      const result = await getChaptersByCourseId("c1");

      expect(result).toBeNull();
    });

    it("returns mapped chapters when docs exist", async () => {
      mockGet.mockResolvedValue({
        empty: false,
        docs: [
          { id: "ch-1", data: () => ({ title: "Intro", position: 1 }) },
          { id: "ch-2", data: () => ({ title: "Advanced", position: 2 }) },
        ],
      });

      const result = await getChaptersByCourseId("c1");

      expect(result).toHaveLength(2);
      expect(result![0]).toEqual({ id: "ch-1", title: "Intro", position: 1 });
      expect(result![1]).toEqual({
        id: "ch-2",
        title: "Advanced",
        position: 2,
      });
    });
  });

  // ── getChapterById ────────────────────────────────────────────────────────
  describe("getChapterById", () => {
    it("returns null when document does not exist", async () => {
      mockGet.mockResolvedValue(makeDocSnap(false));

      const result = await getChapterById({
        courseId: "c1",
        chapterId: "ch-1",
      });

      expect(result).toBeNull();
    });

    it("returns chapter data when document exists", async () => {
      const data = { title: "Intro", courseId: "c1", position: 1 };
      mockGet.mockResolvedValue(makeDocSnap(true, data, "ch-1"));

      const result = await getChapterById({
        courseId: "c1",
        chapterId: "ch-1",
      });

      expect(result).toEqual({ id: "ch-1", ...data });
    });
  });

  // ── deleteChapter ─────────────────────────────────────────────────────────
  describe("deleteChapter", () => {
    it("calls delete on the correct document ref", async () => {
      mockDelete.mockResolvedValue(undefined);

      await deleteChapter("c1", "ch-1");

      expect(mockDb.collection).toHaveBeenCalledWith("course/c1/chapter");
      expect(mockCollectionRef.doc).toHaveBeenCalledWith("ch-1");
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  // ── recordMuxData ─────────────────────────────────────────────────────────
  describe("recordMuxData", () => {
    it("updates chapter doc with muxData and videoUrl", async () => {
      mockUpdate.mockResolvedValue(undefined);

      await recordMuxData({
        courseId: "c1",
        chapterId: "ch-1",
        assetId: "asset-123",
        playbackId: "play-456",
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          videoUrl: "https://stream.mux.com/play-456.m3u8",
          muxData: {
            assetId: "asset-123",
            playbackId: "play-456",
            chapterId: "ch-1",
            courseId: "c1",
          },
          updatedAt: expect.anything(),
        }),
      );
    });
  });
});
