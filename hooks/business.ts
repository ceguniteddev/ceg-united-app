import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { Business } from "@/schema";
import { deleteBusiness, getBusiness, recordBusiness, updateBusiness } from "@/service/business";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

export const useBusinessQuery = (userId: string) => {
  const { user } = useAuth();

  const { data: businessData, isLoading } = useQuery({
    queryKey: ["GET_BUSINESS_DETAILS", userId],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const data = await getBusiness(userId);

      return data;
    },
    enabled: !!user,
  });

  return {
    businessData,
    isLoading,
  };
};

export const useBusinessMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createMutation = useMutation({
    mutationFn: async ({ values }: { values: Business }) => {
      if (!user) throw new Error("User not authenticated");

      await recordBusiness(values);
    },
    onSuccess: () => {
      toast.success("Business details recorded successfully.");
      queryClient.invalidateQueries({
        queryKey: ["GET_BUSINESS_DETAILS", user?.uid],
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
    mutationFn: async ({ id, values }: { values: Business; id: string }) => {
      if (!user) throw new Error("User not authenticated");

      await updateBusiness(id, values);
    },
    onSuccess: () => {
      toast.success("Business details recorded successfully.");
      queryClient.invalidateQueries({
        queryKey: ["GET_BUSINESS_DETAILS", user?.uid],
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
      await deleteBusiness(id);
    },
    onSuccess: () => {
      toast.success("Business details deleted successfully.");
      queryClient.invalidateQueries({
        queryKey: ["GET_BUSINESS_DETAILS", user?.uid],
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
    recordBusiness: createMutation.mutateAsync,
    isRecording: createMutation.isPending,

    updateBusiness: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteBusiness: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isDeleteSuccess: deleteMutation.isSuccess,
  };
};
