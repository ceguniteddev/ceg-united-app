import {
  GET_DENEFITS_CONTRACT_BY_USER_ID,
  GET_DENEFITS_CONTRACTS,
  GET_DENEFITS_PAYMENTS,
} from "@/constant/react-query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetDenefitsContractsByUserId = (userId: string) => {
  const { data: denefitsContract, isLoading } = useQuery({
    queryKey: [GET_DENEFITS_CONTRACT_BY_USER_ID, userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/${userId}/denefits`);

      if (!response.ok) {
        toast.error("Failed to fetch denefits contract");
        return null;
      }

      const data = await response.json();

      return data;
    },
    enabled: !!userId,
  });

  return {
    denefitsContract,
    isLoading,
  };
};

export const useGetDenefitsContracts = () => {
  const { data: denefitsContracts, isLoading } = useQuery({
    queryKey: [GET_DENEFITS_CONTRACTS],
    queryFn: async () => {
      const response = await fetch(`/api/denefits/contracts`);

      if (!response.ok) {
        toast.error("Failed to fetch denefits contract");
        return null;
      }

      const data = await response.json();

      return data;
    },
    enabled: true,
  });

  return {
    denefitsContracts,
    isLoading,
  };
};

export const useGetDenefitsPayments = () => {
  const { data: denefitsPayments, isLoading } = useQuery({
    queryKey: [GET_DENEFITS_PAYMENTS],
    queryFn: async () => {
      const response = await fetch(`/api/denefits/payments`);

      if (!response.ok) {
        toast.error("Failed to fetch denefits payments");
        return null;
      }

      const data = await response.json();

      return data;
    },
    enabled: true,
  });

  return {
    denefitsPayments,
    isLoading,
  };
};

export const useMapDenefitsContractToUser = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      contractId,
      userId,
    }: {
      contractId: string;
      userId: string;
    }) => {
      const response = await fetch(`/api/denefits/payments/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to map contract to user");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Contract successfully mapped to user!");
      queryClient.invalidateQueries({ queryKey: [GET_DENEFITS_PAYMENTS] });
      queryClient.invalidateQueries({ queryKey: [GET_DENEFITS_CONTRACTS] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to map contract to user");
      console.error("Error mapping contract:", error);
    },
  });

  return {
    mapContract: mutation.mutateAsync,
    isMapping: mutation.isPending,
  };
};

export const useUnmapDenefitsContract = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ contractId }: { contractId: string }) => {
      const response = await fetch(`/api/denefits/payments/${contractId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to unmap contract");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Contract successfully unmapped!");
      queryClient.invalidateQueries({ queryKey: [GET_DENEFITS_PAYMENTS] });
      queryClient.invalidateQueries({ queryKey: [GET_DENEFITS_CONTRACTS] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unmap contract");
      console.error("Error unmapping contract:", error);
    },
  });

  return {
    unmapContract: mutation.mutateAsync,
    isUnmapping: mutation.isPending,
  };
};
