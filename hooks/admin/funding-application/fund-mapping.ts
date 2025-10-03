import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { BankFormData, ClientApplicationStatus } from "@/schema/bank-products";
import {
  applyBankProduct,
  approveMappedFund,
  getApprovedMappedFunds,
  getFundMappingAnalysis,
  getFundMappingAnalysisDetails,
} from "@/service/bank-products";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { is } from "date-fns/locale";
import { toast } from "sonner";

export const useFundingApplicationsMappedFundsQuery = () => {
  const { user } = useAuth();

  const {
    data: mappedFund,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["GET_FUNDING_APPLICATION_MAPPED_FUNDS"],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = await getFundMappingAnalysis();
      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
  });

  return { mappedFund, isLoading, error };
};

export const useClientMappedFundingDetailsQuery = ({
  userId,
  adminApprovedStatus,
  clientApplicationStatus,
}: {
  userId: string;
  adminApprovedStatus?: AdminApprovedStatus;
  clientApplicationStatus?: ClientApplicationStatus[];
}) => {
  const { user } = useAuth();

  const {
    data: mappedFund,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "useClientMappedFundingDetailsQuery",
      userId,
      adminApprovedStatus,
      clientApplicationStatus,
    ],
    enabled: !!user && !!userId,
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = await getFundMappingAnalysisDetails({
        userId,
        adminApprovedStatus,
        clientApplicationStatus,
      });
      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000,
  });

  return { mappedFund, isLoading, error };
};

export const useApproveMappedFundsQuery = (referenceNumber: string) => {
  const { user } = useAuth();

  const {
    data: approvedMappedFunds,
    isLoading,
    isError, // It's often useful to also expose isError
    error,
  } = useQuery<BankFormData[], Error>({
    // 1. Add explicit types for data and error
    queryKey: ["GET_APPROVED_MAPPED_FUNDS", referenceNumber],
    enabled: !!user && !!referenceNumber,
    queryFn: async () => {
      // User authentication check remains on the client for early exit
      if (!user) {
        throw new Error("User not authenticated");
      }

      // 2. Await the structured response from your server function
      const response = await getApprovedMappedFunds({ userId: referenceNumber });

      // Check if the call to get the funds failed
      if (!response.success && response.message) {
        if (response.error === "error") {
          throw new Error(response.message);
        }
        toast.warning(response.message);
        return [];
      }

      return response.data || [];
    },
    // Query options remain the same
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
  });

  return { approvedMappedFunds, isLoading, isError, error };
};

export const useFundingApplicationsMappedFundsMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const approveMappedFundMutation = useMutation({
    mutationFn: async ({ bankProductId, userId }: { bankProductId: string; userId: string }) => {
      if (!user) throw new Error("User not authenticated");

      const result = await approveMappedFund({ userId, bankProductId });

      if (!result.success && result.message) {
        if (result.error === "error") {
          throw new Error(result.message);
        }
        toast.warning(result.message);
        return null;
      }

      return result;
    },
    onSuccess: (_data, variable) => {
      toast.success("Mapped funds approved successfully.");
      // queryClient.invalidateQueries({
      //   queryKey: ["GET_FUNDING_APPLICATION_MAPPED_FUNDS"],
      // });
      // queryClient.invalidateQueries({
      //   queryKey: ["GET_APPROVED_MAPPED_FUNDS", variable.userId],
      // });
      // queryClient.invalidateQueries({
      //   queryKey: ["GET_FUNDING_APPLICATIONS"],
      // });
      queryClient.invalidateQueries({
        queryKey: ["useClientMappedFundingDetailsQuery", variable.userId],
      });
    },
    onError: (error: any) => {
      toast.error(error.message);
      console.error(error);
    },
  });

  return {
    approveMappedFund: approveMappedFundMutation.mutateAsync,
    isApproving: approveMappedFundMutation.isPending,
  };
};

export const useBankProductApplicationMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const applyBankProductMutation = useMutation({
    mutationFn: async ({ bankProductId, userId }: { bankProductId: string; userId: string }) => {
      if (!user) throw new Error("User not authenticated");

      const result = await applyBankProduct({ userId, bankProductId });
      if (!result.success && result.message) {
        if (result.error === "error") {
          throw new Error(result.message);
        }
        toast.warning(result.message);
        return null;
      }
    },
    onSuccess: (_data, variable) => {
      queryClient.invalidateQueries({
        queryKey: ["GET_APPROVED_MAPPED_FUNDS", variable.userId],
      });
    },
    onError: (error: any) => {
      toast.error(error.message);
      console.error(error);
    },
  });

  return {
    applyBankProduct: applyBankProductMutation.mutateAsync,
    isApplying: applyBankProductMutation.isPending,
  };
};
