import { GET_USER, GET_USER_DOCUMENTS, GET_USERS } from "@/constant/react-query-keys";
import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { Role } from "@/schema";
import { User, UserPlaid } from "@/schema/registration";
import {
  getUserById,
  getUserDocuments,
  getUsers,
  updateUserOnboardingStatus,
} from "@/service/user";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useUsersQuery = (role?: Role) => {
  const { user } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: [GET_USERS, role],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = (await getUsers(role)) as UserPlaid[];

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

  const { data: users, isLoading } = useQuery({
    queryKey: [GET_USER, id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const data = (await getUserById(id)) as User;

      return data;
    },
    enabled: !!user && !!id,
  });

  return {
    users,
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
      if (error instanceof AppError) {
        toast.warning(error.message);
      } else {
        toast.warning(error.message);
        console.error(error);
      }
    },
  });

  return {
    updateOnboarding: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
