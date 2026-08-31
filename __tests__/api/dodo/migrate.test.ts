/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), migrate: vi.fn() }));
vi.mock("@/lib/api-validation", () => ({
  authenticateRequest: mocks.authenticate,
}));
vi.mock("@/service/dodo", () => ({
  createWhopMigrationCheckout: mocks.migrate,
}));

import { POST } from "@/app/api/user/[userId]/billing/migrate/route";

describe("Whop to Dodo migration checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticate.mockResolvedValue({ uid: "u1" });
    mocks.migrate.mockResolvedValue({ checkoutId: "cks", url: "https://dodo" });
  });

  it("starts migration for the authenticated client", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ target: "membership" }),
      }) as any,
      { params: Promise.resolve({ userId: "u1" }) },
    );
    expect(response.status).toBe(200);
    expect(mocks.migrate).toHaveBeenCalledWith({
      userId: "u1",
      target: "membership",
    });
  });

  it("rejects another client's request", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ target: "membership" }),
      }) as any,
      { params: Promise.resolve({ userId: "u2" }) },
    );
    expect(response.status).toBe(403);
  });
});
