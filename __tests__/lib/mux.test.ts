import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockUploadsCreate,
  mockUploadsRetrieve,
  mockAssetsRetrieve,
  mockAssetsDelete,
  mockRecordMuxData,
} = vi.hoisted(() => {
  const mockUploadsCreate = vi.fn();
  const mockUploadsRetrieve = vi.fn();
  const mockAssetsRetrieve = vi.fn();
  const mockAssetsDelete = vi.fn();
  const mockRecordMuxData = vi.fn();
  return {
    mockUploadsCreate,
    mockUploadsRetrieve,
    mockAssetsRetrieve,
    mockAssetsDelete,
    mockRecordMuxData,
  };
});

vi.mock("@mux/mux-node", () => {
  return {
    default: vi.fn().mockImplementation(function (this: any) {
      this.video = {
        uploads: {
          create: mockUploadsCreate,
          retrieve: mockUploadsRetrieve,
        },
        assets: {
          retrieve: mockAssetsRetrieve,
          delete: mockAssetsDelete,
        },
      };
    }),
  };
});

vi.mock("@/service/educational-materials/chapter", () => ({
  recordMuxData: mockRecordMuxData,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("createUploadUrl", () => {
  beforeEach(() => {
    mockUploadsCreate.mockReset();
  });

  it("returns upload id and url on success", async () => {
    const { createUploadUrl } = await import("@/lib/mux");
    mockUploadsCreate.mockResolvedValueOnce({
      id: "upload-123",
      url: "https://storage.googleapis.com/upload/123",
    });

    const result = await createUploadUrl();

    expect(result).toEqual({
      id: "upload-123",
      url: "https://storage.googleapis.com/upload/123",
    });
    expect(mockUploadsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        new_asset_settings: expect.objectContaining({
          playback_policy: ["public"],
        }),
        cors_origin: "*",
      }),
    );
  });

  it("throws when uploads.create returns falsy", async () => {
    const { createUploadUrl } = await import("@/lib/mux");
    mockUploadsCreate.mockResolvedValueOnce(null);

    await expect(createUploadUrl()).rejects.toThrow(
      "Could not create video upload URL.",
    );
  });

  it("throws when uploads.create rejects", async () => {
    const { createUploadUrl } = await import("@/lib/mux");
    mockUploadsCreate.mockRejectedValueOnce(new Error("Mux API error"));

    await expect(createUploadUrl()).rejects.toThrow(
      "Could not create video upload URL.",
    );
  });
});

describe("deleteMuxVideo", () => {
  beforeEach(() => {
    mockAssetsDelete.mockReset();
  });

  it("deletes the asset by assetId", async () => {
    const { deleteMuxVideo } = await import("@/lib/mux");
    mockAssetsDelete.mockResolvedValueOnce(undefined);

    await expect(deleteMuxVideo("asset-abc")).resolves.toBeUndefined();
    expect(mockAssetsDelete).toHaveBeenCalledWith("asset-abc");
  });

  it("does not throw when delete fails (error is caught)", async () => {
    const { deleteMuxVideo } = await import("@/lib/mux");
    mockAssetsDelete.mockRejectedValueOnce(new Error("Not found"));

    // The function catches errors internally and does not rethrow
    await expect(deleteMuxVideo("asset-missing")).resolves.toBeUndefined();
  });
});

describe("updateChapterVideo", () => {
  beforeEach(() => {
    mockUploadsRetrieve.mockReset();
    mockAssetsRetrieve.mockReset();
    mockRecordMuxData.mockReset();
  });

  it("records mux data when asset_id is available immediately", async () => {
    const { updateChapterVideo } = await import("@/lib/mux");

    mockUploadsRetrieve.mockResolvedValueOnce({
      asset_id: "asset-xyz",
    });

    mockAssetsRetrieve.mockResolvedValueOnce({
      id: "asset-xyz",
      playback_ids: [{ id: "playback-111" }],
    });

    mockRecordMuxData.mockResolvedValueOnce(undefined);

    const result = await updateChapterVideo({
      uploadId: "upload-abc",
      chapterId: "chapter-1",
      courseId: "course-1",
    });

    expect(result).toEqual({ success: true });
    expect(mockRecordMuxData).toHaveBeenCalledWith({
      assetId: "asset-xyz",
      playbackId: "playback-111",
      chapterId: "chapter-1",
      courseId: "course-1",
    });
  });

  it("throws when asset_id is never available (all retries exhausted)", async () => {
    const { updateChapterVideo } = await import("@/lib/mux");

    // Mock all 11 attempts (0..10) to return no asset_id
    // Also need to mock waitForThreeSeconds - we stub the timeout by mocking uploads.retrieve
    // Since waitForThreeSeconds uses setTimeout, we override it per call
    const originalSetTimeout = global.setTimeout;
    // @ts-ignore
    global.setTimeout = (fn: Function) => fn(); // execute immediately

    mockUploadsRetrieve.mockResolvedValue({ asset_id: null });

    await expect(
      updateChapterVideo({
        uploadId: "upload-never-ready",
        chapterId: "chapter-1",
        courseId: "course-1",
      }),
    ).rejects.toThrow("Video processing failed after multiple attempts.");

    global.setTimeout = originalSetTimeout;
  }, 15000);
});
