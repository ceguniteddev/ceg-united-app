import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGetAssetReportByUserId } from "@/hooks/plaid/asset";
import { createWrapper } from "../../utils/test-utils";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/plaid/asset", () => ({
  getAssetReportRequestByUserId: vi.fn(),
}));

import { getAssetReportRequestByUserId } from "@/service/plaid/asset";

describe("plaid/asset hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useGetAssetReportByUserId", () => {
    it("should fetch asset report request", async () => {
      const mockData = { id: "ar1", status: "completed" };
      (getAssetReportRequestByUserId as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useGetAssetReportByUserId(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.request).toEqual(mockData);
      expect(getAssetReportRequestByUserId).toHaveBeenCalledWith("user-123");
    });
  });
});
