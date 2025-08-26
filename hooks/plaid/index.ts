"use client";
import { useAuth } from "@/provider/AuthContext";
import {
  getAccessToken,
  getPlaidItemAccounts,
  getPlaidItems,
  getPlaidLinkToken,
} from "@/service/plaid";
import { useMutation, useQuery } from "@tanstack/react-query";

import { toast } from "sonner";

export const useGetPlaidAccessToken = () => {
  const { user } = useAuth();

  const { data: accessToken, isLoading } = useQuery({
    queryKey: ["GET_PLAID_ACCESS_TOKEN", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      return await getAccessToken(user.uid);
    },
    enabled: !!user,
  });

  return {
    accessToken,
    isLoading,
  };
};

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

export const useGetPlaidItemAccount = (accessToken: string, itemId: string) => {
  const { user } = useAuth();

  const { data: plaidItemAccount, isLoading } = useQuery({
    queryKey: ["GET_PLAID_ITEM_ACCOUNT", user?.uid, itemId],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      return await getPlaidItemAccounts(accessToken);
    },
    enabled: !!user,
  });

  return {
    plaidItemAccount,
    isLoading,
  };
};

export const useCreateLinkToken = () => {
  const { user, loading, role } = useAuth();

  const createMutation = useMutation({
    mutationKey: ["plaidLinkToken", user?.uid],
    mutationFn: async () => {
      if (!user || role !== "Client") return "";

      const linkToken = await getPlaidLinkToken(user.uid);
      return linkToken.link_token;
    },
    retry: (count, err: any) => {
      // Don’t auto-retry while auth is still initializing or user is missing
      const msg = String(err?.message || "");
      if (/Auth not ready|Not signed in/i.test(msg)) return false;
      return count < 2;
    },

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
