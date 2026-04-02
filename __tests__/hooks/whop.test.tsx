import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWhopCheckoutDetails } from "@/hooks/whop";
import { createWrapper } from "../utils/test-utils";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

global.fetch = vi.fn();

describe("whop hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useWhopCheckoutDetails", () => {
    it("should fetch checkout details successfully", async () => {
      const mockData = { id: "checkout-1", status: "completed" };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(
        () => useWhopCheckoutDetails("checkout-1"),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.checkoutDetails).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/whop/checkout/checkout-1",
      );
    });

    it("should not fetch when checkoutId is empty", async () => {
      const { result } = renderHook(() => useWhopCheckoutDetails(""), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.checkoutDetails).toBeUndefined();
    });

    it("should set error when fetch fails", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      const { result } = renderHook(
        () => useWhopCheckoutDetails("checkout-1"),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });
});
