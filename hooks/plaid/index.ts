"use client";
import { useAuth } from "@/provider/AuthContext";
import {
  getPlaidAccountByUserIdAndItemId,
  getPlaidAccounts,
  getPlaidLinkToken,
  hasAccessToken,
  unlinkPlaidItem,
} from "@/service/plaid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IncomeVerificationSourceType } from "plaid";

import { toast } from "sonner";

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
    enabled: Boolean(itemId && accountId && user),
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

export const useGetLinkToken = ({
  incomeSourceType,
  itemId,
  isNewAccount,
  hasToken,
}: {
  incomeSourceType?: IncomeVerificationSourceType;
  itemId?: string;
  isNewAccount?: boolean;
  hasToken?: boolean;
}) => {
  const { user, role } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["GET_PLAID_LINK_TOKEN", user?.uid, incomeSourceType, itemId, isNewAccount, hasToken],
    queryFn: async () => {
      if (!user || role !== "Client") return "";
      if (
        hasToken &&
        (incomeSourceType === IncomeVerificationSourceType.Bank ||
          incomeSourceType === IncomeVerificationSourceType.Payroll)
      ) {
        return null;
      }

      const linkToken = await getPlaidLinkToken({
        userId: user.uid,
        incomeSourceType,
        itemId,
        isNewAccount,
      });
      return linkToken?.link_token;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 mins
  });

  return {
    linkToken: data,
    isLoading,
  };
};

// export const useCreateLinkToken = () => {
//   const { user, loading, role } = useAuth();

//   const createMutation = useMutation({
//     mutationKey: ["plaidLinkToken", user?.uid],
//     mutationFn: async ({
//       userToken,
//       incomeSourceType,
//       itemId,
//       isNewAccount,
//     }: {
//       userToken?: string;
//       incomeSourceType?: IncomeVerificationSourceType;
//       itemId?: string;
//       isNewAccount?: boolean;
//     }) => {
//       if (!user || role !== "Client") return "";

//       const linkToken = await getPlaidLinkToken({
//         userId: user.uid,
//         userToken,
//         incomeSourceType,
//         itemId,
//         isNewAccount,
//       });
//       return linkToken?.link_token;
//     },
//     // retry: (count, err: any) => {
//     //   // Don't auto-retry while auth is still initializing or user is missing
//     //   const msg = String(err?.message || "");
//     //   if (/Auth not ready|Not signed in/i.test(msg)) return false;
//     //   return count < 2;
//     // },

//     onError: (error: any) => {
//       console.error(error);
//       const msg = /Auth not ready|Not signed in/.test(String(error?.message))
//         ? "Please sign in first."
//         : "Failed to create link token";
//       toast.error(msg);
//     },
//   });

//   return {
//     createLinkToken: createMutation.mutateAsync,
//     isCreating: createMutation.isPending,
//     canCreate: !loading && !!user,
//   };
// };

export const usePlaidAccountsMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (bankItemIds: string[]) => {
      if (!user) throw new Error("User not authenticated");

      await unlinkPlaidItem(user.uid, bankItemIds);
    },
    onSuccess: (_data, variable) => {
      toast.success("Bank account removed successfully.");
      queryClient.invalidateQueries({
        queryKey: ["GET_PLAID_ITEM_ACCOUNT", user?.uid],
      });
      variable.map((id) => {
        queryClient.invalidateQueries({
          queryKey: ["GET_PLAID_ITEM_ACCOUNT_BY_USER_ID", user?.uid, id],
          exact: false,
        });
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

export const useHasIncomeBankVerificationQuery = () => {
  const { user } = useAuth();

  const { data: incomeBankItem, isLoading } = useQuery({
    queryKey: ["GET_INCOME_BANK_VERIFICATION_USER_ID", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      return await hasAccessToken(user.uid, "INCOME_VERIFICATION_BANK");
    },
    enabled: !!user,
  });

  return {
    incomeBankItem,
    isLoading,
  };
};

export const useHasPayrollBankVerificationQuery = () => {
  const { user } = useAuth();

  const { data: incomePayrollItem, isLoading } = useQuery({
    queryKey: ["GET_INCOME_PAYROLL_VERIFICATION_USER_ID", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      return await hasAccessToken(user.uid, "INCOME_VERIFICATION_PAYROLL");
    },
    enabled: !!user,
  });

  return {
    incomePayrollItem,
    isLoading,
  };
};
