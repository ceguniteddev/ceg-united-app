import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { WhatsNew } from "@/schema/whats-new";
import {
  deleteWhatsNew,
  getWhatsNew,
  getWhatsNewActive,
  recordWhatsNew,
  updateWhatsNew,
} from "@/service/whats-new";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useWhatsNewQuery = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["GET_WHATS_NEW_ALL"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const data = (await getWhatsNew()) as WhatsNew[];

      return data;
    },
    enabled: !!user,
  });

  return {
    data,
    isLoading,
  };
};

export const useWhatsNewQueryActive = () => {
  const { user } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: ["GET_WHATS_NEW_ACTIVE"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const data = (await getWhatsNewActive()) as WhatsNew[];

      return data;
    },
    enabled: !!user,
  });

  return {
    users,
    isLoading,
  };
};

export const useWhatsNewMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const recordMutation = useMutation({
    mutationFn: async (values: WhatsNew) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      await recordWhatsNew(values);
    },
    onSuccess: () => {
      toast.success("Data is recorded successfully.");
      queryClient.invalidateQueries({
        queryKey: ["GET_WHATS_NEW_ALL"],
      });
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { values: WhatsNew; id: string }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      await updateWhatsNew(id, values);
    },
    onSuccess: () => {
      toast.success("Data is updated successfully.");
      queryClient.invalidateQueries({
        queryKey: ["GET_WHATS_NEW_ALL"],
      });
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      await deleteWhatsNew(id);
    },
    onSuccess: () => {
      toast.success("Data is deleted successfully.");
      queryClient.invalidateQueries({
        queryKey: ["GET_WHATS_NEW_ALL"],
      });
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
    record: recordMutation.mutateAsync,
    isRecording: recordMutation.isPending,

    delete: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isDeleteSuccess: deleteMutation.isSuccess,

    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
