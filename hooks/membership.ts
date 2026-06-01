import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserMembership,
  adminSetUserMembership,
  MembershipTier,
} from "@/service/membership";
import { useAuth } from "@/provider/AuthContext";
import { toast } from "sonner";

export const useMembership = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  return useQuery({
    queryKey: ["membership", targetUserId],
    queryFn: () => getUserMembership(targetUserId!),
    enabled: !!targetUserId,
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
      toast.success("Membership updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update membership:", error);
      toast.error("Failed to update membership");
    },
  });
};
