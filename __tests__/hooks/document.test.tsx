import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useUserDocumentMutation,
  useUserDocumentsQuery,
} from "@/hooks/document";
import { createWrapper } from "../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/service/documents", () => ({
  deleteDocument: vi.fn(),
}));

vi.mock("@/service/user", () => ({
  getUserDocuments: vi.fn(),
}));

import { deleteDocument } from "@/service/documents";

global.fetch = vi.fn();

describe("document hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useUserDocumentMutation", () => {
    it("should delete a document successfully", async () => {
      (deleteDocument as any).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useUserDocumentMutation(), {
        wrapper: createWrapper(),
      });

      await result.current.deleteDocument({ path: "docs/file.pdf" });

      expect(deleteDocument).toHaveBeenCalledWith("docs/file.pdf");
      expect(toast.success).toHaveBeenCalledWith(
        "Document deleted successfully.",
      );
    });

    it("should handle delete failure", async () => {
      (deleteDocument as any).mockRejectedValueOnce(new Error("Delete failed"));

      const { result } = renderHook(() => useUserDocumentMutation(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.deleteDocument({ path: "docs/file.pdf" });
      } catch (e) {
        // expected
      }

      expect(toast.warning).toHaveBeenCalledWith("Delete failed");
    });
  });

  describe("useUserDocumentsQuery", () => {
    it("should fetch user documents", async () => {
      const mockData = [{ name: "file.pdf", path: "docs/file.pdf" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(
        () => useUserDocumentsQuery({ userId: "u1" }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.userDocuments).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/user/u1/documents");
    });

    it("should not fetch when userId is empty", async () => {
      renderHook(() => useUserDocumentsQuery({ userId: "" }), {
        wrapper: createWrapper(),
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
