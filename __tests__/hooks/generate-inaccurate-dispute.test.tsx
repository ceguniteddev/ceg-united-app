import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGenerateInaccurateDisputeLetter } from "@/hooks/generate-inaccurate-dispute";
import { createWrapper } from "../utils/test-utils";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockUser = { uid: "user-123" };
vi.mock("@/provider/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

global.fetch = vi.fn();

describe("generate-inaccurate-dispute hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useGenerateInaccurateDisputeLetter", () => {
    it("should generate dispute letter with bureau-specific content", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          experian: "<p>Experian letter</p>",
          transunion: "<p>TransUnion letter</p>",
          equifax: null,
        }),
      });

      const { result } = renderHook(
        () => useGenerateInaccurateDisputeLetter(),
        { wrapper: createWrapper() },
      );

      const content = await result.current.mutateAsync({
        selectedErrors: {
          experian: [
            {
              creditorName: "Test",
              accountNumber: "123",
              error: "Late payment",
            },
          ],
          transunion: [
            {
              creditorName: "Test2",
              accountNumber: "456",
              error: "Wrong balance",
            },
          ],
          equifax: [],
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/user-123/dispute-letter/identify-factual-error/generate",
        expect.objectContaining({ method: "POST" }),
      );
      expect(content).toEqual({
        experian: "<p>Experian letter</p>",
        transunion: "<p>TransUnion letter</p>",
        equifax: null,
      });
    });

    it("should fall back to single content when no bureau-specific data", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: "Simple content",
        }),
      });

      const { result } = renderHook(
        () => useGenerateInaccurateDisputeLetter(),
        { wrapper: createWrapper() },
      );

      const content = await result.current.mutateAsync({
        selectedErrors: { experian: [], transunion: [], equifax: [] },
      });

      expect(content).toContain("<p>");
    });

    it("should use custom userId when provided", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: "" }),
      });

      const { result } = renderHook(
        () => useGenerateInaccurateDisputeLetter("custom-user"),
        { wrapper: createWrapper() },
      );

      await result.current.mutateAsync({
        selectedErrors: { experian: [], transunion: [], equifax: [] },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/custom-user/dispute-letter/identify-factual-error/generate",
        expect.anything(),
      );
    });

    it("should throw when fetch fails", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: false });

      const { result } = renderHook(
        () => useGenerateInaccurateDisputeLetter(),
        { wrapper: createWrapper() },
      );

      await expect(
        result.current.mutateAsync({
          selectedErrors: { experian: [], transunion: [], equifax: [] },
        }),
      ).rejects.toThrow("Failed to generate dispute letter");
    });
  });
});
