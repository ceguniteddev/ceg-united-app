"use client";

import MuxPlayer from "@mux/mux-player-react";
import { Pencil, PlusCircle, Video } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Chapter } from "@/schema/educational-materials/course";
import MuxUploader from "./MuxUploader";

// Import the server actions you just created
import { createUploadUrl, updateChapterVideo } from "@/lib/mux";

interface ChapterVideoFormProps {
  initialData: Chapter & {
    muxData?: { id: string; assetId: string; playbackId: string } | null;
  };
  courseId: string;
  chapterId: string;
}

export const ChapterVideoForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterVideoFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<{
    id: string;
    url: string;
  } | null>(null);
  const router = useRouter();

  const toggleEdit = async () => {
    if (isEditing) {
      // If canceling edit, just reset the state
      setIsEditing(false);
      setUploadInfo(null);
    } else {
      // When entering edit mode, create a new upload URL on the server
      try {
        const newUpload = await createUploadUrl();
        setUploadInfo(newUpload);
        setIsEditing(true);
      } catch (error) {
        toast.error("Something went wrong. Please try again.");
        console.error(error);
      }
    }
  };

  const handleUploadSuccess = async () => {
    if (!uploadInfo) return;

    try {
      // The file is now with Mux. Tell our server to process it.
      await updateChapterVideo({
        uploadId: uploadInfo.id,
        chapterId: chapterId,
        courseId: courseId,
      });

      toast.success("Chapter video updated successfully.");
      setIsEditing(false);
      setUploadInfo(null);
      router.refresh(); // Refresh the page to show the new video player
    } catch (error) {
      toast.error("Failed to process the video. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Chapter video
        <Button onClick={toggleEdit} variant="ghost" className="cursor-pointer">
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
      {isEditing && uploadInfo && (
        <div>
          {/* The MuxUploader now gets its endpoint and onSuccess from our state/functions */}
          <MuxUploader
            onSuccess={handleUploadSuccess}
            endpoint={uploadInfo.url}
          />
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
