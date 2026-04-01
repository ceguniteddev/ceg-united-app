import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockAdd = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockDocFn = vi.fn();

const mockDocRef: any = {
  get: mockGet,
  update: mockUpdate,
  delete: mockDelete,
  collection: vi.fn(),
};

const mockCollectionRef: any = {
  get: mockGet,
  add: mockAdd,
  where: mockWhere,
  orderBy: mockOrderBy,
  doc: mockDocFn,
};

mockWhere.mockReturnValue(mockCollectionRef);
mockOrderBy.mockReturnValue(mockCollectionRef);
mockDocFn.mockReturnValue(mockDocRef);
mockDocRef.collection.mockReturnValue(mockCollectionRef);

const mockDb = { collection: vi.fn().mockReturnValue(mockCollectionRef) };

const mockGetSignedUrl = vi
  .fn()
  .mockResolvedValue(["https://signed.example.com/file"]);
const mockBlob: any = {
  getSignedUrl: mockGetSignedUrl,
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
};
const mockBucket = { file: vi.fn().mockReturnValue(mockBlob) };

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
  storageAdmin: vi.fn(() => mockBucket),
  authenticationAdmin: vi.fn(),
}));

vi.mock("@/lib/date-parser", () => ({
  normalizeAllDates: vi.fn((x: any) => x),
}));

vi.mock("firebase-admin/firestore", () => ({
  Timestamp: {
    now: vi.fn(() => "mock-timestamp"),
    fromDate: vi.fn((d: any) => d),
  },
}));

vi.mock("@/service/educational-materials/chapter", () => ({
  getChaptersByCourseId: vi.fn().mockResolvedValue([]),
}));

import {
  recordCourseTitle,
  updateCourse,
  getCourseById,
  deleteCourse,
  getCourses,
  getPublishedCourseIds,
  recordCourseAttachment,
  getAttachmentsByCourseId,
  deleteCourseDocument,
} from "@/service/educational-materials/course";
import { getChaptersByCourseId } from "@/service/educational-materials/chapter";

function resetChain() {
  mockWhere.mockReturnValue(mockCollectionRef);
  mockOrderBy.mockReturnValue(mockCollectionRef);
  mockDocFn.mockReturnValue(mockDocRef);
  mockDocRef.collection.mockReturnValue(mockCollectionRef);
  mockDb.collection.mockReturnValue(mockCollectionRef);
}

describe("recordCourseTitle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    vi.mocked(getChaptersByCourseId).mockResolvedValue([]);
  });

  it("creates a course and returns id with data", async () => {
    const docData = { title: "My Course", createdAt: "mock-timestamp" };
    mockAdd.mockResolvedValueOnce({
      id: "new-course-id",
      get: vi.fn().mockResolvedValue({ data: () => docData }),
    });

    const result = await recordCourseTitle("My Course");

    expect(result.id).toBe("new-course-id");
    expect(result.title).toBe("My Course");
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: "My Course" }),
    );
  });

  it("passes createdAt timestamp when adding", async () => {
    mockAdd.mockResolvedValueOnce({
      id: "course-ts",
      get: vi
        .fn()
        .mockResolvedValue({
          data: () => ({ title: "T", createdAt: "mock-timestamp" }),
        }),
    });
    await recordCourseTitle("T");
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ createdAt: "mock-timestamp" }),
    );
  });
});

describe("updateCourse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("returns null when the course doc does not exist", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });

    const result = await updateCourse({
      id: "missing-id",
      data: { title: "New" },
    });

    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates and returns the updated course", async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ title: "Old Title" }),
      })
      .mockResolvedValueOnce({
        id: "course-1",
        data: () => ({ title: "New Title", updatedAt: "mock-timestamp" }),
      });
    mockUpdate.mockResolvedValueOnce(undefined);

    const result = await updateCourse({
      id: "course-1",
      data: { title: "New Title" },
    });

    expect(result).not.toBeNull();
    expect(result?.title).toBe("New Title");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Title",
        updatedAt: "mock-timestamp",
      }),
    );
  });
});

describe("deleteCourse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("deletes the course document", async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    await deleteCourse("course-id");

    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it("calls collection with COURSE and doc with the id", async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    await deleteCourse("my-course");

    expect(mockDocFn).toHaveBeenCalledWith("my-course");
  });
});

describe("getCourseById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    vi.mocked(getChaptersByCourseId).mockResolvedValue([]);
    mockGetSignedUrl.mockResolvedValue(["https://signed.example.com/file"]);
  });

  it("returns null when course does not exist", async () => {
    mockGet.mockResolvedValueOnce({ exists: false });

    const result = await getCourseById("nonexistent");

    expect(result).toBeNull();
  });

  it("returns course with signed image URL when found", async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        id: "course-id",
        data: () => ({
          title: "Test Course",
          imageUrl: "courses/img.jpg",
          isPublished: true,
        }),
      })
      .mockResolvedValueOnce({ empty: true, docs: [] }); // attachments query

    const result = await getCourseById("course-id");

    expect(result).not.toBeNull();
    expect(result?.imageUrl).toBe("https://signed.example.com/file");
    expect(result?.chapters).toEqual([]);
  });

  it("returns null imageUrl when course has no imageUrl", async () => {
    mockGet
      .mockResolvedValueOnce({
        exists: true,
        id: "course-2",
        data: () => ({ title: "No Image", imageUrl: null }),
      })
      .mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await getCourseById("course-2");

    expect(result?.imageUrl).toBeNull();
  });
});

describe("getCourses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    vi.mocked(getChaptersByCourseId).mockResolvedValue([]);
    mockGetSignedUrl.mockResolvedValue(["https://signed.example.com/file"]);
  });

  it("returns empty array when no courses exist", async () => {
    mockGet.mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await getCourses();

    expect(result).toEqual([]);
  });

  it("returns courses when they exist", async () => {
    mockGet
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "course-1",
            data: () => ({
              title: "Course 1",
              imageUrl: "courses/img.jpg",
              isPublished: true,
            }),
          },
        ],
      })
      .mockResolvedValueOnce({ empty: true, docs: [] }); // attachments for course-1

    const result = await getCourses();

    expect(result).toHaveLength(1);
    expect(result?.[0].id).toBe("course-1");
    expect(result?.[0].imageUrl).toBe("https://signed.example.com/file");
  });

  it("returns null when the query throws an error", async () => {
    mockOrderBy.mockReturnValue({
      get: vi.fn().mockRejectedValue(new Error("DB failure")),
    });

    const result = await getCourses();

    expect(result).toBeNull();
  });
});

describe("getPublishedCourseIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("returns ids of published courses", async () => {
    mockGet.mockResolvedValueOnce({
      docs: [{ id: "pub-1" }, { id: "pub-2" }],
    });

    const result = await getPublishedCourseIds();

    expect(result).toEqual(["pub-1", "pub-2"]);
  });

  it("returns empty array when no published courses", async () => {
    mockGet.mockResolvedValueOnce({ docs: [] });

    const result = await getPublishedCourseIds();

    expect(result).toEqual([]);
  });

  it("queries with isPublished == true filter", async () => {
    mockGet.mockResolvedValueOnce({ docs: [] });

    await getPublishedCourseIds();

    expect(mockWhere).toHaveBeenCalledWith("isPublished", "==", true);
  });
});

describe("recordCourseAttachment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it("adds attachment and returns it with id and data", async () => {
    const docData = {
      url: "courses/1/att.pdf",
      name: "att.pdf",
      courseId: "course-1",
      createdAt: "mock-timestamp",
    };
    mockAdd.mockResolvedValueOnce({
      id: "attachment-id",
      get: vi.fn().mockResolvedValue({ data: () => docData }),
    });

    const result = await recordCourseAttachment({
      url: "courses/1/att.pdf",
      name: "att.pdf",
      courseId: "course-1",
    });

    expect(result.id).toBe("attachment-id");
    expect(result.url).toBe("courses/1/att.pdf");
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "courses/1/att.pdf",
        name: "att.pdf",
        courseId: "course-1",
      }),
    );
  });
});

describe("getAttachmentsByCourseId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    mockGetSignedUrl.mockResolvedValue(["https://signed.example.com/file"]);
  });

  it("returns null when no attachments exist", async () => {
    mockGet.mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await getAttachmentsByCourseId("course-1");

    expect(result).toBeNull();
  });

  it("returns attachments with signed URLs when attachments exist", async () => {
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "att-1",
          data: () => ({
            url: "courses/1/file.pdf",
            name: "file.pdf",
            courseId: "course-1",
          }),
        },
      ],
    });

    const result = await getAttachmentsByCourseId("course-1");

    expect(result).toHaveLength(1);
    expect(result?.[0].id).toBe("att-1");
    expect(result?.[0].url).toBe("https://signed.example.com/file");
  });

  it("queries with courseId filter", async () => {
    mockGet.mockResolvedValueOnce({ empty: true, docs: [] });

    await getAttachmentsByCourseId("course-abc");

    expect(mockWhere).toHaveBeenCalledWith("courseId", "==", "course-abc");
  });
});

describe("deleteCourseDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBucket.file.mockReturnValue(mockBlob);
  });

  it("deletes the storage blob", async () => {
    mockBlob.delete.mockResolvedValueOnce(undefined);

    await deleteCourseDocument("courses/1/img.jpg");

    expect(mockBlob.delete).toHaveBeenCalledTimes(1);
    expect(mockBucket.file).toHaveBeenCalledWith("courses/1/img.jpg");
  });

  it("resolves without throwing on a 404 error", async () => {
    const notFoundError = Object.assign(new Error("Not Found"), { code: 404 });
    mockBlob.delete.mockRejectedValueOnce(notFoundError);

    await expect(
      deleteCourseDocument("courses/missing.jpg"),
    ).resolves.toBeUndefined();
  });

  it("re-throws non-404 storage errors", async () => {
    mockBlob.delete.mockRejectedValueOnce(new Error("Permission denied"));

    await expect(deleteCourseDocument("courses/1/img.jpg")).rejects.toThrow(
      "Permission denied",
    );
  });
});
