import { COURSES_KEY } from "@/constant/react-query-keys";
import { useAuth } from "@/provider/AuthContext";
import {
  Course,
  CourseWithProgress,
  CourseReview,
  CourseNote,
  Section,
} from "@/schema/educational-materials/course";
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
    isFetching,
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
    isFetching,
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
    mutationFn: async ({
      courseId,
      formData,
    }: {
      courseId: string;
      formData: FormData;
    }) => {
      const res = await fetch(`/api/courses/${courseId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let message = "Failed to upload attachments";
        try {
          const json = await res.json();
          message = json.message || json.errors || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, variables.courseId],
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

export const useEnrollUserInCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const enrollMutation = useMutation({
    mutationFn: async ({
      userId,
      courseId,
      notes,
    }: {
      userId: string;
      courseId: string;
      notes?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(
        `/api/user/${userId}/courses/${courseId}/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData.errors ||
            "Failed to enroll user in course",
        );
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
      queryClient.invalidateQueries({
        queryKey: [
          COURSES_KEY,
          variables.courseId,
          "enrollment",
          variables.userId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY],
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
    mutationFn: async ({
      userId,
      courseId,
    }: {
      userId: string;
      courseId: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(
        `/api/user/${userId}/courses/${courseId}/unenroll`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData.errors ||
            "Failed to unenroll user from course",
        );
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
      queryClient.invalidateQueries({
        queryKey: [
          COURSES_KEY,
          variables.courseId,
          "enrollment",
          variables.userId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY],
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

/* ==================== Course Checkout Hook ==================== */

export const useCourseCheckout = () => {
  const { user } = useAuth();

  const checkoutMutation = useMutation({
    mutationFn: async ({
      courseId,
      returnUrl,
    }: {
      courseId: string;
      returnUrl?: string;
    }) => {
      if (!user?.uid) throw new Error("User not authenticated");

      const response = await fetch(
        `/api/user/${user.uid}/courses/${courseId}/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ returnUrl }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(
          err.message || err.errors || "Failed to start checkout",
        );
      }

      return response.json() as Promise<{ checkoutId: string; url: string }>;
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to proceed to checkout");
      console.error(error);
    },
  });

  return {
    createCheckout: checkoutMutation.mutateAsync,
    isLoading: checkoutMutation.isPending,
  };
};

/* ==================== Course Enrollment Check ==================== */

export const useCourseEnrollment = (courseId: string) => {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: [COURSES_KEY, courseId, "enrollment", user?.uid],
    queryFn: async () => {
      if (!user?.uid || !courseId) return { isEnrolled: false };

      const res = await fetch(
        `/api/user/${user.uid}/courses/${courseId}/enrollment`,
      );
      if (!res.ok) return { isEnrolled: false };
      return res.json() as Promise<{
        isEnrolled: boolean;
        enrollment?: any;
      }>;
    },
    enabled: !!user?.uid && !!courseId,
  });

  return {
    isEnrolled: !!data?.isEnrolled,
    enrollment: data?.enrollment,
    isLoading,
    refetch,
  };
};

/* ==================== Course Reviews Hooks ==================== */

export const useCourseReviews = (courseId: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [COURSES_KEY, courseId, "reviews"],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/reviews`);
      if (!res.ok) return { reviews: [] };
      return res.json() as Promise<{ reviews: CourseReview[] }>;
    },
    enabled: !!courseId,
  });

  return {
    reviews: data?.reviews || [],
    isLoading,
    refetch,
  };
};

export const useAddCourseReview = (courseId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({
      rating,
      comment,
    }: {
      rating: number;
      comment: string;
    }) => {
      if (!user?.uid) throw new Error("User not authenticated");

      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, rating, comment }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit review");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, courseId, "reviews"],
      });
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, courseId],
      });
      toast.success("Thank you for your review!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  return {
    addReview: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
  };
};

/* ==================== Course Notes Hooks ==================== */

export const useCourseNotes = (courseId: string) => {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: [COURSES_KEY, courseId, "notes", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return { notes: [] };
      const res = await fetch(
        `/api/user/${user.uid}/courses/${courseId}/notes`,
      );
      if (!res.ok) return { notes: [] };
      return res.json() as Promise<{ notes: CourseNote[] }>;
    },
    enabled: !!user?.uid && !!courseId,
  });

  return {
    notes: data?.notes || [],
    isLoading,
    refetch,
  };
};

export const useSaveCourseNote = (courseId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      chapterId,
      timestampSeconds,
      content,
    }: {
      id?: string;
      chapterId: string;
      timestampSeconds: number;
      content: string;
    }) => {
      if (!user?.uid) throw new Error("User not authenticated");

      const res = await fetch(
        `/api/user/${user.uid}/courses/${courseId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, chapterId, timestampSeconds, content }),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to save note");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, courseId, "notes", user?.uid],
      });
      toast.success("Note saved");
    },
  });

  return {
    saveNote: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
};

export const useDeleteCourseNote = (courseId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (noteId: string) => {
      if (!user?.uid) throw new Error("User not authenticated");

      const res = await fetch(
        `/api/user/${user.uid}/courses/${courseId}/notes?noteId=${noteId}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        throw new Error("Failed to delete note");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, courseId, "notes", user?.uid],
      });
      toast.success("Note deleted");
    },
  });

  return {
    deleteNote: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
};

/* ==================== Sections Hooks ==================== */

export const useCourseSections = (courseId: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: [COURSES_KEY, courseId, "sections"],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/sections`);
      if (!res.ok) return { sections: [] };
      return res.json() as Promise<{ sections: Section[] }>;
    },
    enabled: !!courseId,
  });

  const createSectionMutation = useMutation({
    mutationFn: async ({
      title,
      description,
      position,
    }: {
      title: string;
      description?: string;
      position?: number;
    }) => {
      const res = await fetch(`/api/courses/${courseId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, position }),
      });
      if (!res.ok) throw new Error("Failed to create section");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, courseId, "sections"],
      });
      queryClient.invalidateQueries({ queryKey: [COURSES_KEY, courseId] });
      toast.success("Section created");
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({
      sectionId,
      data,
    }: {
      sectionId: string;
      data: Partial<Section>;
    }) => {
      const res = await fetch(
        `/api/courses/${courseId}/sections/${sectionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) throw new Error("Failed to update section");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, courseId, "sections"],
      });
      queryClient.invalidateQueries({ queryKey: [COURSES_KEY, courseId] });
      toast.success("Section updated");
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const res = await fetch(
        `/api/courses/${courseId}/sections/${sectionId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete section");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [COURSES_KEY, courseId, "sections"],
      });
      queryClient.invalidateQueries({ queryKey: [COURSES_KEY, courseId] });
      toast.success("Section deleted");
    },
  });

  return {
    sections: data?.sections || [],
    isLoading,
    refetch,
    createSection: createSectionMutation.mutateAsync,
    isCreatingSection: createSectionMutation.isPending,
    updateSection: updateSectionMutation.mutateAsync,
    isUpdatingSection: updateSectionMutation.isPending,
    deleteSection: deleteSectionMutation.mutateAsync,
    isDeletingSection: deleteSectionMutation.isPending,
  };
};
