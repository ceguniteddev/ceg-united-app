"use client";

import { Eye, EyeOff, Loader2, Trash } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/confirm-modal";
import { toast } from "sonner";
import { useChapterMutation } from "@/hooks/educational-materials/chapter";

interface ChapterActionsProps {
  disabled: boolean;
  courseId: string;
  chapterId: string;
  isPublished: boolean;
}

export const ChapterActions = ({
  disabled,
  courseId,
  chapterId,
  isPublished,
}: ChapterActionsProps) => {
  const router = useRouter();
  const {
    unpublishChapter,
    isUnpublishing,
    publishChapter,
    isPublishing,
    deleteChapter,
    isDeleting,
  } = useChapterMutation();

  const onClick = async () => {
    const notification = toast.loading(
      isPublished ? "Unpublishing chapter..." : "Publishing chapter...",
    );
    try {
      if (isPublished) {
        await unpublishChapter({ courseId, chapterId });
        toast.success("Chapter unpublished", {
          id: notification,
        });
      } else {
        await publishChapter({ courseId, chapterId });
        toast.success("Chapter published", {
          id: notification,
        });
      }

      router.refresh();
    } catch {
      toast.error("Something went wrong", {
        id: notification,
      });
    }
  };

  const onDelete = async () => {
    if (isPublished) {
      toast.error(
        "Cannot delete a published chapter. Please unpublish it first.",
      );
      return;
    }

    const notification = toast.loading("Deleting chapter...");
    try {
      await deleteChapter({ courseId, chapterId });

      toast.success("Chapter deleted", {
        id: notification,
      });
      router.refresh();
      router.push(`/admin/educational-materials/courses/${courseId}`);
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong", {
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
        className="cursor-pointer"
        size="sm"
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
      <ConfirmModal
        onConfirm={onDelete}
        description="This will permanently delete this chapter. This action cannot be undone."
      >
        <Button
          size="sm"
          variant={"destructive"}
          disabled={
            disabled ||
            isPublishing ||
            isUnpublishing ||
            isDeleting ||
            isPublished
          }
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          title={
            isPublished
              ? "Cannot delete a published chapter. Unpublish it first."
              : "Delete chapter"
          }
        >
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
};
