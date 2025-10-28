import { GET_USER_CRS_REPORT } from "@/constant/react-query-keys";
import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { getApplyFunding } from "@/service/apply-funding";
import { refreshCRSData } from "@/service/crs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useClientCRSReportQuery = ({ userId }: { userId: string }) => {
  const { user } = useAuth();

  const { data: crsReport, isLoading } = useQuery({
    queryKey: [GET_USER_CRS_REPORT, userId],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      // const data = await getCRSReport(userId);
      const response = await fetch(`/api/crs/${userId}`);

      if (!response.ok) {
        toast.error("Failed to fetch CRS report.");
        return null;
      }

      const data = await response.json();
      return data;
    },
    enabled: !!user && !!userId,
  });

  return {
    crsReport,
    isLoading,
  };
};

export const useRefreshCRSData = () => {
  const { user } = useAuth();

  const refreshCRSDataMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      const appliedFundings = await getApplyFunding(userId);
      let referenceNumber = "";
      if (appliedFundings && appliedFundings.length > 0) {
        referenceNumber = appliedFundings[0].referenceNumber!;
      }

      await refreshCRSData({ userId, referenceNumber });
    },
    onSuccess: (data, _variable) => {
      toast.success("CRS data refreshed successfully.");
    },

    onError: (error: any) => {
      console.log("Error refreshing CRS data:", error);
      toast.error("Failed to refresh CRS data. Please try again.");
    },
  });

  return {
    refreshCRSData: refreshCRSDataMutation.mutateAsync,
    isUpdating: refreshCRSDataMutation.isPending,
  };
};
