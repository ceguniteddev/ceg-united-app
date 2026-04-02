import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useAnalysisQuery,
  useAnalysisMutation,
  useRefreshAnalysisData,
  useEmailClientAnalysisData,
  useSaveToDocuments,
} from "@/hooks/admin/funding-application/analysis";
import { createWrapper } from "../../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "admin-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/analysis", () => ({
  getAnalysis: vi.fn(),
  updateAnalysis: vi.fn(),
}));

import { getAnalysis, updateAnalysis } from "@/service/analysis";

global.fetch = vi.fn();

describe("admin/funding-application/analysis hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAnalysisQuery", () => {
    it("should fetch analysis data", async () => {
      const mockData = { id: "a1", analysis: "Some analysis" };
      (getAnalysis as any).mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useAnalysisQuery("REF-001"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.analysisData).toEqual(mockData);
      expect(getAnalysis).toHaveBeenCalledWith("REF-001");
    });

    it("should not fetch when referenceNumber is empty", async () => {
      renderHook(() => useAnalysisQuery(""), {
        wrapper: createWrapper(),
      });

      expect(getAnalysis).not.toHaveBeenCalled();
    });
  });

  describe("useAnalysisMutation", () => {
    it("should update analysis", async () => {
      (updateAnalysis as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAnalysisMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.updateAnalysis({
        id: "a1",
        analysis: "Updated analysis",
        referenceNumber: "REF-001",
      });

      expect(updateAnalysis).toHaveBeenCalledWith(
        "REF-001",
        "a1",
        "Updated analysis",
      );
    });
  });

  describe("useRefreshAnalysisData", () => {
    it("should refresh analysis data", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useRefreshAnalysisData(), {
        wrapper: createWrapper(),
      });

      await result.current.refreshAnalysisData({
        referenceNumber: "REF-001",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/funding-application/REF-001/analysis/refresh",
        { method: "POST" },
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Analysis data refreshed successfully.",
      );
    });

    it("should handle refresh error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Server error" }),
      });

      const { result } = renderHook(() => useRefreshAnalysisData(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.refreshAnalysisData({
          referenceNumber: "REF-001",
        });
      } catch (e) {
        // expected
      }

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to refresh Analysis data. Please try again.",
      );
    });
  });

  describe("useEmailClientAnalysisData", () => {
    it("should send analysis email", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      const { result } = renderHook(() => useEmailClientAnalysisData(), {
        wrapper: createWrapper(),
      });

      await result.current.emailClientAnalysisData({
        referenceNumber: "REF-001",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/funding-application/REF-001/analysis/send-client",
        { method: "POST" },
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Client analysis data sent successfully.",
      );
    });
  });

  describe("useSaveToDocuments", () => {
    it("should save analysis to documents", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useSaveToDocuments(), {
        wrapper: createWrapper(),
      });

      await result.current.saveToDocuments({ referenceNumber: "REF-001" });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/funding-application/REF-001/save-to-documents",
        { method: "POST" },
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Analysis saved to My Documents successfully.",
      );
    });
  });
});
