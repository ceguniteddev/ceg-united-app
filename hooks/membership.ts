import { useQuery } from "@tanstack/react-query";
import { getUserMembership } from "@/service/membership";
import { useAuth } from "@/provider/AuthContext";

export const useMembership = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  return useQuery({
    queryKey: ["membership", targetUserId],
    queryFn: () => getUserMembership(targetUserId!),
    enabled: !!targetUserId,
  });
};
