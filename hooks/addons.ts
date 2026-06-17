import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserAddons,
  UserAddon,
  hasActiveAddon,
  toggleUserAddon,
} from "@/service/addons";
import { useAuth } from "@/provider/AuthContext";
import { toast } from "sonner";

export function useAddons() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-addons", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      return (await getUserAddons(user.uid)) as UserAddon[];
    },
    enabled: !!user?.uid,
  });
}

export function useUserAddons(userId?: string) {
  const { user } = useAuth();
  const targetUid = userId || user?.uid;

  return useQuery({
    queryKey: ["user-addons", targetUid],
    queryFn: async () => {
      if (!targetUid) return [];
      return (await getUserAddons(targetUid)) as UserAddon[];
    },
    enabled: !!targetUid,
  });
}

export function useHasCreditRepairAddon() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["has-credit-repair-addon", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return false;
      return await hasActiveAddon(user.uid, "credit_module_pro");
    },
    enabled: !!user?.uid,
  });
}

export function useAdminToggleAddonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleUserAddon,
    onSuccess: (_, variables) => {
      const { userId } = variables;
      queryClient.invalidateQueries({ queryKey: ["user-addons", userId] });
      queryClient.invalidateQueries({
        queryKey: ["has-credit-repair-addon", userId],
      });
      toast.success("User add-on status updated successfully");
    },
    onError: (error: any) => {
      console.error("Failed to toggle user add-on:", error);
      toast.error(error?.message || "Failed to update user add-on status");
    },
  });
}
