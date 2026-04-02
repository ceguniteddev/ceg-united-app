import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useClientCRSReportQuery, useRefreshCRSData } from "@/hooks/crs";
import { createWrapper } from "../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/crs", () => ({
  refreshCRSData: vi.fn(),
}));

vi.mock("@/service/apply-funding", () => ({
  getApplyFunding: vi.fn(),
}));

global.fetch = vi.fn();

describe("crs hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useClientCRSReportQuery", () => {
    it("should fetch CRS report for user", async () => {
      const mockData = { experian: {}, transunion: {}, equifax: {} };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(
        () => useClientCRSReportQuery({ userId: "u1" }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.crsReport).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/crs/u1");
    });

    it("should not fetch when userId is empty", async () => {
      renderHook(() => useClientCRSReportQuery({ userId: "" }), {
        wrapper: createWrapper(),
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle failed fetch gracefully", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(
        () => useClientCRSReportQuery({ userId: "u1" }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.crsReport).toBeNull();
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch CRS report.");
    });
  });

  describe("useRefreshCRSData", () => {
    it("should refresh CRS data successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useRefreshCRSData(), {
        wrapper: createWrapper(),
      });

      await result.current.refreshCRSData({
        userId: "u1",
        bureaus: { equifax: true, experian: true, transunion: false },
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/crs/u1/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.any(String),
      });
      expect(toast.success).toHaveBeenCalledWith(
        "CRS data refreshed successfully.",
      );
    });

    it("should handle refresh failure", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Server error" }),
      });

      const { result } = renderHook(() => useRefreshCRSData(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.refreshCRSData({ userId: "u1" });
      } catch (e) {
        // expected
      }

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to refresh CRS data. Please try again.",
      );
    });
  });
});
