import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("@/service/analysis", () => ({ getAnalysis: vi.fn() }));
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
vi.mock("@/components/pdf/FundingAnalysisDocument", () => ({
  FundingAnalysisDocument: "FundingAnalysisDocument",
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────
import { saveAnalysisToPDF } from "@/service/funding-analysis-pdf";
import { getAnalysis } from "@/service/analysis";
import { uploadDocument } from "@/service/documents";
import { renderToBuffer } from "@react-pdf/renderer";

// ── Tests ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveAnalysisToPDF", () => {
  it("throws when getAnalysis returns null", async () => {
    (getAnalysis as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    await expect(saveAnalysisToPDF("REF-001", "user-1")).rejects.toThrow(
      "No analysis data found for this reference number",
    );
    expect(renderToBuffer).not.toHaveBeenCalled();
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it("throws when getAnalysis returns an empty array", async () => {
    (getAnalysis as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    await expect(saveAnalysisToPDF("REF-001", "user-1")).rejects.toThrow(
      "No analysis data found for this reference number",
    );
    expect(renderToBuffer).not.toHaveBeenCalled();
  });

  it("renders PDF and uploads when analysis data is present", async () => {
    const mockAnalysisData = [{ id: "a1", content: "<p>Analysis content</p>" }];
    (getAnalysis as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockAnalysisData,
    );
    (renderToBuffer as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      Buffer.from("pdf-bytes"),
    );
    (uploadDocument as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      gcsPath: "users/user-1/FUNDING_ANALYSIS/REF-001.pdf",
      originalFilename: "REF-001.pdf",
      size: 1024,
      contentType: "application/pdf",
    });

    const result = await saveAnalysisToPDF("REF-001", "user-1");

    expect(renderToBuffer).toHaveBeenCalled();
    expect(uploadDocument).toHaveBeenCalledWith(
      "user-1",
      expect.any(File),
      "FUNDING_ANALYSIS",
      expect.objectContaining({ referenceNumber: "REF-001" }),
    );
    expect(result).toEqual({
      gcsPath: "users/user-1/FUNDING_ANALYSIS/REF-001.pdf",
      filename: "REF-001.pdf",
      size: 1024,
      contentType: "application/pdf",
    });
  });
});
