import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks ---
const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();

const mockDocRef = {
  get: mockGet,
  update: mockUpdate,
  set: mockSet,
};

const mockCollectionRef = {
  doc: vi.fn().mockReturnValue(mockDocRef),
};

const mockDb = {
  collection: vi.fn().mockReturnValue(mockCollectionRef),
};

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(() => mockDb),
}));

vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
}));

const mockGetCurrentUser = vi.fn();
vi.mock("@/service/user", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock("@/constant/collection-name", () => ({
  PSF_INVOICES_COLLECTION: "psf-invoices",
}));

import { POST } from "@/app/api/user/[userId]/psf-invoices/[invoiceId]/manual-pay/route";

const params = (userId: string, invoiceId: string) =>
  ({ params: Promise.resolve({ userId, invoiceId }) }) as any;

function makeRequest() {
  return new NextRequest(
    "http://localhost/api/user/user-1/psf-invoices/invoice-1/manual-pay",
    {
      method: "POST",
    },
  );
}

describe("POST /api/user/[userId]/psf-invoices/[invoiceId]/manual-pay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return unauthorized (401) if no current user", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await POST(makeRequest(), params("user-1", "invoice-1"));
    expect(res.status).toBe(401);
  });

  it("should return unauthorized (401) if currentUser is not an Admin", async () => {
    mockGetCurrentUser.mockResolvedValue({ role: "Client", uid: "admin-1" });
    const res = await POST(makeRequest(), params("user-1", "invoice-1"));
    expect(res.status).toBe(401);
  });

  it("should return badRequest (400) if userId or invoiceId is missing", async () => {
    mockGetCurrentUser.mockResolvedValue({ role: "Admin", uid: "admin-1" });
    const res = await POST(makeRequest(), {
      params: Promise.resolve({ userId: "", invoiceId: "" }),
    } as any);
    expect(res.status).toBe(400);
  });

  it("should return badRequest (400) if invoice does not exist", async () => {
    mockGetCurrentUser.mockResolvedValue({ role: "Admin", uid: "admin-1" });
    mockGet.mockResolvedValue({ exists: false });

    const res = await POST(makeRequest(), params("user-1", "invoice-1"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.errors).toContain("PSF invoice not found.");
  });

  it("should return badRequest (400) if invoice does not belong to the user", async () => {
    mockGetCurrentUser.mockResolvedValue({ role: "Admin", uid: "admin-1" });
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "different-user",
        status: "pending",
      }),
    });

    const res = await POST(makeRequest(), params("user-1", "invoice-1"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.errors).toContain("Invoice does not belong to this user.");
  });

  it("should return badRequest (400) if invoice status is already paid", async () => {
    mockGetCurrentUser.mockResolvedValue({ role: "Admin", uid: "admin-1" });
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "user-1",
        status: "paid",
      }),
    });

    const res = await POST(makeRequest(), params("user-1", "invoice-1"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.errors).toContain("Invoice is already paid.");
  });

  it("should manually update invoice status to paid and return 200", async () => {
    mockGetCurrentUser.mockResolvedValue({ role: "Admin", uid: "admin-1" });
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "user-1",
        status: "pending",
        amount: 500,
      }),
    });
    mockUpdate.mockResolvedValue(undefined);

    const res = await POST(makeRequest(), params("user-1", "invoice-1"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain("Invoice successfully marked as paid.");

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "paid",
        manuallyPaidBy: "admin-1",
      }),
    );
  });
});
