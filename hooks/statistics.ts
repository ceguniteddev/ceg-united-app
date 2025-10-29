import {
  GET_ADMIN_STATISTICS,
  GET_CLIENT_STATISTICS,
} from "@/constant/react-query-keys";
import { useAuth } from "@/provider/AuthContext";
import { getClientStatistics } from "@/service/statistics";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetAdminStatistics = (state?: string) => {
  const { user } = useAuth();

  const { data: adminStatistics, isLoading } = useQuery({
    queryKey: [GET_ADMIN_STATISTICS],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const response = await fetch("/api/admin/statistics");

      if (!response.ok) {
        toast.error("Failed to fetch admin statistics.");
        return null;
      }

      const data = await response.json();

      return data;
    },
    enabled: !!user,
  });

  return {
    adminStatistics,
    isLoading,
  };
};

export const useGetClientStatistics = () => {
  const { user } = useAuth();

  const { data: clientStatistics, isLoading } = useQuery({
    queryKey: [GET_CLIENT_STATISTICS, user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      // const data = await getClientStatistics(user.uid);
      const response = await fetch(`/api/user/${user.uid}/statistics`);

      if (!response.ok) {
        const data = await response.json();
        console.error("Error fetching client statistics:", data);
        toast.error("Failed to fetch client statistics.");
        return null;
      }

      const data = await response.json();

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

export const useGetClientStatisticsByUserId = (userId: string) => {
  const { user } = useAuth();

  const { data: clientStatistics, isLoading } = useQuery({
    queryKey: [GET_CLIENT_STATISTICS, userId],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      // const data = await getClientStatistics(userId);
      const response = await fetch(`/api/user/${userId}/statistics`);

      if (!response.ok) {
        toast.error("Failed to fetch client statistics.");
        return null;
      }

      const data = await response.json();

      return data;
    },
    enabled: !!user && !!userId,
    staleTime: 10 * 60 * 1000,
  });

  return {
    clientStatistics,
    isLoading,
  };
};
