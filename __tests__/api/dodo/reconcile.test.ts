/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  getUser: vi.fn(),
  reconcile: vi.fn(),
}));

vi.mock("@/lib/api-validation", () => ({
  authenticateRequest: mocks.authenticate,
}));
vi.mock("@/service/user", () => ({ getUserById: mocks.getUser }));
vi.mock("@/service/dodo", () => ({
  reconcileLegacyMemberships: mocks.reconcile,
}));

import { POST } from "@/app/api/admin/dodo/memberships/reconcile/route";

describe("Dodo membership reconciliation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticate.mockResolvedValue({ uid: "admin" });
    mocks.getUser.mockResolvedValue({ role: "Admin" });
    mocks.reconcile.mockResolvedValue({ runId: "run_1", apply: false });
  });

  it("runs observe-only inventory by default", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/dodo/memberships/reconcile", {
        method: "POST",
        body: JSON.stringify({}),
      }) as any,
    );
    expect(response.status).toBe(200);
    expect(mocks.reconcile).toHaveBeenCalledWith({ apply: false });
  });

  it("rejects non-admin users", async () => {
    mocks.getUser.mockResolvedValueOnce({ role: "Client" });
    const response = await POST(
      new Request("http://localhost/api/admin/dodo/memberships/reconcile", {
        method: "POST",
      }) as any,
    );
    expect(response.status).toBe(403);
    expect(mocks.reconcile).not.toHaveBeenCalled();
  });
});
