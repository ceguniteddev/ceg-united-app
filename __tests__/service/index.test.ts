import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted — do NOT reference outer variables inside the factory
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { headers } from "next/headers";
import { getBaseUrl } from "@/service/index";

describe("service/index", () => {
  const mockHeadersGet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue({ get: mockHeadersGet } as any);
    delete process.env.ENVIRONMENT;
  });

  describe("getBaseUrl", () => {
    it("returns ngrok URL when ENVIRONMENT is development", async () => {
      process.env.ENVIRONMENT = "development";

      const result = await getBaseUrl();

      expect(result).toBe("https://hare-smashing-basically.ngrok-free.app");
    });

    it("returns constructed URL from x-forwarded-proto and x-forwarded-host headers", async () => {
      mockHeadersGet.mockImplementation((key: string) => {
        if (key === "x-forwarded-proto") return "https";
        if (key === "x-forwarded-host") return "app.cegunited.com";
        return null;
      });

      const result = await getBaseUrl();

      expect(result).toBe("https://app.cegunited.com");
    });

    it("falls back to host header when x-forwarded-host is null", async () => {
      mockHeadersGet.mockImplementation((key: string) => {
        if (key === "x-forwarded-proto") return "https";
        if (key === "x-forwarded-host") return null;
        if (key === "host") return "app.cegunited.com";
        return null;
      });

      const result = await getBaseUrl();

      expect(result).toBe("https://app.cegunited.com");
    });

    it("falls back to http when x-forwarded-proto is null", async () => {
      mockHeadersGet.mockImplementation((key: string) => {
        if (key === "x-forwarded-proto") return null;
        if (key === "x-forwarded-host") return null;
        if (key === "host") return "localhost:3000";
        return null;
      });

      const result = await getBaseUrl();

      expect(result).toBe("http://localhost:3000");
    });

    it("falls back to localhost:3000 when all headers are null", async () => {
      mockHeadersGet.mockReturnValue(null);

      const result = await getBaseUrl();

      expect(result).toBe("http://localhost:3000");
    });
  });
});
