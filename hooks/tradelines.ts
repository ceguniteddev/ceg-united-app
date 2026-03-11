import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMarkupPercentage,
  setMarkupPercentage,
  getUserRecentTradelines,
  getUserTradelines,
  getAllPurchasedTradelines,
  updateTradelineStatus,
} from "@/service/tradelines";

const QUERY_KEY = ["system-config", "markupPercentage"];
const USER_TRADELINES_KEY = ["user-tradelines"];
export const USER_ALL_TRADELINES_KEY = ["user-all-tradelines"];
export const ADMIN_ALL_PURCHASED_TRADELINES_KEY = [
  "admin-all-purchased-tradelines",
];

export const useMarkupPercentage = () => {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await getMarkupPercentage();
      return res as number;
    },
  });
  return { markupPercentage: data ?? 0, isLoading };
};

export const useSetMarkupPercentage = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: saveMarkup, isPending } = useMutation({
    mutationFn: async (value: number) => {
      await setMarkupPercentage(value);
    },
    onSuccess: () => {
      toast.success("Markup percentage saved.");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: () => toast.error("Failed to save markup percentage."),
  });
  return { saveMarkup, isPending };
};

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
    },
    onError: () => toast.error("Failed to update tradeline status."),
  });
  return { updateStatus, isPending };
};
