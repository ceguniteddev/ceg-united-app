import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useGetAdminStatistics,
  useGetClientStatistics,
  useGetClientStatisticsByUserId,
} from "@/hooks/statistics";
import { createWrapper } from "../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/statistics", () => ({
  getClientStatistics: vi.fn(),
}));

global.fetch = vi.fn();

describe("statistics hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useGetAdminStatistics", () => {
    it("should fetch admin statistics", async () => {
      const mockData = { totalUsers: 100, totalRevenue: 50000 };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetAdminStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.adminStatistics).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/statistics");
    });

    it("should return null on failure", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useGetAdminStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.adminStatistics).toBeNull();
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to fetch admin statistics.",
      );
    });
  });

  describe("useGetClientStatistics", () => {
    it("should fetch client statistics", async () => {
      const mockData = { fundingCount: 3, totalApproved: 15000 };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetClientStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.clientStatistics).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/user-123/statistics",
      );
    });
  });

  describe("useGetClientStatisticsByUserId", () => {
    it("should fetch client statistics by user id", async () => {
      const mockData = { fundingCount: 1 };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(
        () => useGetClientStatisticsByUserId("u1"),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.clientStatistics).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1/statistics");
    });

    it("should not fetch when userId is empty", async () => {
      renderHook(() => useGetClientStatisticsByUserId(""), {
        wrapper: createWrapper(),
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
