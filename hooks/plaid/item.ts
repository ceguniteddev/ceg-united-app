import { useAuth } from "@/provider/AuthContext";
import { getItemLinkUpdateModeData, getItemLinkUpdateModeNewAccount } from "@/service/plaid/item";
import { useQuery } from "@tanstack/react-query";

export function useUserFlags() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["USER_LINK_UPDATE_MODE", user?.uid],
    queryFn: () => getItemLinkUpdateModeData(user?.uid ?? ""),
    refetchInterval: 60 * 60 * 1000,
  });

  return {
    flags: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export const useGetNewAccountFlags = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["USER_NEW_ACCOUNT_LINK_UPDATE_MODE", user?.uid],
    queryFn: () => getItemLinkUpdateModeNewAccount(user?.uid ?? ""),
    refetchInterval: 60 * 60 * 1000,
  });

  return {
    flags: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
};
