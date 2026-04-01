import { describe, it, expect } from "vitest";
import {
  MuxSchema,
  ChapterSchema,
  AttachmentSchema,
  courseSchema,
} from "@/schema/educational-materials/course";

describe("MuxSchema", () => {
  it("accepts valid object with required fields only", () => {
    const result = MuxSchema.safeParse({
      assetId: "asset-123",
      chapterId: "chapter-456",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all fields including optional id and playbackId", () => {
    const result = MuxSchema.safeParse({
      id: "mux-1",
      assetId: "asset-123",
      playbackId: "playback-789",
      chapterId: "chapter-456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing assetId", () => {
    expect(MuxSchema.safeParse({ chapterId: "chapter-456" }).success).toBe(
      false,
    );
  });

  it("rejects missing chapterId", () => {
    expect(MuxSchema.safeParse({ assetId: "asset-123" }).success).toBe(false);
  });

  it("rejects empty object", () => {
    expect(MuxSchema.safeParse({}).success).toBe(false);
  });
});

describe("ChapterSchema", () => {
  const now = new Date();
  const validChapter = {
    title: "Introduction",
    position: 1,
    courseId: "course-123",
    createdAt: now,
    updatedAt: now,
  };

  it("accepts a valid chapter with required fields", () => {
    expect(ChapterSchema.safeParse(validChapter).success).toBe(true);
  });

  it("defaults isPublished to false when omitted", () => {
    const result = ChapterSchema.safeParse(validChapter);
    if (result.success) {
      expect(result.data.isPublished).toBe(false);
    }
  });

  it("accepts isPublished: true", () => {
    const result = ChapterSchema.safeParse({
      ...validChapter,
      isPublished: true,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isPublished).toBe(true);
  });

  it("rejects non-integer position", () => {
    expect(
      ChapterSchema.safeParse({ ...validChapter, position: 1.5 }).success,
    ).toBe(false);
  });

  it("accepts position of 0", () => {
    expect(
      ChapterSchema.safeParse({ ...validChapter, position: 0 }).success,
    ).toBe(true);
  });

  it("rejects missing title", () => {
    const { title: _t, ...rest } = validChapter;
    expect(ChapterSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing position", () => {
    const { position: _p, ...rest } = validChapter;
    expect(ChapterSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing courseId", () => {
    const { courseId: _c, ...rest } = validChapter;
    expect(ChapterSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing createdAt", () => {
    const { createdAt: _cr, ...rest } = validChapter;
    expect(ChapterSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing updatedAt", () => {
    const { updatedAt: _u, ...rest } = validChapter;
    expect(ChapterSchema.safeParse(rest).success).toBe(false);
  });

  it("accepts optional description and videoUrl", () => {
    const result = ChapterSchema.safeParse({
      ...validChapter,
      description: "An intro chapter",
      videoUrl: "https://example.com/video.mp4",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional id", () => {
    expect(
      ChapterSchema.safeParse({ ...validChapter, id: "ch-001" }).success,
    ).toBe(true);
  });

  it("accepts optional muxData", () => {
    const result = ChapterSchema.safeParse({
      ...validChapter,
      muxData: { assetId: "a-1", chapterId: "course-123" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts null muxData", () => {
    expect(
      ChapterSchema.safeParse({ ...validChapter, muxData: null }).success,
    ).toBe(true);
  });
});

describe("AttachmentSchema", () => {
  const now = new Date();
  const validAttachment = {
    url: "https://storage.example.com/file.pdf",
    name: "document.pdf",
    courseId: "course-123",
    createdAt: now,
  };

  it("accepts a valid attachment", () => {
    expect(AttachmentSchema.safeParse(validAttachment).success).toBe(true);
  });

  it("accepts optional id", () => {
    expect(
      AttachmentSchema.safeParse({ ...validAttachment, id: "att-1" }).success,
    ).toBe(true);
  });

  it("rejects missing url", () => {
    const { url: _u, ...rest } = validAttachment;
    expect(AttachmentSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing name", () => {
    const { name: _n, ...rest } = validAttachment;
    expect(AttachmentSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing courseId", () => {
    const { courseId: _c, ...rest } = validAttachment;
    expect(AttachmentSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing createdAt", () => {
    const { createdAt: _cr, ...rest } = validAttachment;
    expect(AttachmentSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects empty object", () => {
    expect(AttachmentSchema.safeParse({}).success).toBe(false);
  });
});

describe("courseSchema", () => {
  const now = new Date();
  const validCourse = {
    title: "JavaScript Fundamentals",
    description: "Learn the basics of JavaScript",
    imageUrl: "courses/js-course/image.jpg",
    category: "Programming",
    createdAt: now,
    updatedAt: now,
  };

  it("accepts a valid course", () => {
    expect(courseSchema.safeParse(validCourse).success).toBe(true);
  });

  it("defaults isPublished to false when omitted", () => {
    const result = courseSchema.safeParse(validCourse);
    if (result.success) {
      expect(result.data.isPublished).toBe(false);
    }
  });

  it("accepts isPublished: true", () => {
    const result = courseSchema.safeParse({
      ...validCourse,
      isPublished: true,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isPublished).toBe(true);
  });

  it("rejects empty title", () => {
    expect(courseSchema.safeParse({ ...validCourse, title: "" }).success).toBe(
      false,
    );
  });

  it("rejects empty description", () => {
    expect(
      courseSchema.safeParse({ ...validCourse, description: "" }).success,
    ).toBe(false);
  });

  it("rejects empty imageUrl", () => {
    expect(
      courseSchema.safeParse({ ...validCourse, imageUrl: "" }).success,
    ).toBe(false);
  });

  it("rejects empty category", () => {
    expect(
      courseSchema.safeParse({ ...validCourse, category: "" }).success,
    ).toBe(false);
  });

  it("rejects missing title", () => {
    const { title: _t, ...rest } = validCourse;
    expect(courseSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing createdAt", () => {
    const { createdAt: _cr, ...rest } = validCourse;
    expect(courseSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing updatedAt", () => {
    const { updatedAt: _u, ...rest } = validCourse;
    expect(courseSchema.safeParse(rest).success).toBe(false);
  });

  it("accepts optional id", () => {
    expect(
      courseSchema.safeParse({ ...validCourse, id: "course-1" }).success,
    ).toBe(true);
  });

  it("accepts optional chapters array", () => {
    expect(
      courseSchema.safeParse({ ...validCourse, chapters: [] }).success,
    ).toBe(true);
  });

  it("accepts optional attachments array", () => {
    expect(
      courseSchema.safeParse({ ...validCourse, attachments: [] }).success,
    ).toBe(true);
  });

  it("accepts chapters with valid chapter objects", () => {
    const chapter = {
      title: "Chapter 1",
      position: 1,
      courseId: "course-1",
      createdAt: now,
      updatedAt: now,
    };
    const result = courseSchema.safeParse({
      ...validCourse,
      id: "course-1",
      chapters: [chapter],
    });
    expect(result.success).toBe(true);
  });

  it("accepts attachments with valid attachment objects", () => {
    const attachment = {
      url: "https://storage.example.com/file.pdf",
      name: "file.pdf",
      courseId: "course-1",
      createdAt: now,
    };
    const result = courseSchema.safeParse({
      ...validCourse,
      id: "course-1",
      attachments: [attachment],
    });
    expect(result.success).toBe(true);
  });
});
