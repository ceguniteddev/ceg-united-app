import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useBankProductsQuery,
  useBankProductsQueryById,
  useBankProductsMutation,
} from "@/hooks/admin/bank-products";
import { createWrapper } from "../../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "admin-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/bank-products", () => ({
  getBankProducts: vi.fn(),
  getBankProduct: vi.fn(),
  recordBankProduct: vi.fn(),
  updateBankProduct: vi.fn(),
  deleteBankProduct: vi.fn(),
}));

import {
  getBankProducts,
  getBankProduct,
  recordBankProduct,
  updateBankProduct,
  deleteBankProduct,
} from "@/service/bank-products";

describe("admin/bank-products hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useBankProductsQuery", () => {
    it("should fetch bank products", async () => {
      const mockData = [{ id: "bp1", name: "Product 1" }];
      (getBankProducts as any).mockResolvedValueOnce({
        success: true,
        data: mockData,
      });

      const { result } = renderHook(() => useBankProductsQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.products).toEqual(mockData);
    });
  });

  describe("useBankProductsQueryById", () => {
    it("should fetch bank product by id", async () => {
      const mockData = { id: "bp1", name: "Product 1" };
      (getBankProduct as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useBankProductsQueryById("bp1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.products).toEqual(mockData);
    });
  });

  describe("useBankProductsMutation", () => {
    it("should create bank product", async () => {
      (recordBankProduct as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useBankProductsMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.createBankProduct({ name: "New Product" } as any);

      expect(recordBankProduct).toHaveBeenCalledWith({ name: "New Product" });
    });

    it("should update bank product", async () => {
      (updateBankProduct as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useBankProductsMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.updateBankProduct({
        id: "bp1",
        values: { name: "Updated" } as any,
      });

      expect(updateBankProduct).toHaveBeenCalledWith("bp1", {
        name: "Updated",
      });
    });

    it("should delete bank product", async () => {
      (deleteBankProduct as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useBankProductsMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.deleteBankProduct("bp1");

      expect(deleteBankProduct).toHaveBeenCalledWith("bp1");
    });
  });
});
