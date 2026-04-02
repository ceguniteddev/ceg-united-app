import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useWhatsNewQuery,
  useWhatsNewQueryActive,
  useWhatsNewMutation,
} from "@/hooks/whats-new";
import { createWrapper } from "../utils/test-utils";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/whats-new", () => ({
  getWhatsNew: vi.fn(),
  getWhatsNewActive: vi.fn(),
  recordWhatsNew: vi.fn(),
  updateWhatsNew: vi.fn(),
  deleteWhatsNew: vi.fn(),
}));

import {
  getWhatsNew,
  getWhatsNewActive,
  recordWhatsNew,
  updateWhatsNew,
  deleteWhatsNew,
} from "@/service/whats-new";
import { toast } from "sonner";

describe("whats-new hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useWhatsNewQuery", () => {
    it("should fetch all whats new items", async () => {
      const mockData = [{ id: "1", title: "New Feature" }];
      (getWhatsNew as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useWhatsNewQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe("useWhatsNewQueryActive", () => {
    it("should fetch active whats new items", async () => {
      const mockData = [{ id: "2", title: "Active Feature" }];
      (getWhatsNewActive as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useWhatsNewQueryActive(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeItems).toEqual(mockData);
    });
  });

  describe("useWhatsNewMutation", () => {
    it("should record a new item successfully", async () => {
      (recordWhatsNew as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useWhatsNewMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.record({ title: "New" } as any);

      expect(recordWhatsNew).toHaveBeenCalledWith({ title: "New" });
      expect(toast.success).toHaveBeenCalledWith(
        "Data is recorded successfully.",
      );
    });

    it("should update an item successfully", async () => {
      (updateWhatsNew as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useWhatsNewMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.update({
        id: "1",
        values: { title: "Updated" } as any,
      });

      expect(updateWhatsNew).toHaveBeenCalledWith("1", { title: "Updated" });
      expect(toast.success).toHaveBeenCalledWith(
        "Data is updated successfully.",
      );
    });

    it("should delete an item successfully", async () => {
      (deleteWhatsNew as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useWhatsNewMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.delete("1");

      expect(deleteWhatsNew).toHaveBeenCalledWith("1");
      expect(toast.success).toHaveBeenCalledWith(
        "Data is deleted successfully.",
      );
    });

    it("should handle errors on record", async () => {
      (recordWhatsNew as any).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useWhatsNewMutation(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.record({ title: "Fail" } as any);
      } catch (e) {
        // Expected
      }

      expect(toast.warning).toHaveBeenCalledWith("Network error");
    });
  });
});
