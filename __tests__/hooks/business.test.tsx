import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useBusinessQuery,
  useBusinessMutation,
  useBusinessByIdQuery,
  useBusinessAuditQuery,
} from "@/hooks/business";
import { createWrapper } from "../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/business", () => ({
  getBusiness: vi.fn(),
  recordBusiness: vi.fn(),
  updateBusiness: vi.fn(),
  deleteBusiness: vi.fn(),
}));

import {
  recordBusiness,
  updateBusiness,
  deleteBusiness,
} from "@/service/business";

global.fetch = vi.fn();

describe("business hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useBusinessQuery", () => {
    it("should fetch business details when enabled", async () => {
      const mockData = { id: "b1", name: "Test Business" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useBusinessQuery("user-1", true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.businessData).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/user/user-1/business");
    });

    it("should not fetch when disabled", async () => {
      const { result } = renderHook(() => useBusinessQuery("user-1", false), {
        wrapper: createWrapper(),
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useBusinessMutation", () => {
    it("should record business", async () => {
      (recordBusiness as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useBusinessMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.recordBusiness({
        values: { name: "New Business" } as any,
        userId: "u1",
      });

      expect(recordBusiness).toHaveBeenCalledWith({ name: "New Business" });
      expect(toast.success).toHaveBeenCalledWith(
        "Business details recorded successfully.",
      );
    });

    it("should update business", async () => {
      (updateBusiness as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useBusinessMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.updateBusiness({
        id: "b1",
        values: { name: "Updated", userId: "u1" } as any,
      });

      expect(updateBusiness).toHaveBeenCalledWith("b1", {
        name: "Updated",
        userId: "u1",
      });
    });

    it("should delete business", async () => {
      (deleteBusiness as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useBusinessMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.deleteBusiness("b1");

      expect(deleteBusiness).toHaveBeenCalledWith("b1");
      expect(toast.success).toHaveBeenCalledWith(
        "Business details deleted successfully.",
      );
    });
  });

  describe("useBusinessByIdQuery", () => {
    it("should fetch business by id", async () => {
      const mockData = { id: "b1", name: "Business" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useBusinessByIdQuery("u1", "b1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.business).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1/business/b1");
    });

    it("should not fetch when ids are empty", async () => {
      renderHook(() => useBusinessByIdQuery("", ""), {
        wrapper: createWrapper(),
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("useBusinessAuditQuery", () => {
    it("should fetch business audit data", async () => {
      const mockData = {
        auditItems: [{ name: "EIN" }],
        fundabilityScore: 80,
        fundabilityStatus: "Good",
        creditScore: 700,
        creditRating: "Good",
        creditChange: 5,
        accounts: [],
        metrics: [],
        revenueData: [],
        compatibilityFactors: [],
      };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useBusinessAuditQuery("u1", "b1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fundabilityScore).toBe(80);
      expect(result.current.auditItems).toEqual([{ name: "EIN" }]);
    });

    it("should return defaults on fetch failure", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(() => useBusinessAuditQuery("u1", "b1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fundabilityScore).toBe(0);
      expect(result.current.fundabilityStatus).toBe("No Data");
      expect(result.current.auditItems).toEqual([]);
    });
  });
});
