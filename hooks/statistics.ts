import { GET_ADMIN_STATISTICS, GET_CLIENT_STATISTICS } from "@/constant/react-query-keys";
import { useAuth } from "@/provider/AuthContext";
import { getAdminStatistics, getClientStatistics } from "@/service/statistics";
import { useQuery } from "@tanstack/react-query";

export const useGetAdminStatistics = (state?: string) => {
  const { user } = useAuth();

  const { data: adminStatistics, isLoading } = useQuery({
    queryKey: [GET_ADMIN_STATISTICS],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = (await getAdminStatistics()) as AdminStatistics;

      return data;
    },
    enabled: !!user,
  });

  return {
    adminStatistics,
    isLoading,
  };
};

export const useGetClientStatistics = (state?: string) => {
  const { user } = useAuth();

  const { data: clientStatistics, isLoading } = useQuery({
    queryKey: [GET_CLIENT_STATISTICS, user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = await getClientStatistics(user.uid);

      return data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  return {
    clientStatistics,
    isLoading,
  };
};
