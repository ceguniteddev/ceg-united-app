import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useGetChapterById,
  useChapterMutation,
  useChapterProgress,
} from "@/hooks/educational-materials/chapter";
import { createWrapper } from "../../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/mux", () => ({
  updateChapterVideo: vi.fn(),
}));

global.fetch = vi.fn();

describe("educational-materials/chapter hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useGetChapterById", () => {
    it("should fetch chapter by id", async () => {
      const mockData = { id: "ch1", title: "Chapter 1" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(
        () => useGetChapterById({ courseId: "c1", chapterId: "ch1" }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.chapter).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/courses/c1/chapters/ch1");
    });

    it("should not fetch when courseId or chapterId is empty", async () => {
      renderHook(() => useGetChapterById({ courseId: "", chapterId: "" }), {
        wrapper: createWrapper(),
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useChapterMutation", () => {
    it("should create a chapter", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "new-ch" }),
      });

      const { result } = renderHook(() => useChapterMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.createChapter({
        courseId: "c1",
        title: "New Chapter",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/courses/c1/chapters",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ title: "New Chapter" }),
        }),
      );
    });

    it("should handle create chapter error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Course not found" }),
      });

      const { result } = renderHook(() => useChapterMutation(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.createChapter({
          courseId: "c1",
          title: "Fail",
        });
      } catch (e) {
        // expected
      }

      expect(toast.error).toHaveBeenCalled();
    });

    it("should reorder chapters", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useChapterMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.reorderChapters({
        courseId: "c1",
        list: [
          { id: "ch1", position: 0 },
          { id: "ch2", position: 1 },
        ],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/courses/c1/chapters/reorder",
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("should publish a chapter", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useChapterMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.publishChapter({
        courseId: "c1",
        chapterId: "ch1",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/courses/c1/chapters/ch1/publish",
        { method: "PATCH" },
      );
    });

    it("should delete a chapter", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useChapterMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.deleteChapter({
        courseId: "c1",
        chapterId: "ch1",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/courses/c1/chapters/ch1",
        { method: "DELETE" },
      );
    });
  });

  describe("useChapterProgress", () => {
    it("should update chapter progress", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useChapterProgress(), {
        wrapper: createWrapper(),
      });

      await result.current.updateProgress({
        userId: "u1",
        chapterId: "ch1",
        courseId: "c1",
        isCompleted: true,
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: "ch1",
          courseId: "c1",
          isCompleted: true,
        }),
      });
      expect(toast.success).toHaveBeenCalledWith("Chapter marked as complete!");
    });

    it("should not show toast when not completed", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useChapterProgress(), {
        wrapper: createWrapper(),
      });

      await result.current.updateProgress({
        userId: "u1",
        chapterId: "ch1",
        courseId: "c1",
        isCompleted: false,
      });

      expect(toast.success).not.toHaveBeenCalled();
    });
  });
});
