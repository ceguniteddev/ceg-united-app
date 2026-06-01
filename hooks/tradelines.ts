import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getUserRecentTradelines,
  getUserTradelines,
  getAllPurchasedTradelines,
  updateTradelineStatus,
  getPendingTradelinesCount,
} from "@/service/tradelines";

const USER_TRADELINES_KEY = ["user-tradelines"];
export const USER_ALL_TRADELINES_KEY = ["user-all-tradelines"];
export const ADMIN_ALL_PURCHASED_TRADELINES_KEY = [
  "admin-all-purchased-tradelines",
];
export const ADMIN_PENDING_TRADELINES_COUNT_KEY = [
  "admin-pending-tradelines-count",
];

export const useUserRecentTradelines = (userId: string | undefined) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [...USER_TRADELINES_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];
      return await getUserRecentTradelines(userId);
    },
    enabled: !!userId,
  });
  return { recentTradelines: data ?? [], isLoading, refetch };
};

export const useUserTradelines = (userId: string | undefined) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...USER_ALL_TRADELINES_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];
      return await getUserTradelines(userId);
    },
    enabled: !!userId,
  });
  return { tradelines: data ?? [], isLoading, error, refetch };
};

export const useAllPurchasedTradelines = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ADMIN_ALL_PURCHASED_TRADELINES_KEY,
    queryFn: async () => {
      return await getAllPurchasedTradelines();
    },
  });
  return { tradelines: data ?? [], isLoading, error, refetch };
};

export const useUpdateTradelineStatus = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: updateStatus, isPending } = useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: string;
      reason?: string;
    }) => {
      await updateTradelineStatus(id, status, reason);
    },
    onSuccess: () => {
      toast.success("Tradeline status updated successfully.");
      queryClient.invalidateQueries({
        queryKey: ADMIN_ALL_PURCHASED_TRADELINES_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: ADMIN_PENDING_TRADELINES_COUNT_KEY,
      });
    },
    onError: () => toast.error("Failed to update tradeline status."),
  });
  return { updateStatus, isPending };
};

export const usePendingTradelinesCount = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ADMIN_PENDING_TRADELINES_COUNT_KEY,
    queryFn: async () => {
      return await getPendingTradelinesCount();
    },
  });
  return { count: data ?? 0, isLoading, error, refetch };
};
