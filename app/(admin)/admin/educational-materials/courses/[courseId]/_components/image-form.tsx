"use client";

import axios from "axios";
import { Pencil, PlusCircle, ImageIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Course } from "@/schema/educational-materials/course";
import { toast } from "sonner";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { useCourseMutation } from "@/hooks/educational-materials/course";

interface ImageFormProps {
  initialData: Course;
  courseId: string;
}

export const ImageForm = ({ initialData, courseId }: ImageFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toggleEdit = () => setIsEditing((current) => !current);

  const { updateCourse, isUpdating } = useCourseMutation();
  const router = useRouter();

  const handleDrop = useCallback(
    async (droppedFiles: File[]) => {
      if (!droppedFiles || droppedFiles.length === 0) return;
      setIsLoading(true);

      const formData = new FormData();
      droppedFiles.forEach((file) => {
        formData.append("files", file);
      });

      try {
        const response = await fetch(`/api/courses/${courseId}/image`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error);
        }

        const result = await response.json();
        updateCourse({
          id: courseId,
          data: { imageUrl: result.data[0].gcsPath },
        });

        toast.success("Course updated");
        toggleEdit();
        router.refresh();
      } catch (error: any) {
        console.error(error);
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    },
    [courseId, router]
  );

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Course image
        <Button onClick={toggleEdit} variant="ghost" className="cursor-pointer">
          {isEditing && <>Cancel</>}
          {!isEditing && !initialData.imageUrl && (
            <>
              <PlusCircle className="h-4 w-4" />
              Add an image
            </>
          )}
          {!isEditing && initialData.imageUrl && (
            <>
              <Pencil className="h-4 w-4" />
              Edit image
            </>
          )}
        </Button>
      </div>
      {!isEditing &&
        (!initialData.imageUrl ? (
          <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md">
            <ImageIcon className="h-10 w-10 text-slate-500" />
          </div>
        ) : (
          <div className="relative aspect-video mt-2">
            <Image
              alt="Upload"
              fill
              className="object-cover rounded-md"
              src={initialData.imageUrl}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ))}
      {isEditing && (
        <div>
          <Dropzone
            maxFiles={1}
            className="cursor-pointer"
            onDrop={handleDrop}
            disabled={isLoading}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
          <div className="text-xs text-muted-foreground mt-4">
            16:9 aspect ratio recommended
          </div>
        </div>
      )}
    </div>
  );
};
