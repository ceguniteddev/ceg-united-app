import { useQuery } from "@tanstack/react-query";
import { AdminClient } from "@/lib/income-funding-types";

export const useAdminIncomeFunding = () => {
  const {
    data: clients,
    isLoading,
    refetch,
  } = useQuery<AdminClient[]>({
    queryKey: ["GET_ADMIN_INCOME_FUNDING"],
    queryFn: async () => {
      const res = await fetch("/api/admin/income-funding");
      if (!res.ok) throw new Error("Failed to fetch admin income funding");
      return res.json();
    },
  });

  return {
    clients,
    isLoading,
    refetch,
  };
};
