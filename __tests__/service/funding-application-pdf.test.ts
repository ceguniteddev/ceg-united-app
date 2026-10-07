import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("@/service/apply-funding", () => ({
  getApplyFundingByReferenceNumber: vi.fn(),
}));
vi.mock("@/service/user", () => ({ getUserById: vi.fn() }));
vi.mock("@/service/documents", () => ({ uploadDocument: vi.fn() }));
vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: vi.fn(),
  Document: "Document",
}));
// React is a default import; the mock must expose a `default` export with createElement
vi.mock("react", () => {
  const createElement = vi.fn().mockReturnValue({});
  return { default: { createElement }, createElement };
});
vi.mock("@/components/pdf/FundingApplicationDocument", () => ({
  FundingApplicationDocument: "FundingApplicationDocument",
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import { saveApplicationToPDF } from "@/service/funding-application-pdf";
import { getApplyFundingByReferenceNumber } from "@/service/apply-funding";
import { getUserById } from "@/service/user";
import { uploadDocument } from "@/service/documents";
import { renderToBuffer } from "@react-pdf/renderer";

// ── Tests ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveApplicationToPDF", () => {
  it("throws when no application data is found for the reference number", async () => {
    (
      getApplyFundingByReferenceNumber as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(null);
    (getUserById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
    });

    await expect(saveApplicationToPDF("REF-001", "user-1")).rejects.toThrow(
      "No application data found for this reference number",
    );
    expect(renderToBuffer).not.toHaveBeenCalled();
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it("renders PDF and uploads when application data and user are present", async () => {
    (
      getApplyFundingByReferenceNumber as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      referenceNumber: "REF-001",
      businessName: "Acme Corp",
    });
    (getUserById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
      email: "john@acme.com",
    });
    (renderToBuffer as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      Buffer.from("pdf-bytes"),
    );
    const mockUploadResult = {
      gcsPath: "documents/user-1/FUNDING_APPLICATION/REF-001.pdf",
      originalFilename: "REF-001.pdf",
      size: 2048,
      contentType: "application/pdf",
    };
    (uploadDocument as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockUploadResult,
    );

    const result = await saveApplicationToPDF("REF-001", "user-1");

    expect(renderToBuffer).toHaveBeenCalled();
    expect(uploadDocument).toHaveBeenCalledWith({
      userId: "user-1",
      file: expect.any(File),
      documentType: "FUNDING_APPLICATION",
      customMetadata: expect.objectContaining({ referenceNumber: "REF-001" }),
    });
    expect(result).toEqual(mockUploadResult);
  });
});
