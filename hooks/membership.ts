import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserMembership,
  adminSetUserMembership,
  getAllMemberships,
  MembershipTier,
} from "@/service/membership";
import { useAuth } from "@/provider/AuthContext";
import { toast } from "sonner";

export const useGetAllMemberships = () => {
  return useQuery({
    queryKey: ["all-memberships"],
    queryFn: () => getAllMemberships(),
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
  });
};

export const useMembership = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  return useQuery({
    queryKey: ["membership", targetUserId],
    queryFn: () => getUserMembership(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
  });
};

export const useAdminSetMembershipMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      tier,
      status,
      updatedBy,
    }: {
      userId: string;
      tier: MembershipTier;
      status: string;
      updatedBy: string;
    }) => {
      return await adminSetUserMembership({ userId, tier, status, updatedBy });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["membership", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-memberships"],
      });
      toast.success("Membership updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update membership:", error);
      toast.error("Failed to update membership");
    },
  });
};
