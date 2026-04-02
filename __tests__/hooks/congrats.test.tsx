import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGetCongrats, useMarkCongratsAsRead } from "@/hooks/congrats";
import { createWrapper } from "../utils/test-utils";
import { toast } from "sonner";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock global fetch
global.fetch = vi.fn();

describe("congrats hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useGetCongrats", () => {
    it("should fetch congrats messages successfully", async () => {
      const mockData = [
        {
          id: "1",
          message: "Congrats!",
          userId: "user-123",
          isRead: false,
          createdAt: "2026-04-02",
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetCongrats("user-123"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.congratsMessages).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/user/user-123/congrats");
    });

    it("should throw an error if fetch fails", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const { result } = renderHook(() => useGetCongrats("user-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // TanStack query returns error state instead of throwing in component
      // but we didn't extract 'isError' or 'error' in the hook, it just throws internally
      // so congratsMessages will be undefined
      expect(result.current.congratsMessages).toBeUndefined();
    });

    it("should not fetch if userId is empty", async () => {
      const { result } = renderHook(() => useGetCongrats(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false); // isPending is true but isLoading is false when disabled
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useMarkCongratsAsRead", () => {
    it("should mark congrats as read successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useMarkCongratsAsRead(), {
        wrapper: createWrapper(),
      });

      let mutationPromise: Promise<any>;
      await waitFor(() => {
        mutationPromise = result.current.mutateAsync({
          userId: "user-123",
          docId: "doc-123",
        });
      });

      await expect(mutationPromise!).resolves.toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/user-123/congrats/doc-123",
        expect.objectContaining({
          method: "PUT",
        }),
      );
    });

    it("should call toast.error when mutation fails", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ errors: "Custom error message" }),
      });

      const { result } = renderHook(() => useMarkCongratsAsRead(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mutateAsync({
          userId: "user-123",
          docId: "doc-123",
        });
      } catch (e) {
        // Expected to throw
      }

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to mark message as read",
        {
          description: "Custom error message",
        },
      );
    });
  });
});
