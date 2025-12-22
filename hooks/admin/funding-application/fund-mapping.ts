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
  cancelMappedFund,
  declineAppliedBankProduct,
  fundedAppliedBankProduct,
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

  const addManualMappedFundMutation = useMutation({
    mutationFn: async ({
      bankProductIds,
      referenceNumber,
      userId,
    }: {
      bankProductIds: string[];
      referenceNumber: string;
      userId: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch("/api/bank-products/mapping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: bankProductIds.map((id) => ({ id })),
          referenceNumber,
          userId,
          append: true, // Important: This tells the service to append instead of replace
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors || "Failed to add bank products");
      }

      return await response.json();
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
      toast.success("Bank products successfully added to fund mapping.");
    },
    onError: (error: any) => {
      toast.error(error.message);
      console.error(error);
    },
  });

  const approveMappedFundMutation = useMutation({
    mutationFn: async ({
      bankProductId,
      referenceNumber,
    }: {
      bankProductId: string;
      referenceNumber: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const result = await approveMappedFund({
        referenceNumber,
        bankProductId: bankProductId,
      });

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
      // toast.success("Fund successfully approved.");
    },
    onError: (error: any) => {
      toast.error(error.message);
      console.error(error);
    },
  });

  const cancelMappedFundMutation = useMutation({
    mutationFn: async ({
      fundMappingApprovedId,
      referenceNumber,
    }: {
      fundMappingApprovedId: string;
      referenceNumber: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const result = await cancelMappedFund({
        referenceNumber,
        fundMappingApprovedId,
      });

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
      toast.success("Fund successfully cancelled.");
    },
    onError: (error: any) => {
      toast.error(error.message);
      console.error(error);
    },
  });

  const removeMappedBankProductMutation = useMutation({
    mutationFn: async ({
      referenceNumber,
      bankProductId,
    }: {
      referenceNumber: string;
      bankProductId: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch("/api/bank-products/mapping/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referenceNumber,
          bankProductId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors || "Failed to remove bank product");
      }

      return await response.json();
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
      toast.success("Bank product successfully removed from fund mapping.");
    },
    onError: (error: any) => {
      toast.error(error.message);
      console.error(error);
    },
  });

  const refreshBankProductsMutation = useMutation({
    mutationFn: async ({
      referenceNumber,
      userId,
    }: {
      referenceNumber: string;
      userId: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch("/api/bank-products/mapping/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referenceNumber,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors || "Failed to refresh bank products");
      }

      return await response.json();
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
      toast.success("Bank products successfully refreshed.");
    },
    onError: (error: any) => {
      toast.error(error.message);
      console.error(error);
    },
  });

  return {
    addManualMappedFund: addManualMappedFundMutation.mutateAsync,
    isAddingManual: addManualMappedFundMutation.isPending,

    approveMappedFund: approveMappedFundMutation.mutateAsync,
    isApproving: approveMappedFundMutation.isPending,

    cancelMappedFund: cancelMappedFundMutation.mutateAsync,
    isCancelling: cancelMappedFundMutation.isPending,

    removeMappedBankProduct: removeMappedBankProductMutation.mutateAsync,
    isRemoving: removeMappedBankProductMutation.isPending,

    refreshBankProducts: refreshBankProductsMutation.mutateAsync,
    isRefreshing: refreshBankProductsMutation.isPending,
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

      await approveMappedFund({ referenceNumber, bankProductId });
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
      queryClient.invalidateQueries({
        queryKey: ["BROKER_CLIENTS_MAPPED_FUNDING", user?.uid],
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

  const fundedAppliedBankProductMutation = useMutation({
    mutationFn: async ({
      referenceNumber,
      fundMappingApprovedId,
      fundedAmount,
      fundedRemarks,
      userId,
      bankName,
    }: {
      referenceNumber: string;
      fundMappingApprovedId: string;
      fundedAmount: number;
      fundedRemarks?: string;
      userId: string;
      bankName: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      await fundedAppliedBankProduct({
        referenceNumber,
        fundMappingApprovedId,
        fundedAmount,
        fundedRemarks,
        userId,
        bankName,
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
      declineReason,
    }: {
      referenceNumber: string;
      fundMappingApprovedId: string;
      declineReason: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      await declineAppliedBankProduct({
        referenceNumber,
        fundMappingApprovedId,
        declineReason,
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

    fundedAppliedBankProduct: fundedAppliedBankProductMutation.mutateAsync,
    isFunding: fundedAppliedBankProductMutation.isPending,
  };
};

export const useManualFundedMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const manualFundedMutation = useMutation({
    mutationFn: async ({
      userId,
      bankProductId,
      fundedAmount,
      fundedRemarks,
      bankName,
      productName,
    }: {
      userId: string;
      bankProductId: string;
      fundedAmount: number;
      fundedRemarks?: string;
      bankName: string;
      productName?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch("/api/bank-products/manual-funded", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          bankProductId,
          fundedAmount,
          fundedRemarks,
          bankName,
          productName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to add funded bank product"
        );
      }

      return await response.json();
    },
    onSuccess: (_data, variable) => {
      queryClient.invalidateQueries({
        queryKey: ["useClientMappedFundingDetailsQuery"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["GET_USERS"],
      });
      toast.success("Funded bank product successfully added.");
    },
    onError: (error: any) => {
      toast.error(error.message);
      console.error(error);
    },
  });

  return {
    addManualFunded: manualFundedMutation.mutateAsync,
    isAdding: manualFundedMutation.isPending,
  };
};

export const useClientMappedFundingDetailsQuery = ({
  userId,
  clientApplicationStatus,
  referenceNumber,
}: {
  userId?: string;
  clientApplicationStatus?: ClientApplicationStatus[];
  referenceNumber?: string;
}) => {
  const { user } = useAuth();

  const {
    data: mappedFund,
    isLoading,
    error,
  } = useQuery({
    // IMPORTANT: Add all parameters that affect the query to the queryKey.
    // This ensures React Query refetches when they change.
    queryKey: [
      "useClientMappedFundingDetailsQuery",
      userId,
      clientApplicationStatus,
      referenceNumber,
    ],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      // 1. Create an empty URLSearchParams object
      const queryParams = new URLSearchParams();

      // 2. Conditionally append each parameter if it exists and is not empty
      if (userId) {
        queryParams.append("userId", userId);
      }
      if (referenceNumber) {
        queryParams.append("referenceNumber", referenceNumber);
      }

      // 3. MOST IMPORTANT: Handle the array by appending each value separately
      if (clientApplicationStatus && clientApplicationStatus.length > 0) {
        clientApplicationStatus.forEach((status) => {
          queryParams.append("clientApplicationStatus", status);
        });
      }

      // 4. Construct the final URL
      const queryString = queryParams.toString();
      const url = `/api/funding-application${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData);
        toast.error("Failed to fetch client mapped funding details.");
        return null;
      }

      const data = await response.json();
      return data;
    },
    staleTime: 0,
    refetchInterval: 5 * 60 * 1000,
  });

  return { mappedFund, isLoading, error };
};
