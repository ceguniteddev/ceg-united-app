import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useFundingProducts,
  useFundingProduct,
  useFundingProductMutation,
} from "@/hooks/admin/funding-product";
import { createWrapper } from "../../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "admin-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/funding-products", () => ({
  getFundingProducts: vi.fn(),
  getFundingProduct: vi.fn(),
  recordFundingProduct: vi.fn(),
  updateFundingProduct: vi.fn(),
  deleteFundingProduct: vi.fn(),
}));

import {
  getFundingProducts,
  getFundingProduct,
  recordFundingProduct,
  updateFundingProduct,
  deleteFundingProduct,
} from "@/service/funding-products";

describe("admin/funding-product hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useFundingProducts", () => {
    it("should fetch funding products", async () => {
      const mockData = [{ id: "fp1", name: "Product 1" }];
      (getFundingProducts as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useFundingProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.products).toEqual(mockData);
    });
  });

  describe("useFundingProduct", () => {
    it("should fetch a single funding product", async () => {
      const mockData = { id: "fp1", name: "Product 1" };
      (getFundingProduct as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useFundingProduct("fp1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.products).toEqual(mockData);
    });
  });

  describe("useFundingProductMutation", () => {
    it("should create funding product", async () => {
      (recordFundingProduct as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useFundingProductMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.createFundingProduct({ name: "New" } as any);

      expect(recordFundingProduct).toHaveBeenCalledWith({ name: "New" });
    });

    it("should update funding product", async () => {
      (updateFundingProduct as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useFundingProductMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.updateFundingProduct({
        id: "fp1",
        values: { name: "Updated" } as any,
      });

      expect(updateFundingProduct).toHaveBeenCalledWith("fp1", {
        name: "Updated",
      });
    });

    it("should delete funding product", async () => {
      (deleteFundingProduct as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useFundingProductMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.deleteFundingProduct("fp1");

      expect(deleteFundingProduct).toHaveBeenCalledWith("fp1");
    });
  });
});
