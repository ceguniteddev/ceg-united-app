import { GET_USER, GET_USERS } from "@/constant/react-query-keys";
import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { Role } from "@/schema";
import { NoteSchema } from "@/schema/notes";
import { UserActiveStatus } from "@/schema/registration";
import {
  addUserNotes,
  getUserNotes,
  updateUserOnboardingStatus,
} from "@/service/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useSendClientServiceAgreementMutation = ({
  userId,
  onSuccess,
}: {
  userId: string;
  onSuccess?: () => void;
}) => {
  const {
    mutateAsync: sendClientServiceAgreement,
    isPending: isSending,
    isError,
    error,
  } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/user/${userId}/send-agreement`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to send client service agreement");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Client service agreement sent successfully");
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { sendClientServiceAgreement, isSending, isError, error };
};

export const useDeleteUserMutation = (options?: {
  userId?: string;
  onSuccess?: () => void;
}) => {
  const { userId, onSuccess } = options || {};
  const queryClient = useQueryClient();

  const {
    mutateAsync: deleteUser,
    isPending: isDeleting,
    isError,
    error,
  } = useMutation({
    mutationFn: async (overrideUserId?: string | void) => {
      const idToDelete =
        (typeof overrideUserId === "string" && overrideUserId) || userId;
      if (!idToDelete) {
        throw new Error("User ID is required");
      }
      const response = await fetch(`/api/user/${idToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: [GET_USERS] });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { deleteUser, isDeleting, isError, error };
};

export const useUsersQuery = (role: Role = "Client") => {
  const { user } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: [GET_USERS, role],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/user?role=${role}`);
      if (!response.ok) {
        toast.error("Failed to fetch users.");
        return null;
      }
      const data = await response.json();
      return data;
    },
    enabled: !!user,
  });

  return {
    users,
    isLoading,
  };
};

export const useUserQuery = (id: string) => {
  const { user } = useAuth();

  const { data: userData, isLoading } = useQuery({
    queryKey: [GET_USER, id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/user/${id}`);
      if (!response.ok) {
        toast.error("Failed to fetch user.");
        return null;
      }
      const data = await response.json();

      return data;
    },
    enabled: !!user && !!id,
  });

  return {
    userData,
    isLoading,
  };
};

export const useUserNotesQuery = (id: string) => {
  const { user } = useAuth();

  const { data: notes, isLoading } = useQuery({
    queryKey: ["GET_USER_NOTES", id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const data = (await getUserNotes(id)) as string[];

      return data;
    },
    enabled: !!user && !!id,
  });

  return {
    notes,
    isLoading,
  };
};

export const useUpdateUserOnboardingMutation = () => {
  const { user } = useAuth();

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      await updateUserOnboardingStatus(user.uid, true);
    },

    onError: (error: any) => {
      console.log("Error updating onboarding status:", error);
      toast.error("Failed to update onboarding status. Please try again.");
    },
  });

  return {
    updateOnboarding: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};

export const useUpdateUserStatusMutation = ({ userId }: { userId: string }) => {
  const { user } = useAuth();

  const queryClient = useQueryClient();

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: UserActiveStatus }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      // await updateUserStatus({ id, status });
      const response = await fetch(`/api/user/${userId}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Error updating user status:", data);
        throw new AppError("Failed to update user status.");
      }
    },
    onSuccess: (data, _var) => {
      toast.success("User status updated");
      queryClient.invalidateQueries({ queryKey: [GET_USERS] });
      queryClient.invalidateQueries({ queryKey: [GET_USER, userId] });
    },

    onError: (error: any) => {
      console.log("Error updating user status:", error);
      toast.error("Failed to update user status. Please try again.");
    },
  });

  return {
    updateUserStatus: updateUserStatusMutation.mutateAsync,
    isUpdating: updateUserStatusMutation.isPending,
  };
};

export const useUpdateUserProfileMutation = ({
  userId,
}: {
  userId: string;
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<any>) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error updating user profile:", errorData);
        throw new AppError("Failed to update user profile.");
      }
    },
    onSuccess: () => {
      toast.success("User profile updated successfully");
      queryClient.invalidateQueries({ queryKey: [GET_USER, userId] });
      queryClient.invalidateQueries({ queryKey: [GET_USERS] });
    },
    onError: (error: any) => {
      console.log("Error updating user profile:", error);
      toast.error("Failed to update user profile. Please try again.");
    },
  });

  return {
    updateUserProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};

export const useUpdateClientBrokerMutation = ({
  userId,
}: {
  userId: string;
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateBrokerMutation = useMutation({
    mutationFn: async ({
      brokerId,
      brokerName,
    }: {
      brokerId: string | null;
      brokerName: string;
    }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      const response = await fetch(`/api/user/${userId}/broker`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brokerId, brokerName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error updating broker assignment:", errorData);
        throw new AppError("Failed to update broker assignment.");
      }
    },
    onSuccess: () => {
      // toast.success("Broker assignment updated successfully");
      queryClient.invalidateQueries({ queryKey: [GET_USER, userId] });
      queryClient.invalidateQueries({ queryKey: [GET_USERS] });
    },
    onError: (error: any) => {
      console.log("Error updating broker assignment:", error);
      toast.error("Failed to update broker assignment. Please try again.");
    },
  });

  return {
    updateClientBroker: updateBrokerMutation.mutateAsync,
    isUpdating: updateBrokerMutation.isPending,
  };
};

export const useToggleLetterFeatureMutation = ({
  userId,
}: {
  userId: string;
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const toggleLetterFeatureMutation = useMutation({
    mutationFn: async ({
      enabled,
      featureKey,
    }: {
      enabled: boolean;
      featureKey?: string;
    }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      const response = await fetch(`/api/user/${userId}/letter-feature`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled, featureKey }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Error toggling letter feature:", data);
        throw new AppError("Failed to toggle letter feature.");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success(
        `Letter feature ${
          variables.enabled ? "enabled" : "disabled"
        } successfully`,
      );
      queryClient.invalidateQueries({ queryKey: [GET_USER, userId] });
      queryClient.invalidateQueries({ queryKey: [GET_USERS] });
    },
    onError: (error: any) => {
      console.error("Error toggling letter feature:", error);
      toast.error("Failed to toggle letter feature. Please try again.");
    },
  });

  return {
    toggleLetterFeature: toggleLetterFeatureMutation.mutateAsync,
    isToggling: toggleLetterFeatureMutation.isPending,
  };
};

export const useAddUserNotesMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addUserNotesMutation = useMutation({
    mutationFn: async ({
      userId,
      notes,
    }: {
      userId: string;
      notes: string[];
    }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      await addUserNotes({ userId, notes });
    },
    onSuccess: (data, _variable) => {
      toast.success("Notes successfully added.");
      queryClient.invalidateQueries({
        queryKey: ["GET_USER_NOTES", _variable.userId],
      });
    },

    onError: (error: any) => {
      console.log("Error adding notes:", error);
      toast.error("Failed to add notes. Please try again.");
    },
  });

  return {
    addUserNotes: addUserNotesMutation.mutateAsync,
    isRecording: addUserNotesMutation.isPending,
  };
};

const getUserNote = async (userId: string): Promise<NoteSchema> => {
  const response = await fetch(`/api/user/${userId}/notes`);
  if (!response.ok) {
    throw new Error("Failed to fetch user note");
  }
  // We need to parse the JSON and then convert date strings to Date objects
  const data = await response.json();
  return {
    ...data,
    comments: data.comments.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
    })),
  };
};

const updateUserNote = async ({
  userId,
  note,
}: {
  userId: string;
  note: NoteSchema;
}): Promise<void> => {
  const response = await fetch(`/api/user/${userId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  if (!response.ok) {
    throw new Error("Failed to save user note");
  }
};

// =================================
// TanStack Query Hooks for User Notes
// =================================

export const useGetUserNoteQuery = (userId: string) => {
  return useQuery<NoteSchema, Error>({
    queryKey: ["userNote", userId], // Unique query key for user notes
    queryFn: () => getUserNote(userId),
    enabled: !!userId, // Only run if userId is provided
  });
};

export const useUpdateUserNoteMutation = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: NoteSchema) => updateUserNote({ userId, note }),
    onSuccess: () => {
      toast.success("Note saved successfully!");
      // Invalidate the query to refetch the latest data
      queryClient.invalidateQueries({ queryKey: ["userNote", userId] });
    },
    onError: (error: Error) => {
      toast.error("Failed to save note.");
      console.error("Error updating user note:", error);
    },
  });
};

export const useAdminAddClientMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({
      step1Data,
      step2Data,
    }: {
      step1Data: any;
      step2Data: any;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/admin/clients/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ step1Data, step2Data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors || "Failed to add client");
      }

      return await response.json();
    },
    onSuccess: () => {
      // toast.success("Client added successfully!");
      queryClient.invalidateQueries({ queryKey: [GET_USERS] });
    },
    onError: (error: Error) => {
      toast.error("Failed to add client", {
        description: error.message,
      });
    },
  });

  return mutation;
};

export const useResendVerificationMutation = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: resendVerification, isPending: isResending } =
    useMutation({
      mutationFn: async (userId: string) => {
        const response = await fetch(
          `/api/user/${userId}/resend-verification`,
          {
            method: "POST",
          },
        );
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || "Failed to resend verification email");
        }
        return response.json();
      },
    });
  return { resendVerification, isResending };
};
