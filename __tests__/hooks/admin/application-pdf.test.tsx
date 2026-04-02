import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSaveApplicationPdf } from "@/hooks/admin/funding-application/application-pdf";
import { createWrapper } from "../../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

global.fetch = vi.fn();

describe("admin/funding-application/application-pdf hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useSaveApplicationPdf", () => {
    it("should save application PDF", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useSaveApplicationPdf("REF-001"), {
        wrapper: createWrapper(),
      });

      await result.current.savePdf();

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/funding-application/REF-001/save-application-pdf",
        { method: "POST" },
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Application Form saved to My Documents successfully",
      );
    });

    it("should handle save error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Server error" }),
      });

      const { result } = renderHook(() => useSaveApplicationPdf("REF-001"), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.savePdf();
      } catch (e) {
        // expected
      }

      expect(toast.error).toHaveBeenCalled();
    });
  });
});
