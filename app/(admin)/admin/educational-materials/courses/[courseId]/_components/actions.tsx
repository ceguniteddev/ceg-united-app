"use client";

import { Eye, EyeOff, Loader2, Trash } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/confirm-modal";
import { toast } from "sonner";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { useCourseMutation } from "@/hooks/educational-materials/course";

interface ActionsProps {
  disabled: boolean;
  courseId: string;
  isPublished: boolean;
}

export const Actions = ({ disabled, courseId, isPublished }: ActionsProps) => {
  const router = useRouter();
  const confetti = useConfettiStore();
  const {
    deleteCourse,
    isDeleting,
    publishCourse,
    isPublishing,
    unpublishCourse,
    isUnpublishing,
  } = useCourseMutation();

  const onClick = async () => {
    const notification = toast.loading(
      isPublished ? "Unpublishing course..." : "Publishing course...",
    );
    try {
      if (isPublished) {
        await unpublishCourse(courseId);
        toast.success("Course unpublished", {
          id: notification,
        });
      } else {
        await publishCourse(courseId);
        toast.success("Course published", {
          id: notification,
        });
        confetti.onOpen();
      }
    } catch {
      toast.error("Something went wrong", {
        id: notification,
      });
    }
  };

  const onDelete = async () => {
    const notification = toast.loading("Deleting course...");
    try {
      await deleteCourse(courseId);
      toast.success("Course deleted", {
        id: notification,
      });

      router.push(`/admin/educational-materials`);
    } catch {
      toast.error("Something went wrong", {
        id: notification,
      });
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <Button
        onClick={onClick}
        disabled={disabled || isPublishing || isUnpublishing || isDeleting}
        variant="outline"
        size="sm"
        className="cursor-pointer"
      >
        {isPublishing || isUnpublishing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {isPublished ? "Unpublishing..." : "Publishing..."}
          </>
        ) : isPublished ? (
          <>
            <EyeOff className="h-4 w-4 mr-2" />
            Unpublish
          </>
        ) : (
          <>
            <Eye className="h-4 w-4 mr-2" />
            Publish
          </>
        )}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button
          size="sm"
          variant={"outline"}
          disabled={isDeleting || isPublishing || isUnpublishing}
          className="cursor-pointer"
        >
          <Trash className="h-4 w-4" color="red" />
        </Button>
      </ConfirmModal>
    </div>
  );
};
