import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({ logInfo: vi.fn() }));
vi.mock("@/lib/n8n", () => ({
  sendClientServiceAgreementN8N: vi
    .fn()
    .mockResolvedValue("webhook-path-1" as any),
  createAsanaCustomerServiceTaskN8N: vi
    .fn()
    .mockResolvedValue("webhook-path-2" as any),
  // getFundingAnalysisNewRegistrationFlow: vi.fn(),
  mapBankProductsN8nNewRegistration: vi.fn(),
  sendClientCongratsMessageN8NNewRegistration: vi.fn(),
}));

const mockFetch = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal("fetch", mockFetch);

import {
  sendClientServiceAgreement,
  createAsanaCustomerServiceTask,
} from "@/service/n8n";

describe("service/n8n", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
    process.env.n8n_HOST = "https://n8n.example.com";
    process.env.ADMIN_ACCESS_KEY = "test-admin-key";
  });

  // ── sendClientServiceAgreement ────────────────────────────────────────────
  describe("sendClientServiceAgreement", () => {
    it("calls fetch with the correct URL, headers, and body", async () => {
      await sendClientServiceAgreement({ userId: "user-123" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://n8n.example.com/webhook-path-1",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            ADMIN_ACCESS_KEY: "test-admin-key",
          }),
          body: JSON.stringify({ userId: "user-123" }),
        }),
      );
    });
  });

  // ── createAsanaCustomerServiceTask ────────────────────────────────────────
  describe("createAsanaCustomerServiceTask", () => {
    const taskParams = {
      userId: "user-456",
      bankProductId: "bp-789",
      referenceNumber: "ref-001",
      fundMappingApprovedId: "fma-002",
    };

    it("calls fetch with the correct URL", async () => {
      await createAsanaCustomerServiceTask(taskParams);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://n8n.example.com/webhook-path-2",
        expect.any(Object),
      );
    });

    it("sends POST with correct headers", async () => {
      await createAsanaCustomerServiceTask(taskParams);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            ADMIN_ACCESS_KEY: "test-admin-key",
          }),
        }),
      );
    });

    it("sends correct body payload", async () => {
      await createAsanaCustomerServiceTask(taskParams);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(taskParams),
        }),
      );
    });

    it("returns the fetch response", async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await createAsanaCustomerServiceTask(taskParams);

      expect(result).toBe(mockResponse);
    });
  });
});
