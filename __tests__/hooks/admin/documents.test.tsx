import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGetClientDocuments } from "@/hooks/admin/funding-application/documents";
import { createWrapper } from "../../utils/test-utils";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "admin-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

global.fetch = vi.fn();

describe("admin/funding-application/documents hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useGetClientDocuments", () => {
    it("should fetch client documents", async () => {
      const mockData = { items: [{ name: "doc.pdf", path: "docs/doc.pdf" }] };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(
        () => useGetClientDocuments("u1", "REF-001"),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.documents).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/u1/document/REF-001",
        { method: "GET" },
      );
    });

    it("should not fetch when userId is empty", async () => {
      renderHook(() => useGetClientDocuments("", "REF-001"), {
        wrapper: createWrapper(),
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
