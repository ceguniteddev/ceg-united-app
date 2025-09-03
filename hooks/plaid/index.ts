"use client";
import { useAuth } from "@/provider/AuthContext";
import {
  getPlaidAccountByUserIdAndItemId,
  getPlaidAccounts,
  getPlaidItemAccounts,
  getPlaidItems,
  getPlaidLinkToken,
  hasAccessToken,
  unlinkPlaidItem,
} from "@/service/plaid";
import { createAssetReport } from "@/service/plaid/asset";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

export const useGetPlaidItems = () => {
  const { user } = useAuth();

  const { data: plaidItems, isLoading } = useQuery({
    queryKey: ["GET_PLAID_ITEMS", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      return await getPlaidItems(user.uid);
    },
    enabled: !!user,
  });

  return {
    plaidItems,
    isLoading,
  };
};

export const useHasAccessToken = (tokenType?: TokenType) => {
  const { user } = useAuth();

  const { data: hasToken, isLoading } = useQuery({
    queryKey: ["GET_HAS_ACCESS_TOKEN", user?.uid, tokenType],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      return await hasAccessToken(user.uid, tokenType);
    },
    enabled: !!user,
  });

  return {
    hasToken,
    isLoading,
  };
};

export const useGetPlaidItemAccount = (accessToken: string, itemId: string) => {
  const { user } = useAuth();

  const { data: plaidItemAccount, isLoading } = useQuery({
    queryKey: ["GET_PLAID_ITEM_ACCOUNT", user?.uid, itemId],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (!accessToken) throw new Error("Access token is required");

      return await getPlaidItemAccounts(accessToken);
    },
    enabled: !!user,
  });

  return {
    plaidItemAccount,
    isLoading,
  };
};

export const useGetPlaidItemAccountByUserId = (itemId: string, accountId: string) => {
  const { user } = useAuth();

  const { data: plaidItemAccounts, isLoading } = useQuery({
    queryKey: ["GET_PLAID_ITEM_ACCOUNT_BY_USER_ID", user?.uid, itemId, accountId],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (!itemId) throw new Error("Item id is required");
      if (!accountId) throw new Error("Account id is required");

      return await getPlaidAccountByUserIdAndItemId({ userId: user.uid, itemId, accountId });
    },
    enabled: !!user,
  });

  return {
    plaidItemAccounts,
    isLoading,
  };
};

export const useGetPlaidAccounts = () => {
  const { user } = useAuth();

  const { data, isLoading, isFetching, isRefetching, refetch, error } = useQuery({
    queryKey: ["GET_PLAID_ITEM_ACCOUNT", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      return await getPlaidAccounts(user.uid);
    },
    enabled: !!user,
  });

  return {
    plaidAccounts: data,
    isLoading,
    isFetching,
    isRefetching,
    refetch,
    error: (error as Error) ?? null,
  };
};

export const useCreateLinkToken = () => {
  const { user, loading, role } = useAuth();

  const createMutation = useMutation({
    mutationKey: ["plaidLinkToken", user?.uid],
    mutationFn: async (userToken?: string) => {
      if (!user || role !== "Client") return "";

      const linkToken = await getPlaidLinkToken(user.uid, userToken);
      return linkToken?.link_token;
    },
    // retry: (count, err: any) => {
    //   // Don’t auto-retry while auth is still initializing or user is missing
    //   const msg = String(err?.message || "");
    //   if (/Auth not ready|Not signed in/i.test(msg)) return false;
    //   return count < 2;
    // },

    onError: (error: any) => {
      console.error(error);
      const msg = /Auth not ready|Not signed in/.test(String(error?.message))
        ? "Please sign in first."
        : "Failed to create link token";
      toast.error(msg);
    },
  });

  return {
    createLinkToken: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    canCreate: !loading && !!user,
  };
};

export const usePlaidAccountsMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (bankItemIds: string[]) => {
      if (!user) throw new Error("User not authenticated");

      await unlinkPlaidItem(user.uid, bankItemIds);
    },
    onSuccess: () => {
      toast.success("Bank account removed successfully.");
      queryClient.invalidateQueries({
        queryKey: ["GET_PLAID_ITEM_ACCOUNT", user?.uid],
      });
    },
    onError: (error: any) => {
      toast.error("Failed to removed Bank account.");
      console.error(error);
    },
  });

  return {
    removeBankAccount: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
