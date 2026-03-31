import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { Business } from "@/schema";
import {
  deleteBusiness,
  getBusiness,
  recordBusiness,
  updateBusiness,
} from "@/service/business";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

export const useBusinessQuery = (userId: string, enabled: boolean) => {
  const { user } = useAuth();

  const {
    data: businessData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["GET_BUSINESS_DETAILS", userId],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      // const data = await getBusiness(userId);
      const response = await fetch(`/api/user/${userId}/business`);

      if (!response.ok) {
        toast.error("Failed to fetch business details.");
        return null;
      }

      const data = await response.json();

      return data;
    },
    enabled: enabled ?? false, //!!user && !!userId,
  });

  return {
    businessData,
    isLoading,
    refetch,
  };
};

export const useBusinessMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createMutation = useMutation({
    mutationFn: async ({
      values,
      userId,
    }: {
      values: Business;
      userId: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      await recordBusiness(values);
    },
    onSuccess: (data, _var) => {
      toast.success("Business details recorded successfully.");
      queryClient.invalidateQueries({
        queryKey: ["GET_BUSINESS_DETAILS", _var.userId],
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
    onSuccess: (_, variables) => {
      toast.success("Business details recorded successfully.");
      if (variables.values.userId) {
        queryClient.invalidateQueries({
          queryKey: ["GET_BUSINESS_DETAILS", variables.values.userId],
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: ["GET_BUSINESS_DETAILS", user?.uid],
        });
      }
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
export const useBusinessByIdQuery = (userId: string, businessId: string) => {
  const { data: business, isLoading } = useQuery({
    queryKey: ["GET_BUSINESS_BY_ID", userId, businessId],
    queryFn: async () => {
      const response = await fetch(
        `/api/user/${userId}/business/${businessId}`,
      );
      if (!response.ok) {
        toast.error("Failed to fetch business details.");
        return null;
      }
      return response.json();
    },
    enabled: !!userId && !!businessId,
  });

  return { business, isLoading };
};

export const useBusinessAuditQuery = (userId: string, businessId: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ["GET_BUSINESS_AUDIT", userId, businessId],
    queryFn: async () => {
      const response = await fetch(
        `/api/user/${userId}/business/${businessId}/audit`,
      );
      if (!response.ok) {
        toast.error("Failed to fetch business audit data.");
        return {
          auditItems: [],
          fundabilityScore: 0,
          fundabilityStatus: "No Data",
        };
      }
      return response.json();
    },
    enabled: !!userId && !!businessId,
  });

  return {
    auditItems: data?.auditItems || [],
    fundabilityScore: data?.fundabilityScore || 0,
    fundabilityStatus: data?.fundabilityStatus || "No Data",
    creditScore: data?.creditScore ?? 0,
    creditRating: data?.creditRating ?? "Good",
    creditChange: data?.creditChange ?? 0,
    accounts: data?.accounts || [],
    metrics: data?.metrics || [],
    revenueData: data?.revenueData || [],
    compatibilityFactors: data?.compatibilityFactors || [],
    isLoading,
  };
};
