"use client";

import * as z from "zod";
import axios from "axios";
import { PlusCircle, File, Loader2, X, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Course } from "@/schema/educational-materials/course";
import { toast } from "sonner";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { useCourseMutation } from "@/hooks/educational-materials/course";

interface AttachmentFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  url: z.string().min(1),
});

export const AttachmentForm = ({
  initialData,
  courseId,
}: AttachmentFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toggleEdit = () => setIsEditing((current) => !current);
  const {
    uploadCourseAttachment,
    isUploadingAttachment,
    deleteCourseAttachment,
    isDeletingAttachment,
  } = useCourseMutation();

  const router = useRouter();

  const handleDrop = useCallback(
    async (droppedFiles: File[]) => {
      if (!droppedFiles || droppedFiles.length === 0) return;

      const formData = new FormData();
      droppedFiles.forEach((file) => {
        formData.append("files", file);
      });

      try {
        await uploadCourseAttachment({ courseId, formData });

        toast.success(
          `${droppedFiles.length} file${
            droppedFiles.length > 1 ? "s" : ""
          } uploaded successfully`,
        );
        toggleEdit();
        router.refresh();
      } catch (error: any) {
        console.error(error);
        toast.error(error?.message || "Failed to upload attachments");
      }
    },
    [courseId, router, uploadCourseAttachment],
  );

  const onDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteCourseAttachment({ courseId, attachmentId: id });
      toast.success("Attachment deleted");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between pb-2">
        Course attachments
        <Button
          onClick={toggleEdit}
          variant="ghost"
          className="cursor-pointer"
          disabled={isUploadingAttachment}
        >
          {isEditing && <>Cancel</>}
          {!isEditing && (
            <>
              <PlusCircle className="h-4 w-4" />
              Add a file
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <>
          {initialData.attachments?.length === 0 && (
            <p className="text-sm mt-2 text-slate-500 italic">
              No attachments yet
            </p>
          )}
          {initialData.attachments && initialData.attachments?.length > 0 && (
            <div className="space-y-2">
              {initialData.attachments?.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center p-3 w-full bg-sky-100 border-sky-200 border text-sky-700 rounded-md"
                >
                  <File className="h-4 w-4 mr-2 flex-shrink-0" />
                  <p className="text-xs line-clamp-1">{attachment.name}</p>
                  {deletingId === attachment.id && (
                    <div>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {deletingId !== attachment.id && (
                    <Button
                      onClick={() => onDelete(attachment.id!)}
                      disabled={!!deletingId}
                      variant={"destructive"}
                      className="ml-auto hover:opacity-75 transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {isEditing && (
        <div>
          <div className="relative">
            {isUploadingAttachment && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-10 flex flex-col items-center justify-center rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-sky-700 mb-2" />
                <span className="text-sm font-medium text-slate-700">
                  Uploading attachments...
                </span>
              </div>
            )}
            <Dropzone
              className="cursor-pointer"
              onDrop={handleDrop}
              disabled={isUploadingAttachment}
              maxFiles={50}
            >
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>
          </div>
          <div className="text-xs text-muted-foreground mt-4">
            Upload single or multiple files (PDFs, spreadsheets, templates,
            documents).
          </div>
        </div>
      )}
    </div>
  );
};
