"use client";

import axios from "axios";
import { Trash } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/confirm-modal";
import { toast } from "sonner";
import { useConfettiStore } from "@/hooks/use-confetti-store";

interface ActionsProps {
  disabled: boolean;
  courseId: string;
  isPublished: boolean;
}

export const Actions = ({ disabled, courseId, isPublished }: ActionsProps) => {
  const router = useRouter();
  const confetti = useConfettiStore();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    const notification = toast.loading("Please wait...");
    try {
      setIsLoading(true);

      if (isPublished) {
        await axios.patch(`/api/courses/${courseId}/unpublish`);
        toast.success("Course unpublished", {
          id: notification,
        });
      } else {
        await axios.patch(`/api/courses/${courseId}/publish`);
        toast.success("Course published", {
          id: notification,
        });
        confetti.onOpen();
      }

      router.refresh();
    } catch {
      toast.error("Something went wrong", {
        id: notification,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    const notification = toast.loading("Please wait...");
    try {
      setIsLoading(true);

      await axios.delete(`/api/courses/${courseId}`);

      toast.success("Course deleted", {
        id: notification,
      });
      router.refresh();
      router.push(`/admin/educational-materials`);
    } catch {
      toast.error("Something went wrong", {
        id: notification,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        variant="outline"
        size="sm"
        className="cursor-pointer"
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button
          size="sm"
          variant={"outline"}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <Trash className="h-4 w-4" color="red" />
        </Button>
      </ConfirmModal>
    </div>
  );
};
