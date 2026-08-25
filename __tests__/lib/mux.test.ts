/// <reference types="vitest/globals" />
import Mux from "@mux/mux-node";
import { workAsyncStorageInstance } from "next/dist/server/app-render/work-async-storage-instance";

const mocks = vi.hoisted(() => {
  const mockRecordMuxData = vi.fn();
  const mockRemoveChapterVideo = vi.fn();
  return {
    mockRecordMuxData,
    mockRemoveChapterVideo,
  };
});

const { mockRecordMuxData, mockRemoveChapterVideo } = mocks;

vi.mock("@/service/educational-materials/chapter", () => ({
  recordMuxData: mocks.mockRecordMuxData,
  removeChapterVideo: mocks.mockRemoveChapterVideo,
}));

describe("lib/mux", () => {
  let mockUploadsCreate: any;
  let mockUploadsRetrieve: any;
  let mockAssetsRetrieve: any;
  let mockAssetsDelete: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadsCreate = vi.spyOn(Mux.Video.Uploads.prototype, "create");
    mockUploadsRetrieve = vi.spyOn(Mux.Video.Uploads.prototype, "retrieve");
    mockAssetsRetrieve = vi.spyOn(Mux.Video.Assets.prototype, "retrieve");
    mockAssetsDelete = vi.spyOn(Mux.Video.Assets.prototype, "delete");
    vi.spyOn(workAsyncStorageInstance, "getStore").mockReturnValue({
      incrementalCache: {
        revalidateTag: vi.fn(),
      } as any,
      route: "/",
    } as any);
  });
  describe("createUploadUrl", () => {
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
    it("records mux data when asset_id is available immediately and status is ready", async () => {
      const { updateChapterVideo } = await import("@/lib/mux");
      mockUploadsRetrieve.mockResolvedValueOnce({
        asset_id: "asset-xyz",
      });

      mockAssetsRetrieve.mockResolvedValueOnce({
        id: "asset-xyz",
        status: "ready",
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

    it("deletes previousAssetId if provided and different from new asset id", async () => {
      const { updateChapterVideo } = await import("@/lib/mux");
      mockUploadsRetrieve.mockResolvedValueOnce({
        asset_id: "asset-new",
      });

      mockAssetsRetrieve.mockResolvedValueOnce({
        id: "asset-new",
        status: "ready",
        playback_ids: [{ id: "playback-new" }],
      });

      mockRecordMuxData.mockResolvedValueOnce(undefined);
      mockAssetsDelete.mockResolvedValueOnce(undefined);

      const result = await updateChapterVideo({
        uploadId: "upload-abc",
        chapterId: "chapter-1",
        courseId: "course-1",
        previousAssetId: "asset-old",
      });

      expect(result).toEqual({ success: true });
      expect(mockAssetsDelete).toHaveBeenCalledWith("asset-old");
    });

    it("throws when asset_id is never available (all retries exhausted)", async () => {
      const { updateChapterVideo } = await import("@/lib/mux");
      const originalSetTimeout = global.setTimeout;
      // Immediately invoke timer callbacks to avoid real delays
      // @ts-ignore
      global.setTimeout = (fn: Function) => {
        fn();
        return 0 as any;
      };

      mockUploadsRetrieve.mockResolvedValue({ asset_id: null });

      try {
        await expect(
          updateChapterVideo({
            uploadId: "upload-never-ready",
            chapterId: "chapter-1",
            courseId: "course-1",
          }),
        ).rejects.toThrow("Video processing timed out. Please try again.");
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });
  });

  describe("deleteChapterVideo", () => {
    it("deletes mux asset and removes chapter video record when assetId is provided", async () => {
      const { deleteChapterVideo } = await import("@/lib/mux");
      mockAssetsDelete.mockResolvedValueOnce(undefined);
      mockRemoveChapterVideo.mockResolvedValueOnce(undefined);

      const result = await deleteChapterVideo({
        courseId: "course-1",
        chapterId: "chapter-1",
        assetId: "asset-123",
      });

      expect(result).toEqual({ success: true });
      expect(mockAssetsDelete).toHaveBeenCalledWith("asset-123");
      expect(mockRemoveChapterVideo).toHaveBeenCalledWith({
        courseId: "course-1",
        chapterId: "chapter-1",
      });
    });

    it("removes chapter video record without deleting mux asset when assetId is not provided", async () => {
      const { deleteChapterVideo } = await import("@/lib/mux");
      mockRemoveChapterVideo.mockResolvedValueOnce(undefined);

      const result = await deleteChapterVideo({
        courseId: "course-1",
        chapterId: "chapter-1",
      });

      expect(result).toEqual({ success: true });
      expect(mockAssetsDelete).not.toHaveBeenCalled();
      expect(mockRemoveChapterVideo).toHaveBeenCalledWith({
        courseId: "course-1",
        chapterId: "chapter-1",
      });
    });

    it("throws error when removeChapterVideo fails", async () => {
      const { deleteChapterVideo } = await import("@/lib/mux");
      mockRemoveChapterVideo.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        deleteChapterVideo({
          courseId: "course-1",
          chapterId: "chapter-1",
        }),
      ).rejects.toThrow("Could not delete chapter video.");
    });
  });
});
