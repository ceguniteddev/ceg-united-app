import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/AuthContext";

/**
 * Hook to get all disputes for the current user
 */
export const useGetDisputes = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  return useQuery({
    queryKey: ["disputes", targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error("User ID required");
      const response = await fetch(`/api/user/${targetUserId}/disputes`);
      if (!response.ok) {
        throw new Error("Failed to fetch disputes");
      }
      return response.json();
    },
    enabled: !!targetUserId,
  });
};
