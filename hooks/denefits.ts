import {
  GET_DENEFITS_CONTRACT_BY_USER_ID,
  GET_DENEFITS_CONTRACTS,
} from "@/constant/react-query-keys";
import { useQuery } from "@tanstack/react-query";
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
