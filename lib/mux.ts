"use server";
import {
  recordMuxData,
  removeChapterVideo,
} from "@/service/educational-materials/chapter";
import Mux from "@mux/mux-node";
import { revalidatePath } from "next/cache";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export const createUploadUrl = async () => {
  try {
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ["public"],
        encoding_tier: "baseline",
      },
      // It's recommended to set this to your actual domain in production
      cors_origin: "*",
    });

    if (!upload) {
      throw new Error("Failed to create upload URL");
    }

    // Return only the necessary data to the client
    return { id: upload.id, url: upload.url };
  } catch (error) {
    console.error("Error creating Mux upload URL:", error);
    throw new Error("Could not create video upload URL.");
  }
};

const waitForThreeSeconds = () =>
  new Promise((resolve) => setTimeout(resolve, 3000));

export const updateChapterVideo = async ({
  uploadId,
  chapterId,
  courseId,
  previousAssetId,
}: {
  uploadId: string;
  chapterId: string;
  courseId: string;
  previousAssetId?: string;
}) => {
  let attempts = 0;
  while (attempts <= 10) {
    try {
      const upload = await mux.video.uploads.retrieve(uploadId);

      if (upload?.asset_id) {
        const asset = await mux.video.assets.retrieve(upload.asset_id);

        if (!asset?.playback_ids?.[0]?.id) {
          throw new Error("Asset created but playback ID is not available.");
        }
        await recordMuxData({
          assetId: asset.id,
          playbackId: asset.playback_ids[0].id,
          chapterId,
          courseId,
        });

        if (previousAssetId && previousAssetId !== asset.id) {
          await deleteMuxVideo(previousAssetId);
        }

        // Clear the Next.js cache for the page to show the updated video
        revalidatePath(`/courses/${courseId}/chapters/${chapterId}`);
        revalidatePath(
          `/admin/educational-materials/courses/${courseId}/chapters/${chapterId}`,
        );
        return { success: true };
      }
    } catch (error) {
      console.error(
        `Polling attempt ${attempts + 1} failed for upload ${uploadId}:`,
        error,
      );
    }

    await waitForThreeSeconds();
    attempts++;
  }

  throw new Error("Video processing failed after multiple attempts.");
};

export const deleteMuxVideo = async (assetId: string) => {
  try {
    await mux.video.assets.delete(assetId);
  } catch (error) {
    console.error("Error deleting Mux video:", error);
  }
};

export const deleteChapterVideo = async ({
  courseId,
  chapterId,
  assetId,
}: {
  courseId: string;
  chapterId: string;
  assetId?: string;
}) => {
  try {
    if (assetId) {
      await deleteMuxVideo(assetId);
    }

    await removeChapterVideo({ courseId, chapterId });

    revalidatePath(`/courses/${courseId}/chapters/${chapterId}`);
    revalidatePath(
      `/admin/educational-materials/courses/${courseId}/chapters/${chapterId}`,
    );

    return { success: true };
  } catch (error) {
    console.error("Error deleting chapter video:", error);
    throw new Error("Could not delete chapter video.");
  }
};
