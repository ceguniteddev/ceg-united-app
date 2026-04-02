import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useGetWhopPayments,
  useMapWhopPayment,
  useUnmapWhopPayment,
} from "@/hooks/admin/payments/whop";
import { createWrapper } from "../../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

global.fetch = vi.fn();

describe("admin/payments/whop hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useGetWhopPayments", () => {
    it("should fetch whop payments", async () => {
      const mockData = [{ id: "p1", amount: 100 }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetWhopPayments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.whopPayments).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/payments/whop/list");
    });

    it("should handle fetch error", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useGetWhopPayments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useMapWhopPayment", () => {
    it("should map payment successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useMapWhopPayment(), {
        wrapper: createWrapper(),
      });

      await result.current.mapPayment({ docId: "d1", userId: "u1" });

      expect(global.fetch).toHaveBeenCalledWith("/api/payments/whop/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: "d1", userId: "u1" }),
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Payment mapped successfully!",
      );
    });
  });

  describe("useUnmapWhopPayment", () => {
    it("should unmap payment successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useUnmapWhopPayment(), {
        wrapper: createWrapper(),
      });

      await result.current.unmapPayment({ docId: "d1" });

      expect(global.fetch).toHaveBeenCalledWith("/api/payments/whop/unmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: "d1" }),
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Payment unmapped successfully!",
      );
    });
  });
});
