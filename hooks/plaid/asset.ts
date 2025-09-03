import { useAuth } from "@/provider/AuthContext";
import { createAssetReport, getAssetReportRequestByUserId } from "@/service/plaid/asset";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCreateAssetReport = () => {
  const { user, loading, role } = useAuth();

  const createMutation = useMutation({
    mutationKey: ["PLAID_CREATE_ASSET_REPORT", user?.uid],
    mutationFn: async (itemId: string) => {
      if (!user || role !== "Client") return null;
      return await createAssetReport(user.uid, itemId);
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
        : "Failed to create asset report";
      toast.error(msg);
    },
    // onSuccess: () => {
    //   toast.success("Asset report created successfully.");
    // },
  });

  return {
    createAssetReport: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
};

export const useGetAssetReportByUserId = () => {
  const { user } = useAuth();

  const { data: request, isLoading } = useQuery({
    queryKey: ["GET_PLAID_ASSET_REPORT_REQUEST", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      return await getAssetReportRequestByUserId(user.uid);
    },
    enabled: !!user,
  });

  return {
    request,
    isLoading,
  };
};
