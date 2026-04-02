import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useMarkupPercentage,
  useSetMarkupPercentage,
  useUserRecentTradelines,
  useUserTradelines,
  useAllPurchasedTradelines,
  useUpdateTradelineStatus,
  usePendingTradelinesCount,
} from "@/hooks/tradelines";
import { createWrapper } from "../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

vi.mock("@/service/tradelines", () => ({
  getMarkupPercentage: vi.fn(),
  setMarkupPercentage: vi.fn(),
  getUserRecentTradelines: vi.fn(),
  getUserTradelines: vi.fn(),
  getAllPurchasedTradelines: vi.fn(),
  updateTradelineStatus: vi.fn(),
  getPendingTradelinesCount: vi.fn(),
}));

import {
  getMarkupPercentage,
  setMarkupPercentage,
  getUserRecentTradelines,
  getUserTradelines,
  getAllPurchasedTradelines,
  updateTradelineStatus,
  getPendingTradelinesCount,
} from "@/service/tradelines";

describe("tradelines hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMarkupPercentage", () => {
    it("should fetch markup percentage", async () => {
      (getMarkupPercentage as any).mockResolvedValueOnce(15);

      const { result } = renderHook(() => useMarkupPercentage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.markupPercentage).toBe(15);
    });

    it("should default to 0 when no data", async () => {
      (getMarkupPercentage as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useMarkupPercentage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.markupPercentage).toBe(0);
    });
  });

  describe("useSetMarkupPercentage", () => {
    it("should save markup percentage", async () => {
      (setMarkupPercentage as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useSetMarkupPercentage(), {
        wrapper: createWrapper(),
      });

      await result.current.saveMarkup(20);

      expect(setMarkupPercentage).toHaveBeenCalledWith(20);
      expect(toast.success).toHaveBeenCalledWith("Markup percentage saved.");
    });

    it("should handle save failure", async () => {
      (setMarkupPercentage as any).mockRejectedValueOnce(new Error("Failed"));

      const { result } = renderHook(() => useSetMarkupPercentage(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.saveMarkup(20);
      } catch (e) {
        // expected
      }

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to save markup percentage.",
      );
    });
  });

  describe("useUserRecentTradelines", () => {
    it("should fetch recent tradelines for user", async () => {
      const mockData = [{ id: "t1", name: "Tradeline 1" }];
      (getUserRecentTradelines as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useUserRecentTradelines("u1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.recentTradelines).toEqual(mockData);
    });

    it("should return empty array when userId is undefined", async () => {
      const { result } = renderHook(() => useUserRecentTradelines(undefined), {
        wrapper: createWrapper(),
      });

      expect(getUserRecentTradelines).not.toHaveBeenCalled();
      expect(result.current.recentTradelines).toEqual([]);
    });
  });

  describe("useUserTradelines", () => {
    it("should fetch all tradelines for user", async () => {
      const mockData = [{ id: "t1" }, { id: "t2" }];
      (getUserTradelines as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useUserTradelines("u1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tradelines).toEqual(mockData);
    });
  });

  describe("useAllPurchasedTradelines", () => {
    it("should fetch all purchased tradelines", async () => {
      const mockData = [{ id: "pt1", status: "Approved" }];
      (getAllPurchasedTradelines as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useAllPurchasedTradelines(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tradelines).toEqual(mockData);
    });
  });

  describe("useUpdateTradelineStatus", () => {
    it("should update tradeline status", async () => {
      (updateTradelineStatus as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useUpdateTradelineStatus(), {
        wrapper: createWrapper(),
      });

      await result.current.updateStatus({
        id: "t1",
        status: "Approved",
        reason: "Verified",
      });

      expect(updateTradelineStatus).toHaveBeenCalledWith(
        "t1",
        "Approved",
        "Verified",
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Tradeline status updated successfully.",
      );
    });
  });

  describe("usePendingTradelinesCount", () => {
    it("should fetch pending tradelines count", async () => {
      (getPendingTradelinesCount as any).mockResolvedValueOnce(5);

      const { result } = renderHook(() => usePendingTradelinesCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.count).toBe(5);
    });

    it("should default to 0", async () => {
      (getPendingTradelinesCount as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => usePendingTradelinesCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.count).toBe(0);
    });
  });
});
