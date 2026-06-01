import { useQuery } from "@tanstack/react-query";
import { getUserAddons, UserAddon, hasActiveAddon } from "@/service/addons";
import { useAuth } from "@/provider/AuthContext";

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
