import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import {
  approveMappedFund,
  getApprovedMappedFunds,
  getFundMappingAnalysis,
} from "@/service/bank-products";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { is } from "date-fns/locale";
import { toast } from "sonner";

export const useFundingApplicationsMappedFundsQuery = (referenceNumber: string) => {
  const { user } = useAuth();

  const {
    data: mappedFund,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["GET_FUNDING_APPLICATION_MAPPED_FUNDS", referenceNumber],
    enabled: !!user && !!referenceNumber,
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = await getFundMappingAnalysis(referenceNumber);
      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
  });

  return { mappedFund, isLoading, error };
};

export const useApproveMappedFundsQuery = (referenceNumber: string) => {
  const { user } = useAuth();

  const {
    data: approvedMappedFunds,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["GET_APPROVED_MAPPED_FUNDS", referenceNumber],
    enabled: !!user && !!referenceNumber,
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = await getApprovedMappedFunds(referenceNumber);
      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
  });

  return { approvedMappedFunds, isLoading, error };
};

export const useFundingApplicationsMappedFundsMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const approveMappedFundMutation = useMutation({
    mutationFn: async ({
      bankProductId,
      referenceNumber,
    }: {
      bankProductId: string;
      referenceNumber: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      await approveMappedFund(referenceNumber, bankProductId);
    },
    onSuccess: (_data, variable) => {
      queryClient.invalidateQueries({
        queryKey: ["GET_FUNDING_APPLICATION_MAPPED_FUNDS", variable.referenceNumber],
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
    approveMappedFund: approveMappedFundMutation.mutateAsync,
    isApproving: approveMappedFundMutation.isPending,
  };
};
