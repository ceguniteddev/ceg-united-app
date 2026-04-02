import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useGetDisputeLetters,
  useGetDisputeLetter,
  useCreateDisputeLetter,
  useUpdateDisputeLetter,
  useDeleteDisputeLetter,
  useSubmitLetterForReview,
} from "@/hooks/dispute-letter";
import { createWrapper } from "../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

global.fetch = vi.fn();

describe("dispute-letter hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useGetDisputeLetters", () => {
    it("should fetch dispute letters for current user", async () => {
      const mockData = [{ id: "1", title: "Letter 1" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetDisputeLetters(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/user-123/dispute-letter",
      );
    });

    it("should fetch dispute letters for specified user", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      renderHook(() => useGetDisputeLetters("other-user"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/user/other-user/dispute-letter",
        );
      });
    });
  });

  describe("useGetDisputeLetter", () => {
    it("should fetch a single dispute letter", async () => {
      const mockData = { id: "dl-1", title: "Dispute" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetDisputeLetter("dl-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });

    it("should not fetch when id is empty", async () => {
      renderHook(() => useGetDisputeLetter(""), {
        wrapper: createWrapper(),
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useCreateDisputeLetter", () => {
    it("should create a dispute letter successfully", async () => {
      const mockResponse = { id: "new-dl", title: "New Letter" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useCreateDisputeLetter(), {
        wrapper: createWrapper(),
      });

      const res = await result.current.mutateAsync({
        title: "New Letter",
      } as any);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/user-123/dispute-letter",
        expect.objectContaining({ method: "POST" }),
      );
      expect(toast.success).toHaveBeenCalledWith("Letter created successfully");
    });

    it("should handle creation error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ errors: "Validation failed" }),
      });

      const { result } = renderHook(() => useCreateDisputeLetter(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync({} as any);
      } catch (e) {
        // expected
      }

      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("useUpdateDisputeLetter", () => {
    it("should update a dispute letter", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "dl-1" }),
      });

      const { result } = renderHook(() => useUpdateDisputeLetter("dl-1"), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ title: "Updated" } as any);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/user-123/dispute-letter/dl-1",
        expect.objectContaining({ method: "PUT" }),
      );
      expect(toast.success).toHaveBeenCalledWith("Letter updated successfully");
    });
  });

  describe("useDeleteDisputeLetter", () => {
    it("should delete a dispute letter", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useDeleteDisputeLetter(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync("dl-1");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/user-123/dispute-letter/dl-1",
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(toast.success).toHaveBeenCalledWith("Letter deleted successfully");
    });
  });

  describe("useSubmitLetterForReview", () => {
    it("should submit letter for review", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "dl-1", status: "submitted" }),
      });

      const { result } = renderHook(() => useSubmitLetterForReview(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync("dl-1");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/user-123/dispute-letter/dl-1/submit",
        expect.objectContaining({ method: "POST" }),
      );
      expect(toast.success).toHaveBeenCalledWith("Letter submitted for review");
    });
  });
});
