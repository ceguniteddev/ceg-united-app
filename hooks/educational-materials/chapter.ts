import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { COURSES_KEY, CHAPTERS_KEY } from "@/constant/react-query-keys";
import { useAuth } from "@/provider/AuthContext";
import { Chapter } from "@/schema/educational-materials/course";
import { updateChapterVideo } from "@/lib/mux";

export const useGetChapterById = ({
  courseId,
  chapterId,
}: {
  courseId: string;
  chapterId: string;
}) => {
  const { user } = useAuth();

  const {
    data: chapter,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [CHAPTERS_KEY, courseId, chapterId],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}`);

      if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
          const text = await response.text();
          if (text) message = text;
        } catch (e) {
          /* ignore */
        }
        const err: any = new Error(message);
        err.status = response.status;
        throw err;
      }

      const data = await response.json();

      return data as Chapter;
    },
    enabled: !!user && !!courseId && !!chapterId,
  });

  return {
    chapter,
    isLoading,
    isError,
    error,
    refetch,
  };
};

/**
 * Hook: useChapterMutation
 * - createChapter({ courseId, title }) -> creates a chapter via POST /api/courses/:courseId/chapters
 * - isCreating: mutation pending state
 */
export const useChapterMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const createChapterMutation = useMutation({
    mutationFn: async ({ courseId, title }: { courseId: string; title: string }) => {
      const res = await fetch(`/api/courses/${courseId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        // try to get error message from body
        let message = "Failed to create chapter";
        try {
          const json = await res.json();
          message = json?.message || message;
        } catch (_) {
          const text = await res.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      return res.json();
    },
    onSuccess: (data, context) => {
      // Notify and refresh course lists / details
      queryClient.invalidateQueries({ queryKey: [COURSES_KEY] });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, context.courseId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Something went wrong");
      console.error(error);
    },
  });

  const updateChapterMutation = useMutation({
    mutationFn: async ({
      courseId,
      chapterId,
      data,
    }: {
      courseId: string;
      chapterId: string;
      data: Partial<Chapter>;
    }) => {
      const res = await fetch(`/api/courses/${courseId}/chapters/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        let message = "Failed to update chapter";
        try {
          message = await res.text();
        } catch (_) {
          const text = await res.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      return res.json();
    },
    onSuccess: (data, context) => {
      queryClient.invalidateQueries({ queryKey: [COURSES_KEY] });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, context.courseId],
      });
      queryClient.invalidateQueries({
        queryKey: [CHAPTERS_KEY, context.courseId, context.chapterId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Something went wrong");
      console.error(error);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({
      courseId,
      list,
    }: {
      courseId: string;
      list: Array<{ id?: string; position: number }>;
    }) => {
      const res = await fetch(`/api/courses/${courseId}/chapters/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list }),
      });

      if (!res.ok) {
        let message = "Failed to reorder chapters";
        try {
          message = await res.text();
        } catch (_) {
          const text = await res.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COURSES_KEY] });
    },
    onError: (error: any) => {
      toast.error(error || "Something went wrong");
      console.error(error);
    },
  });

  const unpublishChapterMutation = useMutation({
    mutationFn: async ({ courseId, chapterId }: { courseId: string; chapterId: string }) => {
      const res = await fetch(`/api/courses/${courseId}/chapters/${chapterId}/unpublish`, {
        method: "PATCH",
      });

      if (!res.ok) {
        let message = "Failed to unpublish chapter";
        try {
          message = await res.text();
        } catch (_) {
          const text = await res.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      return res.json();
    },
    onSuccess: (data, context) => {
      queryClient.invalidateQueries({ queryKey: [COURSES_KEY] });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, context.courseId],
      });
      queryClient.invalidateQueries({
        queryKey: [CHAPTERS_KEY, context.courseId, context.chapterId],
      });
    },
    onError: (error: any) => {
      toast.error(error || "Something went wrong");
      console.error(error);
    },
  });

  const publishChapterMutation = useMutation({
    mutationFn: async ({ courseId, chapterId }: { courseId: string; chapterId: string }) => {
      const res = await fetch(`/api/courses/${courseId}/chapters/${chapterId}/publish`, {
        method: "PATCH",
      });

      if (!res.ok) {
        let message = "Failed to publish chapter";
        try {
          message = await res.text();
        } catch (_) {
          const text = await res.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      return res.json();
    },
    onSuccess: (data, context) => {
      queryClient.invalidateQueries({ queryKey: [COURSES_KEY] });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, context.courseId],
      });
      queryClient.invalidateQueries({
        queryKey: [CHAPTERS_KEY, context.courseId, context.chapterId],
      });
    },
    onError: (error: any) => {
      toast.error(error || "Something went wrong");
      console.error(error);
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async ({ courseId, chapterId }: { courseId: string; chapterId: string }) => {
      const res = await fetch(`/api/courses/${courseId}/chapters/${chapterId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        let message = "Failed to delete chapter";
        try {
          message = await res.text();
        } catch (_) {
          const text = await res.text();
          if (text) message = text;
        }
        throw new Error(message);
      }

      return res.json();
    },
    onSuccess: (data, context) => {
      queryClient.invalidateQueries({ queryKey: [COURSES_KEY] });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, context.courseId],
      });
      queryClient.invalidateQueries({
        queryKey: [CHAPTERS_KEY, context.courseId, context.chapterId],
      });
    },
    onError: (error: any) => {
      toast.error(error || "Something went wrong");
      console.error(error);
    },
  });

  const updateChapterVideoMutation = useMutation({
    mutationFn: async ({
      courseId,
      chapterId,
      uploadId,
    }: {
      courseId: string;
      chapterId: string;
      uploadId: string;
    }) => {
      await updateChapterVideo({
        uploadId: uploadId,
        chapterId: chapterId,
        courseId: courseId,
      });
    },
    onSuccess: (data, context) => {
      queryClient.invalidateQueries({ queryKey: [COURSES_KEY] });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, context.courseId],
      });
      queryClient.invalidateQueries({
        queryKey: [CHAPTERS_KEY, context.courseId, context.chapterId],
      });
    },
    onError: (error: any) => {
      toast.error(error || "Something went wrong");
      console.error(error);
    },
  });

  return {
    createChapter: createChapterMutation.mutateAsync,
    isCreating: createChapterMutation.isPending,

    reorderChapters: reorderMutation.mutateAsync,
    isReordering: reorderMutation.isPending,

    unpublishChapter: unpublishChapterMutation.mutateAsync,
    isUnpublishing: unpublishChapterMutation.isPending,

    publishChapter: publishChapterMutation.mutateAsync,
    isPublishing: publishChapterMutation.isPending,

    deleteChapter: deleteChapterMutation.mutateAsync,
    isDeleting: deleteChapterMutation.isPending,

    updateChapter: updateChapterMutation.mutateAsync,
    isUpdating: updateChapterMutation.isPending,

    updateChapterVideo: updateChapterVideoMutation.mutateAsync,
    isUpdatingVideo: updateChapterVideoMutation.isPending,
  };
};

/**
 * Hook: useChapterProgress
 * Manage user progress for chapters
 */
export const useChapterProgress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updateProgressMutation = useMutation({
    mutationFn: async ({
      userId,
      chapterId,
      courseId,
      isCompleted,
    }: {
      userId: string;
      chapterId: string;
      courseId: string;
      isCompleted: boolean;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/user/${userId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, courseId, isCompleted }),
      });

      if (!response.ok) {
        throw new Error("Failed to update progress");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate all queries related to user courses and progress
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, "user", variables.userId, "progress"],
      });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, "user", variables.userId],
      });

      if (variables.isCompleted) {
        toast.success("Chapter marked as complete!");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update progress");
      console.error(error);
    },
  });

  return {
    updateProgress: updateProgressMutation.mutateAsync,
    isUpdatingProgress: updateProgressMutation.isPending,
  };
};
