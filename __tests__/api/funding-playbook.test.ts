/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getCachedPlaybook: vi.fn(),
  savePlaybook: vi.fn(),
  savePlaybookFeedback: vi.fn(),
  getCachedReconsiderationScript: vi.fn(),
  cacheReconsiderationScript: vi.fn(),
  getClient: vi.fn(),
  getLender: vi.fn(),
  getProduct: vi.fn(),
  listProducts: vi.fn(),
  generateFundingPlaybook: vi.fn(),
  findNearestBranchesN8N: vi.fn(),
  checkAndIncrementRateLimit: vi.fn(),
  getClientEntitlements: vi.fn(),
}));

vi.mock("@/service/user", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/service/course-capabilities", () => ({
  getClientEntitlements: mocks.getClientEntitlements,
}));

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(),
  authenticationAdmin: vi.fn(),
  initFirebase: vi.fn(),
}));

vi.mock("@/lib/funding-playbook/firestore-helpers", () => ({
  getCachedPlaybook: mocks.getCachedPlaybook,
  savePlaybook: mocks.savePlaybook,
  savePlaybookFeedback: mocks.savePlaybookFeedback,
  getCachedReconsiderationScript: mocks.getCachedReconsiderationScript,
  cacheReconsiderationScript: mocks.cacheReconsiderationScript,
  getClient: mocks.getClient,
  getLender: mocks.getLender,
  getProduct: mocks.getProduct,
  listProducts: mocks.listProducts,
  playbookId: (userId: string, lenderId?: string, productId?: string) =>
    `${userId}_${lenderId || "general"}_${productId || "general"}`,
  reconsiderationCacheId: (
    clientId: string,
    lenderId: string,
    denialReason: string,
  ) => `${clientId}_${lenderId}_${denialReason}`,
  NotFoundError: class NotFoundError extends Error {},
}));

vi.mock("@/lib/funding-playbook/rate-limit", () => ({
  checkAndIncrementRateLimit: mocks.checkAndIncrementRateLimit,
  RateLimitExceededError: class RateLimitExceededError extends Error {},
}));

vi.mock("@/service/n8n", () => ({
  generateFundingPlaybook: mocks.generateFundingPlaybook,
  findNearestBranchesN8N: mocks.findNearestBranchesN8N,
}));

import { GET as fetchPlaybook } from "@/app/api/funding-playbook/fetch/route";
import { POST as generatePlaybook } from "@/app/api/funding-playbook/generate/route";
import { POST as generateAsyncPlaybook } from "@/app/api/funding-playbook/generate-async/route";
import { POST as reconsiderationScript } from "@/app/api/funding-playbook/reconsideration-script/route";
import { POST as saveFeedback } from "@/app/api/funding-playbook/feedback/route";
import { POST as webhookRoute } from "@/app/api/funding-playbook/webhook/route";

describe("Funding Playbook API Authorization & Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getClientEntitlements.mockResolvedValue({
      hasNonIncomeFundingAccess: true,
    });
    mocks.findNearestBranchesN8N.mockResolvedValue({ branches: [] });
    process.env.ADMIN_ACCESS_KEY = "test-admin-secret-key";
  });

  describe("GET /api/funding-playbook/fetch", () => {
    it("returns 401 when no session is present", async () => {
      mocks.getCurrentUser.mockResolvedValue(null);
      const req = new Request(
        "http://localhost:3000/api/funding-playbook/fetch?userId=user_123",
      );
      const res = await fetchPlaybook(req);
      expect(res.status).toBe(401);
    });

    it("returns 403 when a client attempts to fetch another user's playbook", async () => {
      mocks.getCurrentUser.mockResolvedValue({
        uid: "client_user_1",
        role: "Client",
      });

      const req = new Request(
        "http://localhost:3000/api/funding-playbook/fetch?userId=victim_user_2",
      );
      const res = await fetchPlaybook(req);
      expect(res.status).toBe(403);
    });

    it("returns 403 when a client accesses another user's playbook via raw id parameter", async () => {
      mocks.getCurrentUser.mockResolvedValue({
        uid: "client_user_1",
        role: "Client",
      });
      mocks.getCachedPlaybook.mockResolvedValue({
        meta: { id: "victim_user_2_chase_csp", clientId: "victim_user_2" },
      });

      const req = new Request(
        "http://localhost:3000/api/funding-playbook/fetch?id=victim_user_2_chase_csp",
      );
      const res = await fetchPlaybook(req);
      expect(res.status).toBe(403);
    });

    it("allows a client to fetch their own cached playbook", async () => {
      mocks.getCurrentUser.mockResolvedValue({
        uid: "client_user_1",
        role: "Client",
      });
      mocks.getCachedPlaybook.mockResolvedValue({
        meta: { id: "client_user_1_chase_csp", clientId: "client_user_1" },
      });

      const req = new Request(
        "http://localhost:3000/api/funding-playbook/fetch?userId=client_user_1",
      );
      const res = await fetchPlaybook(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.cached).toBe(true);
    });

    it("allows an Admin to fetch any user's playbook", async () => {
      mocks.getCurrentUser.mockResolvedValue({
        uid: "admin_user",
        role: "Admin",
      });
      mocks.getCachedPlaybook.mockResolvedValue({
        meta: { id: "victim_user_2_chase_csp", clientId: "victim_user_2" },
      });

      const req = new Request(
        "http://localhost:3000/api/funding-playbook/fetch?userId=victim_user_2",
      );
      const res = await fetchPlaybook(req);
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/funding-playbook/generate", () => {
    it("returns 401 when no session is present", async () => {
      mocks.getCurrentUser.mockResolvedValue(null);
      const req = new Request(
        "http://localhost:3000/api/funding-playbook/generate",
        {
          method: "POST",
          body: JSON.stringify({ userId: "user_123" }),
        },
      );
      const res = await generatePlaybook(req);
      expect(res.status).toBe(401);
    });

    it("returns 403 when a client attempts to generate a playbook for another user", async () => {
      mocks.getCurrentUser.mockResolvedValue({
        uid: "client_user_1",
        role: "Client",
      });
      const req = new Request(
        "http://localhost:3000/api/funding-playbook/generate",
        {
          method: "POST",
          body: JSON.stringify({ userId: "other_user_2" }),
        },
      );
      const res = await generatePlaybook(req);
      expect(res.status).toBe(403);
    });

    it("bypasses a cached playbook when force regeneration is requested", async () => {
      mocks.getCurrentUser.mockResolvedValue({
        uid: "client_user_1",
        role: "Client",
      });
      mocks.getCachedPlaybook.mockResolvedValue({ meta: { id: "cached" } });
      mocks.getClient.mockResolvedValue({ id: "client_user_1" });
      mocks.getLender.mockResolvedValue({ id: "chase", displayName: "Chase" });
      mocks.getProduct.mockResolvedValue({ id: "csp", displayName: "CSP" });
      mocks.listProducts.mockResolvedValue([]);
      mocks.generateFundingPlaybook.mockResolvedValue({});

      const req = new Request(
        "http://localhost:3000/api/funding-playbook/generate?force=true",
        {
          method: "POST",
          body: JSON.stringify({
            userId: "client_user_1",
            lenderId: "chase",
            productId: "csp",
          }),
        },
      );
      await generatePlaybook(req);

      expect(mocks.checkAndIncrementRateLimit).toHaveBeenCalledWith(
        "client_user_1",
        "generatePlaybook",
      );
      expect(mocks.generateFundingPlaybook).toHaveBeenCalledWith({
        userId: "client_user_1",
        lenderId: "chase",
        productId: "csp",
      });
    });
  });

  describe("POST /api/funding-playbook/generate-async", () => {
    it("returns 401 when no session is present", async () => {
      mocks.getCurrentUser.mockResolvedValue(null);
      const req = new Request(
        "http://localhost:3000/api/funding-playbook/generate-async",
        {
          method: "POST",
          body: JSON.stringify({ userId: "user_123" }),
        },
      );
      const res = await generateAsyncPlaybook(req);
      expect(res.status).toBe(401);
    });

    it("returns 403 when a client attempts to trigger async generation for another user", async () => {
      mocks.getCurrentUser.mockResolvedValue({
        uid: "client_user_1",
        role: "Client",
      });
      const req = new Request(
        "http://localhost:3000/api/funding-playbook/generate-async",
        {
          method: "POST",
          body: JSON.stringify({ userId: "other_user_2" }),
        },
      );
      const res = await generateAsyncPlaybook(req);
      expect(res.status).toBe(403);
    });

    it("allows a client to trigger async generation for themselves", async () => {
      mocks.getCurrentUser.mockResolvedValue({
        uid: "client_user_1",
        role: "Client",
      });
      mocks.getCachedPlaybook.mockResolvedValue(null);
      mocks.checkAndIncrementRateLimit.mockResolvedValue(true);
      mocks.generateFundingPlaybook.mockResolvedValue({});

      const req = new Request(
        "http://localhost:3000/api/funding-playbook/generate-async",
        {
          method: "POST",
          body: JSON.stringify({ userId: "client_user_1" }),
        },
      );
      const res = await generateAsyncPlaybook(req);
      expect(res.status).toBe(202);
    });
  });

  describe("POST /api/funding-playbook/reconsideration-script", () => {
    it("returns 401 when no session is present", async () => {
      mocks.getCurrentUser.mockResolvedValue(null);
      const req = new Request(
        "http://localhost:3000/api/funding-playbook/reconsideration-script",
        {
          method: "POST",
          body: JSON.stringify({
            clientId: "client_123",
            lenderId: "chase",
            denialReason: "utilization too high",
          }),
        },
      );
      const res = await reconsiderationScript(req);
      expect(res.status).toBe(401);
    });

    it("returns 403 when a client requests a reconsideration script for another user", async () => {
      mocks.getCurrentUser.mockResolvedValue({
        uid: "client_user_1",
        role: "Client",
      });
      const req = new Request(
        "http://localhost:3000/api/funding-playbook/reconsideration-script",
        {
          method: "POST",
          body: JSON.stringify({
            clientId: "victim_client_2",
            lenderId: "chase",
            denialReason: "utilization too high",
          }),
        },
      );
      const res = await reconsiderationScript(req);
      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/funding-playbook/feedback", () => {
    it("returns 401 when no session is present", async () => {
      mocks.getCurrentUser.mockResolvedValue(null);
      const req = new Request(
        "http://localhost:3000/api/funding-playbook/feedback",
        {
          method: "POST",
          body: JSON.stringify({
            playbookId: "playbook_123",
            clientId: "client_123",
            rating: 5,
          }),
        },
      );
      const res = await saveFeedback(req);
      expect(res.status).toBe(401);
    });

    it("returns 403 when a client attempts to submit feedback for another user", async () => {
      mocks.getCurrentUser.mockResolvedValue({
        uid: "client_user_1",
        role: "Client",
      });
      const req = new Request(
        "http://localhost:3000/api/funding-playbook/feedback",
        {
          method: "POST",
          body: JSON.stringify({
            playbookId: "playbook_123",
            clientId: "victim_client_2",
            rating: 5,
          }),
        },
      );
      const res = await saveFeedback(req);
      expect(res.status).toBe(403);
    });

    it("allows a client to submit feedback for themselves", async () => {
      mocks.getCurrentUser.mockResolvedValue({
        uid: "client_user_1",
        role: "Client",
      });
      mocks.savePlaybookFeedback.mockResolvedValue("feedback_id_123");

      const req = new Request(
        "http://localhost:3000/api/funding-playbook/feedback",
        {
          method: "POST",
          body: JSON.stringify({
            playbookId: "playbook_123",
            clientId: "client_user_1",
            rating: 5,
          }),
        },
      );
      const res = await saveFeedback(req);
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/funding-playbook/webhook", () => {
    it("rejects webhook request when ADMIN_ACCESS_KEY header is missing", async () => {
      const req = new Request(
        "http://localhost:3000/api/funding-playbook/webhook",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "client_123" }),
        },
      );
      const res = await webhookRoute(req);
      expect(res.status).toBe(401);
    });

    it("rejects webhook request when ADMIN_ACCESS_KEY header is invalid", async () => {
      const req = new Request(
        "http://localhost:3000/api/funding-playbook/webhook",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ADMIN_ACCESS_KEY: "wrong-key",
          },
          body: JSON.stringify({ userId: "client_123" }),
        },
      );
      const res = await webhookRoute(req);
      expect(res.status).toBe(401);
    });
  });
});
