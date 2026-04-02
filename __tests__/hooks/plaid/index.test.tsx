import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useHasAccessToken,
  useGetPlaidItemAccountByUserId,
  useGetPlaidAccounts,
  useGetLinkToken,
  usePlaidAccountsMutation,
} from "@/hooks/plaid";
import { createWrapper } from "../../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, role: "Client" }),
}));

vi.mock("@/service/plaid", () => ({
  hasAccessToken: vi.fn(),
  getPlaidAccountByUserIdAndItemId: vi.fn(),
  getPlaidAccounts: vi.fn(),
  getPlaidLinkToken: vi.fn(),
  unlinkPlaidItem: vi.fn(),
}));

import {
  hasAccessToken,
  getPlaidAccountByUserIdAndItemId,
  getPlaidAccounts,
  getPlaidLinkToken,
  unlinkPlaidItem,
} from "@/service/plaid";

describe("plaid hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useHasAccessToken", () => {
    it("should check if user has access token", async () => {
      (hasAccessToken as any).mockResolvedValueOnce(true);

      const { result } = renderHook(() => useHasAccessToken(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasToken).toBe(true);
      expect(hasAccessToken).toHaveBeenCalledWith("user-123", undefined);
    });
  });

  describe("useGetPlaidItemAccountByUserId", () => {
    it("should fetch plaid account by item and account id", async () => {
      const mockData = { id: "acc1", name: "Checking" };
      (getPlaidAccountByUserIdAndItemId as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(
        () => useGetPlaidItemAccountByUserId("item-1", "acc-1"),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.plaidItemAccounts).toEqual(mockData);
    });
  });

  describe("useGetPlaidAccounts", () => {
    it("should fetch plaid accounts", async () => {
      const mockData = [{ id: "acc1" }, { id: "acc2" }];
      (getPlaidAccounts as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useGetPlaidAccounts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.plaidAccounts).toEqual(mockData);
    });
  });

  describe("useGetLinkToken", () => {
    it("should fetch link token", async () => {
      (getPlaidLinkToken as any).mockResolvedValueOnce({
        link_token: "link-token-123",
      });

      const { result } = renderHook(() => useGetLinkToken({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.linkToken).toBe("link-token-123");
    });
  });

  describe("usePlaidAccountsMutation", () => {
    it("should remove bank account", async () => {
      (unlinkPlaidItem as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => usePlaidAccountsMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.removeBankAccount(["item-1"]);

      expect(unlinkPlaidItem).toHaveBeenCalledWith("user-123", ["item-1"]);
      expect(toast.success).toHaveBeenCalledWith(
        "Bank account removed successfully.",
      );
    });

    it("should handle remove error", async () => {
      (unlinkPlaidItem as any).mockRejectedValueOnce(new Error("Failed"));

      const { result } = renderHook(() => usePlaidAccountsMutation(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.removeBankAccount(["item-1"]);
      } catch (e) {
        // expected
      }

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to removed Bank account.",
      );
    });
  });
});
