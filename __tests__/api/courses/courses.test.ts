/**
 * Tests for:
 *   GET  /api/courses
 *   POST /api/courses
 *   GET  /api/courses/[courseId]
 *   PATCH /api/courses/[courseId]
 *   DELETE /api/courses/[courseId]
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
  authenticateRequest: vi.fn(),
  validateToken: vi.fn(),
  validateXIDToken: vi.fn(),
}));

vi.mock("@/service/educational-materials/course", () => ({
  getCourses: vi.fn(),
  recordCourseTitle: vi.fn(),
  getCourseById: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
}));

vi.mock("@/lib/mux", () => ({
  deleteMuxVideo: vi.fn(),
}));

// next/cache is not available in test env
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import {
  GET as listCourses,
  POST as createCourse,
} from "@/app/api/courses/route";
import {
  GET as getCourse,
  PATCH as patchCourse,
  DELETE as deleteCourse,
} from "@/app/api/courses/[courseId]/route";
import {
  getCourses,
  recordCourseTitle,
  getCourseById,
  updateCourse,
  deleteCourse as deleteCourseService,
} from "@/service/educational-materials/course";
import { deleteMuxVideo } from "@/lib/mux";

const params = (courseId: string) =>
  ({ params: Promise.resolve({ courseId }) }) as any;

// ---------------------------------------------------------------------------
// GET /api/courses
// ---------------------------------------------------------------------------
describe("GET /api/courses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return all courses on success", async () => {
    const mockCourses = [{ id: "c1", title: "Course 1" }];
    (getCourses as any).mockResolvedValue(mockCourses);

    const res = await listCourses();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockCourses);
  });

  it("should call getCourses once", async () => {
    (getCourses as any).mockResolvedValue([]);
    await listCourses();
    expect(getCourses).toHaveBeenCalledOnce();
  });

  it("should return 500 on service error", async () => {
    (getCourses as any).mockRejectedValue(new Error("DB error"));
    const res = await listCourses();
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/courses
// ---------------------------------------------------------------------------
describe("POST /api/courses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should create a course and return 201", async () => {
    const mockResponse = { id: "c1", title: "New Course" };
    (recordCourseTitle as any).mockResolvedValue(mockResponse);
    const req = new NextRequest("http://localhost/api/courses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "New Course" }),
    });
    const res = await createCourse(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual(mockResponse);
  });

  it("should call recordCourseTitle with the title", async () => {
    (recordCourseTitle as any).mockResolvedValue({});
    const req = new NextRequest("http://localhost/api/courses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Test Title" }),
    });
    await createCourse(req);
    expect(recordCourseTitle).toHaveBeenCalledWith("Test Title");
  });

  it("should return 500 on service error", async () => {
    (recordCourseTitle as any).mockRejectedValue(new Error("DB error"));
    const req = new NextRequest("http://localhost/api/courses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Title" }),
    });
    const res = await createCourse(req);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/courses/[courseId]
// ---------------------------------------------------------------------------
describe("GET /api/courses/[courseId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when courseId is missing", async () => {
    const req = new NextRequest("http://localhost/api/courses/c1");
    const res = await getCourse(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it("should return course on success", async () => {
    const mockCourse = { id: "c1", title: "My Course" };
    (getCourseById as any).mockResolvedValue(mockCourse);
    const req = new NextRequest("http://localhost/api/courses/c1");
    const res = await getCourse(req, params("c1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockCourse);
  });

  it("should return 500 on service error", async () => {
    (getCourseById as any).mockRejectedValue(new Error("DB error"));
    const req = new NextRequest("http://localhost/api/courses/c1");
    const res = await getCourse(req, params("c1"));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/courses/[courseId]
// ---------------------------------------------------------------------------
describe("PATCH /api/courses/[courseId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when courseId is missing", async () => {
    const req = new NextRequest("http://localhost/api/courses/c1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await patchCourse(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
  });

  it("should update course and return 200", async () => {
    const updatedCourse = { id: "c1", title: "Updated" };
    (updateCourse as any).mockResolvedValue(updatedCourse);
    const req = new NextRequest("http://localhost/api/courses/c1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await patchCourse(req, params("c1"));
    expect(updateCourse).toHaveBeenCalledWith({
      id: "c1",
      data: { title: "Updated" },
    });
    expect(res.status).toBe(200);
  });

  it("should return 500 on service error", async () => {
    (updateCourse as any).mockRejectedValue(new Error("DB error"));
    const req = new NextRequest("http://localhost/api/courses/c1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await patchCourse(req, params("c1"));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/courses/[courseId]
// ---------------------------------------------------------------------------
describe("DELETE /api/courses/[courseId]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return 400 when courseId is missing", async () => {
    const req = new NextRequest("http://localhost/api/courses/c1", {
      method: "DELETE",
    });
    const res = await deleteCourse(req, {
      params: Promise.resolve({}),
    } as any);
    expect(res.status).toBe(400);
  });

  it("should delete course and return 200", async () => {
    (getCourseById as any).mockResolvedValue({ id: "c1", chapters: [] });
    (deleteCourseService as any).mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost/api/courses/c1", {
      method: "DELETE",
    });
    const res = await deleteCourse(req, params("c1"));
    expect(deleteCourseService).toHaveBeenCalledWith("c1");
    expect(res.status).toBe(200);
  });

  it("should delete mux videos before deleting the course", async () => {
    (getCourseById as any).mockResolvedValue({
      id: "c1",
      chapters: [
        { muxData: { assetId: "asset-1" } },
        { muxData: { assetId: "asset-2" } },
      ],
    });
    (deleteCourseService as any).mockResolvedValue(undefined);
    (deleteMuxVideo as any).mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost/api/courses/c1", {
      method: "DELETE",
    });
    await deleteCourse(req, params("c1"));
    expect(deleteMuxVideo).toHaveBeenCalledWith("asset-1");
    expect(deleteMuxVideo).toHaveBeenCalledWith("asset-2");
  });

  it("should return 400 when course not found", async () => {
    (getCourseById as any).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/courses/c1", {
      method: "DELETE",
    });
    const res = await deleteCourse(req, params("c1"));
    expect(res.status).toBe(400);
  });

  it("should return 500 on unexpected error", async () => {
    (getCourseById as any).mockRejectedValue(new Error("DB error"));
    const req = new NextRequest("http://localhost/api/courses/c1", {
      method: "DELETE",
    });
    const res = await deleteCourse(req, params("c1"));
    expect(res.status).toBe(500);
  });
});
