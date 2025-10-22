import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import {
  ApprovedBankFormData,
  ClientApplicationStatus,
} from "@/schema/bank-products";
import {
  applyApprovedMappedFund,
  approveAppliedBankProduct,
  approveMappedFund,
  declineAppliedBankProduct,
  getApprovedMappedFunds,
  getFundMappingAnalysis,
  getFundMappingAnalysisDetails,
} from "@/service/bank-products";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useFundingApplicationsMappedFundsQuery = (
  referenceNumber: string
) => {
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
    // refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
  });

  return { mappedFund, isLoading, error };
};

export const useApproveMappedFundsQueryOld = (referenceNumber: string) => {
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

export const useApproveMappedFundsQuery = (referenceNumber: string) => {
  const { user } = useAuth();

  const {
    data: approvedMappedFunds,
    isLoading,
    isError, // It's often useful to also expose isError
    error,
  } = useQuery<ApprovedBankFormData[], Error>({
    // 1. Add explicit types for data and error
    queryKey: ["GET_APPROVED_MAPPED_FUNDS", referenceNumber],
    enabled: !!user && !!referenceNumber,
    queryFn: async () => {
      // User authentication check remains on the client for early exit
      if (!user) {
        throw new Error("User not authenticated");
      }

      // 2. Await the structured response from your server function
      const response = await getApprovedMappedFunds(referenceNumber);

      // Check if the call to get the funds failed
      if (!response.success && response.message) {
        if (response.error === "error") {
          throw new Error(response.message);
        }
        toast.warning(response.message);
        return [];
      }

      return (response.data as ApprovedBankFormData[]) || [];
    },
    // Query options remain the same
    staleTime: 0,
    // refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
  });

  return { approvedMappedFunds, isLoading, isError, error };
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

      const result = await approveMappedFund(referenceNumber, bankProductId);

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
      queryClient.invalidateQueries({
        queryKey: [
          "GET_FUNDING_APPLICATION_MAPPED_FUNDS",
          variable.referenceNumber,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["GET_APPROVED_MAPPED_FUNDS", variable.referenceNumber],
      });
      queryClient.invalidateQueries({
        queryKey: ["GET_FUNDING_APPLICATIONS"],
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

export const useFundingApplicationsMappedFundsMutationOld = () => {
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
        queryKey: [
          "GET_FUNDING_APPLICATION_MAPPED_FUNDS",
          variable.referenceNumber,
        ],
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

export const useApprovedMappedFundsMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const applyApprovedMappedFundMutation = useMutation({
    mutationFn: async ({
      referenceNumber,
      fundMappingApprovedId,
    }: {
      referenceNumber: string;
      fundMappingApprovedId: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      await applyApprovedMappedFund({
        referenceNumber,
        fundMappingApprovedId,
      });
    },
    onSuccess: (_data, variable) => {
      queryClient.invalidateQueries({
        queryKey: [
          "GET_FUNDING_APPLICATION_MAPPED_FUNDS",
          variable.referenceNumber,
        ],
      });
      toast.success("Fund successfully applied.");
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

  const approveAppliedBankProductMutation = useMutation({
    mutationFn: async ({
      referenceNumber,
      fundMappingApprovedId,
      approvedAmount,
      approvedRemarks,
    }: {
      referenceNumber: string;
      fundMappingApprovedId: string;
      approvedAmount: number;
      approvedRemarks?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      await approveAppliedBankProduct({
        referenceNumber,
        fundMappingApprovedId,
        approvedAmount,
        approvedRemarks,
      });
    },
    onSuccess: (_data, variable) => {
      queryClient.invalidateQueries({
        queryKey: [
          "GET_FUNDING_APPLICATION_MAPPED_FUNDS",
          variable.referenceNumber,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["useClientMappedFundingDetailsQuery"],
        exact: false,
      });
      toast.success("Fund application approved.");
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

  const declineAppliedBankProductMutation = useMutation({
    mutationFn: async ({
      referenceNumber,
      fundMappingApprovedId,
    }: {
      referenceNumber: string;
      fundMappingApprovedId: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      await declineAppliedBankProduct({
        referenceNumber,
        fundMappingApprovedId,
      });
    },
    onSuccess: (_data, variable) => {
      queryClient.invalidateQueries({
        queryKey: [
          "GET_FUNDING_APPLICATION_MAPPED_FUNDS",
          variable.referenceNumber,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["useClientMappedFundingDetailsQuery"],
        exact: false,
      });
      toast.success("Fund application declined.");
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
    applyApprovedMappedFund: applyApprovedMappedFundMutation.mutateAsync,
    isApplying: applyApprovedMappedFundMutation.isPending,

    approveAppliedBankProduct: approveAppliedBankProductMutation.mutateAsync,
    isApproving: approveAppliedBankProductMutation.isPending,

    declineAppliedBankProduct: declineAppliedBankProductMutation.mutateAsync,
    isDeclining: declineAppliedBankProductMutation.isPending,
  };
};

export const useClientMappedFundingDetailsQuery = ({
  userId,
  adminApprovedStatus,
  clientApplicationStatus,
  referenceNumber,
}: {
  userId: string;
  adminApprovedStatus?: AdminApprovedStatus;
  clientApplicationStatus?: ClientApplicationStatus[];
  referenceNumber?: string;
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
      referenceNumber,
    ],
    enabled: !!user && !!userId,
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = await getFundMappingAnalysisDetails({
        userId,
        adminApprovedStatus,
        clientApplicationStatus,
        referenceNumber,
      });
      return data;
    },
    staleTime: 0,
    // refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
  });

  return { mappedFund, isLoading, error };
};
