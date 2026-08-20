/// <reference types="vitest/globals" />

import { NextRequest } from "next/server";

// --- Mocks ---
const mockGet = vi.fn();
const mockUpdate = vi.fn();

const mockDocRef = {
  get: mockGet,
  update: mockUpdate,
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
const mockGetUserById = vi.fn();
vi.mock("@/service/user", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
  getUserById: (...args: any[]) => mockGetUserById(...args),
}));

const mockGenerateInvoicePDF = vi.fn();
vi.mock("@/service/invoice-pdf", () => ({
  generateInvoicePDF: (...args: any[]) => mockGenerateInvoicePDF(...args),
}));

const mockSendTriggerEmail = vi.fn();
vi.mock("@/service/trigger-email", () => ({
  sendTriggerEmail: (...args: any[]) => mockSendTriggerEmail(...args),
}));

const mockUploadDocument = vi.fn();
vi.mock("@/service/documents", () => ({
  uploadDocument: (...args: any[]) => mockUploadDocument(...args),
}));

const mockCreatePsfInvoiceCheckoutConfig = vi.fn();
vi.mock("@/service/dodo", () => ({
  createPsfInvoiceCheckoutConfig: (...args: any[]) =>
    mockCreatePsfInvoiceCheckoutConfig(...args),
}));

vi.mock("@/constant/collection-name", () => ({
  PSF_INVOICES_COLLECTION: "psf-invoices",
}));

import { POST } from "@/app/api/user/[userId]/psf-invoices/[invoiceId]/send/route";

const params = (userId: string, invoiceId: string) =>
  ({ params: Promise.resolve({ userId, invoiceId }) }) as any;

function makeRequest() {
  return new NextRequest(
    "http://localhost/api/user/user-1/psf-invoices/invoice-1/send",
    {
      method: "POST",
    },
  );
}

describe("POST /api/user/[userId]/psf-invoices/[invoiceId]/send", () => {
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
    expect(json.errors).toContain("Invoice not found.");
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

  it("should return badRequest (400) if invoice status is not pending", async () => {
    mockGetCurrentUser.mockResolvedValue({ role: "Admin", uid: "admin-1" });
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "user-1",
        status: "signed",
      }),
    });

    const res = await POST(makeRequest(), params("user-1", "invoice-1"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.errors[0]).toContain(
      'Cannot send an invoice with status "signed"',
    );
  });

  it("should return internalServerError (500) if Dodo config generation fails", async () => {
    mockGetCurrentUser.mockResolvedValue({ role: "Admin", uid: "admin-1" });
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "user-1",
        status: "pending",
        amount: 500,
      }),
    });
    mockCreatePsfInvoiceCheckoutConfig.mockRejectedValue(
      new Error("Dodo error"),
    );

    const res = await POST(makeRequest(), params("user-1", "invoice-1"));
    expect(res.status).toBe(500);
  });

  it("should generate Dodo checkout config, update Firestore document, and return 200", async () => {
    mockGetCurrentUser.mockResolvedValue({ role: "Admin", uid: "admin-1" });
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        userId: "user-1",
        status: "pending",
        amount: 500,
      }),
    });
    mockCreatePsfInvoiceCheckoutConfig.mockResolvedValue({
      checkoutId: "dodo-checkout-123",
      url: "https://test.dodopayments.com/checkout/123",
    });
    mockGetUserById.mockResolvedValue({
      email: "user@example.com",
      firstName: "John",
      lastName: "Doe",
    });
    mockGenerateInvoicePDF.mockResolvedValue({
      filename: "invoice_invoice-1.pdf",
      pdfBuffer: Buffer.from("pdf-content"),
    });
    mockSendTriggerEmail.mockResolvedValue("email-job-id");
    mockUploadDocument.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);

    const res = await POST(makeRequest(), params("user-1", "invoice-1"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.url).toBe("https://test.dodopayments.com/checkout/123");

    expect(mockCreatePsfInvoiceCheckoutConfig).toHaveBeenCalledWith({
      userId: "user-1",
      invoiceId: "invoice-1",
      feeAmount: 50000,
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "signed",
        dodoCheckoutId: "dodo-checkout-123",
        dodoCheckoutUrl: "https://test.dodopayments.com/checkout/123",
      }),
    );
  });
});
