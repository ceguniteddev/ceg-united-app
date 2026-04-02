import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRegistration } from "@/hooks/registration";
import { createWrapper } from "../utils/test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

global.fetch = vi.fn();

describe("registration hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useRegistration", () => {
    it("should register successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useRegistration(), {
        wrapper: createWrapper(),
      });

      await result.current.recordRegistration({
        values: { email: "test@test.com" } as any,
        token: "valid-token",
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "valid-token",
          values: { email: "test@test.com" },
        }),
      });
      expect(toast.success).toHaveBeenCalledWith("Registered successfully.");
      expect(mockReplace).toHaveBeenCalledWith("/");
    });

    it("should warn when token is null", async () => {
      const { result } = renderHook(() => useRegistration(), {
        wrapper: createWrapper(),
      });

      await result.current.recordRegistration({
        values: { email: "test@test.com" } as any,
        token: null,
      });

      expect(toast.warning).toHaveBeenCalledWith(
        "Failed to register. Please refresh the page.",
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle registration error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ errors: ["Email already in use"] }),
      });

      const { result } = renderHook(() => useRegistration(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.recordRegistration({
          values: { email: "dup@test.com" } as any,
          token: "token",
        });
      } catch (e) {
        // expected
      }

      expect(toast.warning).toHaveBeenCalledWith("Email already in use");
    });
  });
});
