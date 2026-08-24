"use client";

import MuxPlayer from "@mux/mux-player-react";
import { Loader2, Pencil, PlusCircle, Trash, Video } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/confirm-modal";
import { Chapter } from "@/schema/educational-materials/course";
import MuxUploader from "./MuxUploader";

import { createUploadUrl } from "@/lib/mux";
import { useChapterMutation } from "@/hooks/educational-materials/chapter";

interface ChapterVideoFormProps {
  initialData: Chapter;
  courseId: string;
  chapterId: string;
}

export const ChapterVideoForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterVideoFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const uploadIdRef = useRef<string | null>(null);
  const router = useRouter();
  const { updateChapterVideo, deleteChapterVideo, isDeletingVideo } =
    useChapterMutation();

  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
    uploadIdRef.current = null;
  };

  const getUploadUrl = async () => {
    try {
      const newUpload = await createUploadUrl();
      uploadIdRef.current = newUpload.id;
      return newUpload.url;
    } catch (error) {
      toast.error("Could not create video upload URL. Please try again.");
      console.error(error);
      throw error;
    }
  };

  const handleUploadSuccess = async () => {
    const uploadId = uploadIdRef.current;
    if (!uploadId) return;

    try {
      setIsProcessing(true);
      // The file is now with Mux. Tell our server to process it.
      await updateChapterVideo({
        uploadId,
        chapterId,
        courseId,
        previousAssetId: initialData?.muxData?.assetId,
      });

      toast.success("Chapter video updated successfully.");
      setIsEditing(false);
      uploadIdRef.current = null;
      router.refresh(); // Refresh the page to show the new video player
    } catch (error) {
      toast.error("Failed to process the video. Please try again.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteVideo = async () => {
    try {
      await deleteChapterVideo({
        courseId,
        chapterId,
        assetId: initialData?.muxData?.assetId,
      });
      toast.success("Video deleted successfully.");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete video. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Chapter video
        <div className="flex items-center gap-x-2">
          {initialData.videoUrl && !isEditing && (
            <ConfirmModal
              onConfirm={handleDeleteVideo}
              description="This will permanently delete the video from this chapter and from Mux. This action cannot be undone."
            >
              <Button
                variant="outline"
                size="sm"
                disabled={isDeletingVideo || isProcessing}
                className="cursor-pointer text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                {isDeletingVideo ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash className="h-4 w-4 mr-2" />
                    Delete video
                  </>
                )}
              </Button>
            </ConfirmModal>
          )}
          <Button
            onClick={toggleEdit}
            variant="ghost"
            className="cursor-pointer"
            disabled={isDeletingVideo || isProcessing}
          >
            {isEditing && <>Cancel</>}
            {!isEditing && !initialData.videoUrl && (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add a video
              </>
            )}
            {!isEditing && initialData.videoUrl && (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Edit video
              </>
            )}
          </Button>
        </div>
      </div>
      {!isEditing &&
        (!initialData.videoUrl ? (
          <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md">
            <Video className="h-10 w-10 text-slate-500" />
          </div>
        ) : (
          <div className="relative aspect-video mt-2">
            <MuxPlayer playbackId={initialData?.muxData?.playbackId || ""} />
          </div>
        ))}
      {isEditing && (
        <div>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center h-60 bg-slate-200 rounded-md gap-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
              <p className="text-sm text-slate-600">
                Processing video with Mux...
              </p>
            </div>
          ) : (
            <MuxUploader
              onSuccess={handleUploadSuccess}
              endpoint={getUploadUrl}
            />
          )}
          <div className="text-xs text-muted-foreground mt-4">
            {`Upload this chapter's video.`}
          </div>
        </div>
      )}
      {initialData.videoUrl && !isEditing && (
        <div className="text-xs text-muted-foreground mt-2">
          Videos can take a few minutes to process. Refresh the page if the
          video does not appear.
        </div>
      )}
    </div>
  );
};
