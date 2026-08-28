/// <reference types="vitest/globals" />

import { NextRequest } from "next/server";

const mockGetCurrentUser = vi.fn();
const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockCreateCheckout = vi.fn();

vi.mock("@/lib/api-validation", () => ({
  withAuth: (handler: unknown) => handler,
}));
vi.mock("@/service/user", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));
vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: () => ({
    collection: () => ({
      doc: () => ({ get: mockGet, update: mockUpdate }),
    }),
  }),
}));
vi.mock("@/service/dodo", () => ({
  createPsfInvoiceCheckoutConfig: (input: unknown) => mockCreateCheckout(input),
}));
vi.mock("@/constant/collection-name", () => ({
  PSF_INVOICES_COLLECTION: "psf-invoices",
}));

import { POST } from "@/app/api/user/[userId]/psf-invoices/[invoiceId]/checkout/route";

const context = (userId = "user-1", invoiceId = "invoice-1") =>
  ({ params: Promise.resolve({ userId, invoiceId }) }) as any;

const makeRequest = () =>
  new NextRequest(
    "http://localhost/api/user/user-1/psf-invoices/invoice-1/checkout",
    { method: "POST" },
  );

describe("POST PSF invoice checkout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects another client's invoice", async () => {
    mockGetCurrentUser.mockResolvedValue({ role: "Client", uid: "user-2" });

    expect((await POST(makeRequest(), context())).status).toBe(401);
  });

  it("rejects invoices that are not signed", async () => {
    mockGetCurrentUser.mockResolvedValue({ role: "Client", uid: "user-1" });
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "user-1", status: "paid", amount: 500 }),
    });

    expect((await POST(makeRequest(), context())).status).toBe(400);
    expect(mockCreateCheckout).not.toHaveBeenCalled();
  });

  it("creates and persists a fresh checkout for a signed invoice", async () => {
    mockGetCurrentUser.mockResolvedValue({ role: "Client", uid: "user-1" });
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "user-1",
        status: "signed",
        successFeeAmount: 3000,
      }),
    });
    mockCreateCheckout.mockResolvedValue({
      checkoutId: "cks-new",
      url: "https://checkout.example/new",
    });

    const response = await POST(makeRequest(), context());

    expect(response.status).toBe(200);
    expect(mockCreateCheckout).toHaveBeenCalledWith({
      userId: "user-1",
      invoiceId: "invoice-1",
      feeAmount: 300000,
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        dodoCheckoutId: "cks-new",
        dodoCheckoutUrl: "https://checkout.example/new",
      }),
    );
    expect(await response.json()).toEqual({
      success: true,
      url: "https://checkout.example/new",
    });
  });
});
