import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";
import { GET_WALLET } from "@/constant/react-query-keys";
import { toast } from "sonner";

export interface WalletTransaction {
  id: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  timestamp: any;
  metadata?: any;
  paymentId?: string;
}

export interface WalletData {
  balance: number;
  transactions: WalletTransaction[];
}

/**
 * Hook to fetch a user's wallet balance and transactions.
 * @param userId - The ID of the user whose wallet to fetch.
 */
export const useWalletQuery = (userId: string) => {
  return useQuery<WalletData, Error>({
    queryKey: [GET_WALLET, userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("User ID is required to fetch wallet data.");
      }
      const getWalletFn = httpsCallable<{ userId: string }, WalletData>(
        getFunctions(app),
        "getWallet",
      );
      const response = await getWalletFn({ userId });
      return response.data;
    },
    enabled: !!userId,
  });
};

export interface SpendFundsParams {
  amount: number;
  description: string;
  metadata?: any;
}

/**
 * Mutation hook to spend funds from a client's wallet.
 */
export const useSpendFundsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, SpendFundsParams>({
    mutationFn: async (params: SpendFundsParams) => {
      const spendFundsFn = httpsCallable<SpendFundsParams, any>(
        getFunctions(app),
        "spendFunds",
      );
      const response = await spendFundsFn(params);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Wallet funds spent successfully");
      queryClient.invalidateQueries({ queryKey: [GET_WALLET] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to spend wallet funds");
      console.error("Error spending funds:", error);
    },
  });
};

export interface AddFundsParams {
  amount: number;
  description: string;
  paymentId?: string;
}

/**
 * Mutation hook to add funds to a client's wallet.
 */
export const useAddFundsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, AddFundsParams>({
    mutationFn: async (params: AddFundsParams) => {
      const addFundsFn = httpsCallable<AddFundsParams, any>(
        getFunctions(app),
        "addFunds",
      );
      const response = await addFundsFn(params);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Funds added to wallet successfully");
      queryClient.invalidateQueries({ queryKey: [GET_WALLET] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add funds to wallet");
      console.error("Error adding funds:", error);
    },
  });
};
