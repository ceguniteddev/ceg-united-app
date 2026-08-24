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

  const mockDocRef = {
    get: mockGet,
    set: mockSet,
    update: mockUpdate,
    delete: mockDelete,
    collection: vi.fn(),
    listCollections: vi.fn(),
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

  const mockBatch = {
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };
  const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollectionRef),
    batch: vi.fn().mockReturnValue(mockBatch),
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
    mockBatch,
    mockDb,
    Timestamp: { now: vi.fn(() => "mock-ts") },
    getCourseById: vi.fn(),
    getPublishedCourseIds: vi.fn(),
    getUserById: vi.fn(),
    getUserMembership: vi.fn(),
    getUserAddons: vi.fn(),
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
  mockBatch,
  mockDb,
  getCourseById,
  getPublishedCourseIds,
  getUserById,
  getUserMembership,
  getUserAddons,
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
  Timestamp: {
    now: vi.fn(() => "mock-ts"),
    fromDate: vi.fn((d: any) => d),
  },
}));
vi.mock("firebase-admin", () => ({
  firestore: {
    Timestamp: {
      now: vi.fn(() => "mock-ts"),
      fromDate: vi.fn((d: any) => d),
    },
  },
}));
vi.mock("@/service/educational-materials/course", () => ({
  getCourseById: mocks.getCourseById,
  getPublishedCourseIds: mocks.getPublishedCourseIds,
}));
vi.mock("@/service/user", () => ({ getUserById: mocks.getUserById }));
vi.mock("@/service/membership", () => ({
  getUserMembership: mocks.getUserMembership,
}));
vi.mock("@/service/addons", () => ({
  getUserAddons: mocks.getUserAddons,
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import {
  enrollUserInCourse,
  unenrollUserFromCourse,
  getUserCourseEnrollment,
  getUserCoursesWithProgress,
  updateCourseAccess,
  markChapterComplete,
  markChapterIncomplete,
  getUserProgressForCourse,
  updateCourseProgress,
} from "@/service/educational-materials/progress";

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeRef = () => ({
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
});

const makeDocSnap = (id: string, data: object) => ({
  id,
  ref: makeRef(),
  data: () => data,
});

const makeQuerySnap = (
  docs: ReturnType<typeof makeDocSnap>[],
  empty = false,
) => ({
  empty: empty || docs.length === 0,
  size: docs.length,
  docs,
});

describe("service/educational-materials/progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.collection.mockReturnValue(mockCollectionRef);
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
    mockWhere.mockReturnValue(mockCollectionRef);
    mockOrderBy.mockReturnValue(mockCollectionRef);
    mockLimit.mockReturnValue(mockCollectionRef);
    mockDb.batch.mockReturnValue(mockBatch);
  });

  // ── enrollUserInCourse ────────────────────────────────────────────────────
  describe("enrollUserInCourse", () => {
    it("returns existing enrollment when already enrolled", async () => {
      const existingData = {
        userId: "u1",
        courseId: "c1",
        progressPercentage: 50,
      };
      mockGet.mockResolvedValueOnce(
        makeQuerySnap([makeDocSnap("enroll-1", existingData)]),
      );

      const result = await enrollUserInCourse({ userId: "u1", courseId: "c1" });

      expect(mockAdd).not.toHaveBeenCalled();
      expect(result).toEqual({ id: "enroll-1", ...existingData });
    });

    it("creates new enrollment when course is free and published", async () => {
      // First get: empty enrollment check
      mockGet.mockResolvedValueOnce(makeQuerySnap([], true));
      mocks.getCourseById.mockResolvedValueOnce({
        id: "c1",
        isPublished: true,
        isFree: true,
      });

      const newEnrollmentData = {
        userId: "u1",
        courseId: "c1",
        progressPercentage: 0,
      };
      const addedRef = {
        id: "enroll-new",
        get: vi.fn().mockResolvedValue({
          id: "enroll-new",
          data: () => newEnrollmentData,
        }),
      };
      mockAdd.mockResolvedValue(addedRef);
      // course doc get for enrolledStudentsCount increment
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ enrolledStudentsCount: 5 }),
      });

      const result = await enrollUserInCourse({ userId: "u1", courseId: "c1" });

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "u1",
          courseId: "c1",
          progressPercentage: 0,
        }),
      );
      expect(result).toEqual({ id: "enroll-new", ...newEnrollmentData });
    });

    it("throws error when course is not found", async () => {
      mockGet.mockResolvedValueOnce(makeQuerySnap([], true));
      mocks.getCourseById.mockResolvedValueOnce(null);

      await expect(
        enrollUserInCourse({ userId: "u1", courseId: "c1" }),
      ).rejects.toThrow("Course not found");
    });

    it("throws error when course is not published", async () => {
      mockGet.mockResolvedValueOnce(makeQuerySnap([], true));
      mocks.getCourseById.mockResolvedValueOnce({
        id: "c1",
        isPublished: false,
        isFree: true,
      });

      await expect(
        enrollUserInCourse({ userId: "u1", courseId: "c1" }),
      ).rejects.toThrow("Course is not available");
    });

    it("throws error when course is paid and payment is not verified", async () => {
      mockGet.mockResolvedValueOnce(makeQuerySnap([], true));
      mocks.getCourseById.mockResolvedValueOnce({
        id: "c1",
        isPublished: true,
        isFree: false,
        price: 49.99,
      });

      await expect(
        enrollUserInCourse({ userId: "u1", courseId: "c1" }),
      ).rejects.toThrow(
        "This is a paid course and requires purchase before enrollment.",
      );
    });

    it("creates enrollment when course is paid and payment is verified", async () => {
      mockGet.mockResolvedValueOnce(makeQuerySnap([], true));
      mocks.getCourseById.mockResolvedValueOnce({
        id: "c1",
        isPublished: true,
        isFree: false,
        price: 49.99,
      });

      const newEnrollmentData = {
        userId: "u1",
        courseId: "c1",
        progressPercentage: 0,
      };
      const addedRef = {
        id: "enroll-new",
        get: vi.fn().mockResolvedValue({
          id: "enroll-new",
          data: () => newEnrollmentData,
        }),
      };
      mockAdd.mockResolvedValue(addedRef);
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ enrolledStudentsCount: 0 }),
      });

      const result = await enrollUserInCourse({
        userId: "u1",
        courseId: "c1",
        isPaymentVerified: true,
      });

      expect(result).toEqual({ id: "enroll-new", ...newEnrollmentData });
    });
  });

  // ── unenrollUserFromCourse ────────────────────────────────────────────────
  describe("unenrollUserFromCourse", () => {
    it("deletes enrollment and progress records via batch", async () => {
      const enrollmentDoc = makeDocSnap("enroll-1", {
        userId: "u1",
        courseId: "c1",
      });
      const chapterDoc = { id: "ch-1", data: () => ({}) };
      const progressDoc = makeDocSnap("prog-1", {
        userId: "u1",
        chapterId: "ch-1",
      });

      // enrollment query, chapters query, progress query
      mockGet
        .mockResolvedValueOnce({ empty: false, docs: [enrollmentDoc] }) // enrollment
        .mockResolvedValueOnce({ docs: [chapterDoc] }) // chapters
        .mockResolvedValueOnce({ docs: [progressDoc] }); // progress

      await unenrollUserFromCourse({ userId: "u1", courseId: "c1" });

      expect(enrollmentDoc.ref.delete).toHaveBeenCalled();
      expect(mockBatch.delete).toHaveBeenCalledWith(progressDoc.ref);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it("skips batch when no chapters found", async () => {
      const enrollmentDoc = makeDocSnap("enroll-1", {});
      mockGet
        .mockResolvedValueOnce({ empty: false, docs: [enrollmentDoc] })
        .mockResolvedValueOnce({ docs: [] }); // no chapters

      await unenrollUserFromCourse({ userId: "u1", courseId: "c1" });

      expect(mockBatch.commit).not.toHaveBeenCalled();
    });
  });

  // ── getUserCourseEnrollment ───────────────────────────────────────────────
  describe("getUserCourseEnrollment", () => {
    it("returns null when no enrollment found", async () => {
      mockGet.mockResolvedValue(makeQuerySnap([], true));

      const result = await getUserCourseEnrollment({
        userId: "u1",
        courseId: "c1",
      });

      expect(result).toBeNull();
    });

    it("returns enrollment when found", async () => {
      const data = { userId: "u1", courseId: "c1", progressPercentage: 25 };
      mockGet.mockResolvedValue(makeQuerySnap([makeDocSnap("enroll-1", data)]));

      const result = await getUserCourseEnrollment({
        userId: "u1",
        courseId: "c1",
      });

      expect(result).toEqual({ id: "enroll-1", ...data });
    });
  });

  // ── updateCourseAccess ────────────────────────────────────────────────────
  describe("updateCourseAccess", () => {
    it("updates lastAccessedAt on the enrollment document", async () => {
      const enrollmentDoc = makeDocSnap("enroll-1", {});
      mockGet.mockResolvedValue({ empty: false, docs: [enrollmentDoc] });

      await updateCourseAccess({ userId: "u1", courseId: "c1" });

      expect(enrollmentDoc.ref.update).toHaveBeenCalledWith({
        lastAccessedAt: expect.anything(),
      });
    });

    it("does nothing when no enrollment exists", async () => {
      mockGet.mockResolvedValue(makeQuerySnap([], true));

      await updateCourseAccess({ userId: "u1", courseId: "c1" });

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // ── markChapterComplete ───────────────────────────────────────────────────
  describe("markChapterComplete", () => {
    // updateCourseProgress runs internally — stub all subsequent Firestore calls to no-ops
    const stubUpdateCourseProgress = () => {
      // chapters (published), progress (completed), enrollment update
      mockGet.mockResolvedValueOnce({ size: 0, docs: [] }); // totalChapters = 0 → early return
    };

    it("updates existing progress record to completed", async () => {
      const progressData = {
        userId: "u1",
        chapterId: "ch-1",
        isCompleted: true,
      };
      const progressDoc = makeDocSnap("prog-1", progressData);
      progressDoc.ref.get = vi
        .fn()
        .mockResolvedValue({ id: "prog-1", data: () => progressData });

      // existingProgress check
      mockGet.mockResolvedValueOnce({ empty: false, docs: [progressDoc] });
      // updateCourseProgress: published chapters query returns 0 → early return
      mockGet.mockResolvedValueOnce({ size: 0, docs: [] });

      const result = await markChapterComplete({
        userId: "u1",
        chapterId: "ch-1",
        courseId: "c1",
      });

      expect(progressDoc.ref.update).toHaveBeenCalledWith({
        isCompleted: true,
        updatedAt: expect.anything(),
      });
      expect(result).toEqual({ id: "prog-1", ...progressData });
    });

    it("creates new progress record when none exists", async () => {
      // existingProgress empty
      mockGet.mockResolvedValueOnce(makeQuerySnap([], true));

      const newProgressData = {
        userId: "u1",
        chapterId: "ch-1",
        isCompleted: true,
      };
      const addedRef = {
        id: "prog-new",
        get: vi
          .fn()
          .mockResolvedValue({ id: "prog-new", data: () => newProgressData }),
      };
      mockAdd.mockResolvedValue(addedRef);

      // updateCourseProgress: 0 chapters → early return
      mockGet.mockResolvedValueOnce({ size: 0, docs: [] });

      const result = await markChapterComplete({
        userId: "u1",
        chapterId: "ch-1",
        courseId: "c1",
      });

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "u1",
          chapterId: "ch-1",
          isCompleted: true,
        }),
      );
      expect(result).toEqual({ id: "prog-new", ...newProgressData });
    });
  });

  // ── markChapterIncomplete ─────────────────────────────────────────────────
  describe("markChapterIncomplete", () => {
    it("throws 'Progress not found' when no progress record exists", async () => {
      mockGet.mockResolvedValue(makeQuerySnap([], true));

      await expect(
        markChapterIncomplete({
          userId: "u1",
          chapterId: "ch-1",
          courseId: "c1",
        }),
      ).rejects.toThrow("Progress not found");
    });

    it("updates existing progress to incomplete", async () => {
      const progressData = {
        userId: "u1",
        chapterId: "ch-1",
        isCompleted: false,
      };
      const progressDoc = makeDocSnap("prog-1", progressData);
      progressDoc.ref.get = vi
        .fn()
        .mockResolvedValue({ id: "prog-1", data: () => progressData });

      // existingProgress check
      mockGet.mockResolvedValueOnce({ empty: false, docs: [progressDoc] });
      // updateCourseProgress: 0 published chapters → early return
      mockGet.mockResolvedValueOnce({ size: 0, docs: [] });

      const result = await markChapterIncomplete({
        userId: "u1",
        chapterId: "ch-1",
        courseId: "c1",
      });

      expect(progressDoc.ref.update).toHaveBeenCalledWith({
        isCompleted: false,
        updatedAt: expect.anything(),
      });
      expect(result).toEqual({ id: "prog-1", ...progressData });
    });
  });

  // ── getUserProgressForCourse ──────────────────────────────────────────────
  describe("getUserProgressForCourse", () => {
    it("returns empty array when course has no chapters", async () => {
      mockGet.mockResolvedValueOnce({ docs: [] }); // chapters snapshot

      const result = await getUserProgressForCourse({
        userId: "u1",
        courseId: "c1",
      });

      expect(result).toEqual([]);
    });

    it("returns progress docs mapped with id", async () => {
      const chapterDocs = [{ id: "ch-1" }, { id: "ch-2" }];
      const progressData = {
        userId: "u1",
        chapterId: "ch-1",
        isCompleted: true,
      };

      mockGet
        .mockResolvedValueOnce({ docs: chapterDocs })
        .mockResolvedValueOnce({
          docs: [makeDocSnap("prog-1", progressData)],
        });

      const result = await getUserProgressForCourse({
        userId: "u1",
        courseId: "c1",
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: "prog-1", ...progressData });
    });
  });

  // ── updateCourseProgress ──────────────────────────────────────────────────
  describe("updateCourseProgress", () => {
    it("returns early when no published chapters exist", async () => {
      mockGet.mockResolvedValueOnce({ size: 0, docs: [] });

      await updateCourseProgress({ userId: "u1", courseId: "c1" });

      // Should not query progress or enrollment
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it("calculates percentage and updates enrollment", async () => {
      const enrollDoc = makeDocSnap("enroll-1", {});

      mockGet
        .mockResolvedValueOnce({
          size: 2,
          docs: [{ id: "ch-1" }, { id: "ch-2" }],
        }) // published chapters
        .mockResolvedValueOnce({ size: 1 }) // completed progress
        .mockResolvedValueOnce({ empty: false, docs: [enrollDoc] }); // enrollment

      await updateCourseProgress({ userId: "u1", courseId: "c1" });

      expect(enrollDoc.ref.update).toHaveBeenCalledWith(
        expect.objectContaining({
          progressPercentage: 50,
          lastAccessedAt: expect.anything(),
        }),
      );
    });

    it("sets completedAt when progress is 100%", async () => {
      const enrollDoc = makeDocSnap("enroll-1", {});

      mockGet
        .mockResolvedValueOnce({
          size: 2,
          docs: [{ id: "ch-1" }, { id: "ch-2" }],
        })
        .mockResolvedValueOnce({ size: 2 }) // all completed
        .mockResolvedValueOnce({ empty: false, docs: [enrollDoc] });

      await updateCourseProgress({ userId: "u1", courseId: "c1" });

      expect(enrollDoc.ref.update).toHaveBeenCalledWith(
        expect.objectContaining({
          progressPercentage: 100,
          completedAt: expect.anything(),
        }),
      );
    });
  });

  // ── getUserCoursesWithProgress ────────────────────────────────────────────
  describe("getUserCoursesWithProgress", () => {
    it("returns empty array when user has no enrollments", async () => {
      mockGet.mockResolvedValueOnce({ empty: true, docs: [] });

      const result = await getUserCoursesWithProgress("u1");

      expect(result).toEqual([]);
    });

    it("returns enrolled courses with progress for user", async () => {
      const enrollmentDoc = makeDocSnap("enroll-1", {
        userId: "u1",
        courseId: "c1",
        progressPercentage: 50,
      });
      mockGet
        .mockResolvedValueOnce({ empty: false, docs: [enrollmentDoc] }) // enrollments query
        .mockResolvedValueOnce({ docs: [{ id: "ch-1" }, { id: "ch-2" }] }) // course chapters
        .mockResolvedValueOnce({
          docs: [
            makeDocSnap("prog-1", {
              userId: "u1",
              chapterId: "ch-1",
              isCompleted: true,
            }),
          ],
        }); // user progress

      mocks.getCourseById.mockResolvedValueOnce({
        id: "c1",
        title: "Test Course",
        chapters: [{ id: "ch-1" }, { id: "ch-2" }],
      });

      const result = await getUserCoursesWithProgress("u1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("c1");
      expect(result[0].completedChapters).toBe(1);
      expect(result[0].totalChapters).toBe(2);
    });
  });
});
