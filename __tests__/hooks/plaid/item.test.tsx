import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUserFlags, useGetNewAccountFlags } from "@/hooks/plaid/item";
import { createWrapper } from "../../utils/test-utils";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/plaid/item", () => ({
  getItemLinkUpdateModeData: vi.fn(),
  getItemLinkUpdateModeNewAccount: vi.fn(),
}));

import {
  getItemLinkUpdateModeData,
  getItemLinkUpdateModeNewAccount,
} from "@/service/plaid/item";

describe("plaid/item hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useUserFlags", () => {
    it("should fetch user link update mode flags", async () => {
      const mockData = [{ itemId: "item-1", requiresUpdate: true }];
      (getItemLinkUpdateModeData as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useUserFlags(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.flags).toEqual(mockData);
      expect(getItemLinkUpdateModeData).toHaveBeenCalledWith("user-123");
    });

    it("should return empty array when no data", async () => {
      (getItemLinkUpdateModeData as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useUserFlags(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.flags).toEqual([]);
    });
  });

  describe("useGetNewAccountFlags", () => {
    it("should fetch new account flags", async () => {
      const mockData = [{ itemId: "item-2", isNew: true }];
      (getItemLinkUpdateModeNewAccount as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useGetNewAccountFlags(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.flags).toEqual(mockData);
    });
  });
});
