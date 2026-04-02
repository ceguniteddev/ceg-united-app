import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useGetDenefitsContractsByUserId,
  useGetDenefitsContracts,
  useGetDenefitsPayments,
  useMapDenefitsContractToUser,
  useUnmapDenefitsContract,
} from "@/hooks/denefits";
import { createWrapper } from "../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

global.fetch = vi.fn();

describe("denefits hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useGetDenefitsContractsByUserId", () => {
    it("should fetch denefits contract by user id", async () => {
      const mockData = { id: "d1", status: "active" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(
        () => useGetDenefitsContractsByUserId("u1"),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.denefitsContract).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1/denefits");
    });

    it("should not fetch when userId is empty", async () => {
      const { result } = renderHook(() => useGetDenefitsContractsByUserId(""), {
        wrapper: createWrapper(),
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useGetDenefitsContracts", () => {
    it("should fetch all denefits contracts", async () => {
      const mockData = [{ id: "d1" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetDenefitsContracts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.denefitsContracts).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/denefits/contracts");
    });
  });

  describe("useGetDenefitsPayments", () => {
    it("should fetch denefits payments", async () => {
      const mockData = [{ id: "p1", amount: 500 }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useGetDenefitsPayments(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.denefitsPayments).toEqual(mockData);
    });
  });

  describe("useMapDenefitsContractToUser", () => {
    it("should map contract to user successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useMapDenefitsContractToUser(), {
        wrapper: createWrapper(),
      });

      await result.current.mapContract({
        contractId: "c1",
        userId: "u1",
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/denefits/payments/c1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "u1" }),
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Contract successfully mapped to user!",
      );
    });

    it("should handle mapping error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Contract not found" }),
      });

      const { result } = renderHook(() => useMapDenefitsContractToUser(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.mapContract({ contractId: "c1", userId: "u1" });
      } catch (e) {
        // expected
      }

      expect(toast.error).toHaveBeenCalledWith("Contract not found");
    });
  });

  describe("useUnmapDenefitsContract", () => {
    it("should unmap contract successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useUnmapDenefitsContract(), {
        wrapper: createWrapper(),
      });

      await result.current.unmapContract({ contractId: "c1" });

      expect(global.fetch).toHaveBeenCalledWith("/api/denefits/payments/c1", {
        method: "DELETE",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Contract successfully unmapped!",
      );
    });
  });
});
