import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks (must be declared before vi.mock factories) ─────────────────
const { mockHeadersInstance, mockSave, mockFileDelete, mockFile, mockBucket } =
  vi.hoisted(() => {
    const mockSave = vi.fn().mockResolvedValue(undefined);
    const mockFileDelete = vi.fn().mockResolvedValue(undefined);
    const mockFile = vi
      .fn()
      .mockReturnValue({ save: mockSave, delete: mockFileDelete });
    const mockBucket = {
      file: mockFile,
      getFiles: vi.fn(),
      deleteFiles: vi.fn(),
    };
    const mockHeadersInstance = { get: vi.fn().mockReturnValue("192.168.1.1") };
    return {
      mockHeadersInstance,
      mockSave,
      mockFileDelete,
      mockFile,
      mockBucket,
    };
  });

vi.mock("@/lib/fireabase-admin", () => ({
  storageAdmin: vi.fn(() => mockBucket),
  firestoreAdmin: vi.fn(),
  authenticationAdmin: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({ logInfo: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(mockHeadersInstance),
}));
vi.mock("@/service/user", () => ({ getCurrentUser: vi.fn() }));

// ── Import after mocks ────────────────────────────────────────────────────────
import { uploadDocument, deleteDocument } from "@/service/documents";
import { getCurrentUser } from "@/service/user";
import { headers } from "next/headers";

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeMockFile = (name = "test.pdf") => {
  const mockArrayBuffer = new ArrayBuffer(10);
  return {
    name,
    type: "application/pdf",
    size: 10,
    arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
  } as unknown as File;
};

describe("service/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFile.mockReturnValue({ save: mockSave, delete: mockFileDelete });
    mockSave.mockResolvedValue(undefined);
    mockFileDelete.mockResolvedValue(undefined);
    vi.mocked(getCurrentUser).mockResolvedValue({ role: "Client" } as any);
    vi.mocked(headers).mockResolvedValue(mockHeadersInstance as any);
    mockHeadersInstance.get.mockReturnValue("192.168.1.1");
  });

  // ── uploadDocument ────────────────────────────────────────────────────────
  describe("uploadDocument", () => {
    it("uses documentType prefix in filename when documentType is provided", async () => {
      const file = makeMockFile("passport.pdf");

      const result = await uploadDocument("user-1", file, "PASSPORT");

      expect(mockFile).toHaveBeenCalledWith(
        expect.stringMatching(
          /^documents\/user-1\/PASSPORT_\d+_passport\.pdf$/,
        ),
      );
      expect(result).toEqual({
        originalFilename: "passport.pdf",
        gcsPath: expect.stringMatching(
          /^documents\/user-1\/PASSPORT_\d+_passport\.pdf$/,
        ),
        size: 10,
        contentType: "application/pdf",
      });
    });

    it("uses timestamp prefix when documentType is null", async () => {
      const file = makeMockFile("my doc.pdf");
      const before = Date.now();

      await uploadDocument("user-1", file, null);

      // The path should match: documents/user-1/<timestamp>_my_doc.pdf
      const callArg: string = mockFile.mock.calls[0][0];
      expect(callArg).toMatch(/^documents\/user-1\/\d+_my_doc\.pdf$/);
      const ts = parseInt(callArg.split("/")[2].split("_")[0]);
      expect(ts).toBeGreaterThanOrEqual(before);
    });

    it("saves buffer with content metadata including clientIP for non-admin", async () => {
      const file = makeMockFile("test.pdf");
      vi.mocked(getCurrentUser).mockResolvedValue({ role: "Client" } as any);
      mockHeadersInstance.get.mockReturnValue("10.0.0.1");

      await uploadDocument("user-1", file, "DOC_TYPE");

      expect(mockSave).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          metadata: expect.objectContaining({
            metadata: expect.objectContaining({
              contentType: "application/pdf",
              clientIP: "10.0.0.1",
            }),
          }),
        }),
      );
    });

    it("skips clientIP for admin users", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ role: "Admin" } as any);
      const file = makeMockFile("test.pdf");

      await uploadDocument("user-1", file, "DOC_TYPE");

      const saveCall = mockSave.mock.calls[0][1];
      expect(saveCall.metadata.metadata).not.toHaveProperty("clientIP");
    });

    it("includes customMetadata in saved file metadata", async () => {
      const file = makeMockFile("test.pdf");

      await uploadDocument("user-1", file, "DOC_TYPE", {
        category: "identity",
      });

      expect(mockSave).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          metadata: expect.objectContaining({
            metadata: expect.objectContaining({ category: "identity" }),
          }),
        }),
      );
    });

    it("returns correct UploadedFileData shape", async () => {
      const file = makeMockFile("report.pdf");

      const result = await uploadDocument("user-42", file, "REPORT");

      expect(result).toMatchObject({
        originalFilename: "report.pdf",
        gcsPath: expect.stringMatching(
          /^documents\/user-42\/REPORT_\d+_report\.pdf$/,
        ),
        size: 10,
        contentType: "application/pdf",
      });
    });
  });

  // ── deleteDocument ────────────────────────────────────────────────────────
  describe("deleteDocument", () => {
    it("calls bucket.file(path).delete()", async () => {
      await deleteDocument("documents/user-1/some-file.pdf");

      expect(mockFile).toHaveBeenCalledWith("documents/user-1/some-file.pdf");
      expect(mockFileDelete).toHaveBeenCalled();
    });

    it("silently ignores 404 errors", async () => {
      const notFoundError = Object.assign(new Error("Not Found"), {
        code: 404,
      });
      mockFileDelete.mockRejectedValue(notFoundError);

      await expect(
        deleteDocument("documents/user-1/missing.pdf"),
      ).resolves.toBeUndefined();
    });

    it("re-throws non-404 errors", async () => {
      const serverError = Object.assign(new Error("Server Error"), {
        code: 500,
      });
      mockFileDelete.mockRejectedValue(serverError);

      await expect(deleteDocument("documents/user-1/file.pdf")).rejects.toThrow(
        "Server Error",
      );
    });
  });
});
