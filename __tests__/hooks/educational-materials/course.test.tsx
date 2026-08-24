/// <reference types="vitest/globals" />

import { renderHook, waitFor, act } from "@testing-library/react";
import {
  useGetCourses,
  useGetUserCourses,
  useGetUserCoursesWithProgress,
  useGetCourseById,
  useCourseMutation,
  useEnrollUserInCourse,
} from "@/hooks/educational-materials/course";
import { createWrapper } from "../../utils/test-utils";

const toast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast,
}));

const { mockUser } = vi.hoisted(() => ({
  mockUser: { uid: "user-123" },
}));
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

global.fetch = vi.fn();

describe("educational-materials/course hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useGetCourses", () => {
    it("should fetch courses", async () => {
      const mockData = [{ id: "c1", title: "Course 1" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetCourses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.courses).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/courses");
    });

    it("should return empty array on failure", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useGetCourses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.courses).toEqual([]);
    });
  });

  describe("useGetUserCourses", () => {
    it("should fetch user courses", async () => {
      const mockData = [{ id: "c1", title: "User Course" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetUserCourses("u1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.courses).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1/courses");
    });
  });

  describe("useGetUserCoursesWithProgress", () => {
    it("should fetch courses with progress", async () => {
      const mockData = [{ id: "c1", title: "Course", progress: 50 }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetUserCoursesWithProgress("u1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.coursesWithProgress).toEqual(mockData);
    });
  });

  describe("useGetCourseById", () => {
    it("should fetch a course by id", async () => {
      const mockData = { id: "c1", title: "Course 1" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetCourseById("c1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.course).toEqual(mockData);
    });

    it("should not fetch when courseId is empty", async () => {
      renderHook(() => useGetCourseById(""), {
        wrapper: createWrapper(),
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useCourseMutation", () => {
    it("should create a course", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "new-course" }),
      });

      const { result } = renderHook(() => useCourseMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.createCourse({ title: "New Course" });

      expect(global.fetch).toHaveBeenCalledWith("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Course" }),
      });
    });

    it("should unpublish a course", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useCourseMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.unpublishCourse("c1");

      expect(global.fetch).toHaveBeenCalledWith("/api/courses/c1/unpublish", {
        method: "PATCH",
      });
    });

    it("should publish a course", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useCourseMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.publishCourse("c1");

      expect(global.fetch).toHaveBeenCalledWith("/api/courses/c1/publish", {
        method: "PATCH",
      });
    });

    it("should delete a course", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useCourseMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.deleteCourse("c1");

      expect(global.fetch).toHaveBeenCalledWith("/api/courses/c1", {
        method: "DELETE",
      });
    });
  });

  describe("useEnrollUserInCourse", () => {
    it("should enroll user in course", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useEnrollUserInCourse(), {
        wrapper: createWrapper(),
      });

      const response = await result.current.enrollUser({
        userId: "u1",
        courseId: "c1",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/u1/courses/c1/enroll",
        { method: "POST" },
      );
      expect(response).toEqual({ success: true });
    });
  });
});
