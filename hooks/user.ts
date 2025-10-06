import { GET_USER, GET_USERS } from "@/constant/react-query-keys";
import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { Role } from "@/schema";
import { User, UserActiveStatus, UserPlaid, UserWithId } from "@/schema/registration";
import {
  addUserNotes,
  getUserById,
  getUserNotes,
  getUsers,
  updateUserOnboardingStatus,
  updateUserStatus,
} from "@/service/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useUsersQuery = (role?: Role) => {
  const { user } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: [GET_USERS, role],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = (await getUsers(role)) as UserWithId[];

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

      const data = (await getUserById(id)) as User;

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

export const useUpdateUserStatusMutation = () => {
  const { user } = useAuth();

  const queryClient = useQueryClient();

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UserActiveStatus }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      await updateUserStatus({ id, status });
    },
    onSuccess: (data, _var) => {
      toast.success("User status updated");
      queryClient.invalidateQueries({ queryKey: [GET_USERS] });
      queryClient.invalidateQueries({ queryKey: [GET_USER, _var.id] });
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

export const useAddUserNotesMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addUserNotesMutation = useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes: string[] }) => {
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
