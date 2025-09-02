import { GET_ADMIN_STATISTICS } from "@/constant/react-query-keys";
import { useAuth } from "@/provider/AuthContext";
import { getAdminStatistics } from "@/service/statistics";
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
