import { useQuery } from "@tanstack/react-query";
import { getUserMembership } from "@/service/membership";
import { useAuth } from "@/provider/AuthContext";

export const useMembership = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["membership", user?.uid],
    queryFn: () => getUserMembership(user!.uid),
    enabled: !!user?.uid,
  });
};
