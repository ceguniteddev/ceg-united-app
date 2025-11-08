import { COURSES_KEY } from "@/constant/react-query-keys";
import { useAuth } from "@/provider/AuthContext";
import { Course } from "@/schema/educational-materials/course";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

export const useGetCourses = () => {
  const { user } = useAuth();

  const {
    data: courses,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [COURSES_KEY],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/courses`);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return data as Course[];
    },
    enabled: !!user,
  });

  return {
    courses,
    isLoading,
    refetch,
  };
};

export const useGetCourseById = (courseId: string) => {
  const { user } = useAuth();

  const {
    data: course,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [COURSES_KEY, courseId],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/courses/${courseId}`);

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      return data as Course;
    },
    enabled: !!user && !!courseId,
  });

  return {
    course,
    isLoading,
    refetch,
  };
};

export const useCourseMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const createCourseMutation = useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      if (!user) throw new Error("User not authenticated");
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (data, _var) => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY],
      });
    },
    onError: (error: any) => {
      toast.warning(error.message);
      console.error(error);
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { data: Partial<Course>; id: string }) => {
      if (!user) throw new Error("User not authenticated");

      await fetch(`/api/courses/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, context) => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, context],
      });
    },
    onError: (error: any) => {
      toast.warning(error.message);
      console.error(error);
    },
  });

  const unpublishCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      await fetch(`/api/courses/${courseId}/unpublish`, { method: "PATCH" });
    },
    onSuccess: (data, context) => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, context],
      });
    },
    onError: (error: any) => {
      toast.warning(error.message);
      console.error(error);
    },
  });

  const publishCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      await fetch(`/api/courses/${courseId}/publish`, { method: "PATCH" });
    },
    onSuccess: (data, context) => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, context],
      });
    },
    onError: (error: any) => {
      toast.warning(error.message);
      console.error(error);
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    },
    onSuccess: (data, context) => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, context],
      });
    },
    onError: (error: any) => {
      toast.warning(error.message);
      console.error(error);
    },
  });

  const uploadCourseAttachmentMutation = useMutation({
    mutationFn: async ({
      courseId,
      formData,
    }: {
      courseId: string;
      formData: FormData;
    }) => {
      await fetch(`/api/courses/${courseId}/attachments`, {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (data, context) => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, context],
      });
    },
    onError: (error: any) => {
      toast.warning(error.message);
      console.error(error);
    },
  });

  const deleteCourseAttachmentMutation = useMutation({
    mutationFn: async ({
      courseId,
      attachmentId,
    }: {
      courseId: string;
      attachmentId: string;
    }) => {
      await fetch(`/api/courses/${courseId}/attachments/${attachmentId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (data, context) => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, context],
      });
    },
    onError: (error: any) => {
      toast.warning(error.message);
      console.error(error);
    },
  });

  return {
    createCourse: createCourseMutation.mutateAsync,
    isCreating: createCourseMutation.isPending,

    deleteCourse: deleteCourseMutation.mutateAsync,
    isDeleting: deleteCourseMutation.isPending,

    publishCourse: publishCourseMutation.mutateAsync,
    isPublishing: publishCourseMutation.isPending,

    unpublishCourse: unpublishCourseMutation.mutateAsync,
    isUnpublishing: unpublishCourseMutation.isPending,

    updateCourse: updateCourseMutation.mutateAsync,
    isUpdating: updateCourseMutation.isPending,

    uploadCourseAttachment: uploadCourseAttachmentMutation.mutateAsync,
    isUploadingAttachment: uploadCourseAttachmentMutation.isPending,

    deleteCourseAttachment: deleteCourseAttachmentMutation.mutateAsync,
    isDeletingAttachment: deleteCourseAttachmentMutation.isPending,
  };
};
