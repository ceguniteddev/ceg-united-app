import { COURSES_KEY } from "@/constant/react-query-keys";
import { useAuth } from "@/provider/AuthContext";
import { Course, CourseWithProgress } from "@/schema/educational-materials/course";
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

export const useGetUserCourses = (userId: string) => {
  const { user } = useAuth();

  const {
    data: courses,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [COURSES_KEY, "user", userId],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/user/${userId}/courses`);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return data as Course[];
    },
    enabled: !!user && !!userId,
  });

  return {
    courses,
    isLoading,
    refetch,
  };
};

export const useGetUserCoursesWithProgress = (userId: string) => {
  const { user } = useAuth();

  const {
    data: coursesWithProgress,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [COURSES_KEY, "user", userId, "progress"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/user/${userId}/courses/progress`);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return data as CourseWithProgress[];
    },
    enabled: !!user && !!userId,
  });

  return {
    coursesWithProgress,
    isLoading,
    refetch,
  };
};

export const useGetCourseById = (courseId: string) => {
  const { user } = useAuth();

  const {
    data: course,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [COURSES_KEY, courseId],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/courses/${courseId}`);

      if (!response.ok) {
        // Read response body (if any) for error message and attach status
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

      return data as Course;
    },
    enabled: !!user && !!courseId,
  });

  return {
    course,
    isLoading,
    isError,
    error,
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
    mutationFn: async ({ courseId, formData }: { courseId: string; formData: FormData }) => {
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
    mutationFn: async ({ courseId, attachmentId }: { courseId: string; attachmentId: string }) => {
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

export const useEnrollUserInCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const enrollMutation = useMutation({
    mutationFn: async ({ userId, courseId }: { userId: string; courseId: string }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/user/${userId}/courses/${courseId}/enroll`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to enroll user in course");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, "user", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, "user", variables.userId, "progress"],
      });
      toast.success("Successfully enrolled in course");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to enroll in course");
      console.error(error);
    },
  });

  return {
    enrollUser: enrollMutation.mutateAsync,
    isEnrolling: enrollMutation.isPending,
  };
};

export const useUnenrollUserFromCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const unenrollMutation = useMutation({
    mutationFn: async ({ userId, courseId }: { userId: string; courseId: string }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/user/${userId}/courses/${courseId}/unenroll`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unenroll user from course");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, "user", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, "user", variables.userId, "progress"],
      });
      toast.success("Successfully unenrolled from course");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to unenroll from course");
      console.error(error);
    },
  });

  return {
    unenrollUser: unenrollMutation.mutateAsync,
    isUnenrolling: unenrollMutation.isPending,
  };
};
