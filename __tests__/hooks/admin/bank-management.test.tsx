import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useBankManagementQuery,
  useBankManagementMutation,
} from "@/hooks/admin/bank-management";
import { createWrapper } from "../../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "admin-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/bank-management", () => ({
  getBanks: vi.fn(),
  createBank: vi.fn(),
  updateBank: vi.fn(),
  deleteBank: vi.fn(),
}));

import {
  getBanks,
  createBank,
  updateBank,
  deleteBank,
} from "@/service/bank-management";

describe("admin/bank-management hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useBankManagementQuery", () => {
    it("should fetch banks", async () => {
      const mockData = [{ id: "b1", bankName: "Bank 1" }];
      (getBanks as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useBankManagementQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.banks).toEqual(mockData);
    });
  });

  describe("useBankManagementMutation", () => {
    it("should create a bank", async () => {
      (createBank as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useBankManagementMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.createBank({ bankName: "New Bank" } as any);

      expect(createBank).toHaveBeenCalledWith({ bankName: "New Bank" });
      expect(toast.success).toHaveBeenCalledWith("Bank created successfully");
    });

    it("should update a bank", async () => {
      (updateBank as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useBankManagementMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.updateBank({
        id: "b1",
        data: { bankName: "Updated" },
      });

      expect(updateBank).toHaveBeenCalledWith("b1", { bankName: "Updated" });
      expect(toast.success).toHaveBeenCalledWith("Bank updated successfully");
    });

    it("should delete a bank", async () => {
      (deleteBank as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useBankManagementMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.deleteBank("b1");

      expect(deleteBank).toHaveBeenCalledWith("b1");
      expect(toast.success).toHaveBeenCalledWith("Bank deleted successfully");
    });
  });
});
