import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useSpecialDeals,
  useActiveSpecialDeals,
  useCreateSpecialDeal,
  useUpdateSpecialDeal,
  useToggleSpecialDeal,
  useDeleteSpecialDeal,
} from "@/hooks/special-deals";
import { createWrapper } from "../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

global.fetch = vi.fn();

describe("special-deals hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useSpecialDeals", () => {
    it("should fetch all special deals", async () => {
      const mockData = [{ id: "d1", title: "Deal 1" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useSpecialDeals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/special-deals");
    });
  });

  describe("useActiveSpecialDeals", () => {
    it("should fetch active special deals", async () => {
      const mockData = [{ id: "d2", title: "Active Deal" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useActiveSpecialDeals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/special-deals?activeOnly=true",
      );
    });
  });

  describe("useCreateSpecialDeal", () => {
    it("should create a special deal", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "new-deal" }),
      });

      const { result } = renderHook(() => useCreateSpecialDeal(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ title: "New Deal" } as any);

      expect(global.fetch).toHaveBeenCalledWith("/api/special-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Deal" }),
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Special deal created successfully",
      );
    });
  });

  describe("useUpdateSpecialDeal", () => {
    it("should update a special deal", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "d1" }),
      });

      const { result } = renderHook(() => useUpdateSpecialDeal(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        dealId: "d1",
        data: { title: "Updated" } as any,
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/special-deals/d1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated" }),
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Special deal updated successfully",
      );
    });
  });

  describe("useToggleSpecialDeal", () => {
    it("should toggle deal active status", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useToggleSpecialDeal(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ dealId: "d1", isActive: true });

      expect(global.fetch).toHaveBeenCalledWith("/api/special-deals/d1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleActive", isActive: true }),
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Special deal activated successfully",
      );
    });

    it("should show deactivated message when isActive is false", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useToggleSpecialDeal(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ dealId: "d1", isActive: false });

      expect(toast.success).toHaveBeenCalledWith(
        "Special deal deactivated successfully",
      );
    });
  });

  describe("useDeleteSpecialDeal", () => {
    it("should delete a special deal", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useDeleteSpecialDeal(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync("d1");

      expect(global.fetch).toHaveBeenCalledWith("/api/special-deals/d1", {
        method: "DELETE",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Special deal deleted successfully",
      );
    });
  });
});
