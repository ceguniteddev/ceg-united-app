import { GET_USER_CRS_REPORT } from "@/constant/react-query-keys";
import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { getCRSReport, refreshCRSData } from "@/service/crs";
import { CreditReportWithId } from "@/types/crs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useClientCRSReportQuery = () => {
  const { user } = useAuth();

  const { data: crsReport, isLoading } = useQuery({
    queryKey: [GET_USER_CRS_REPORT, user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      return (await getCRSReport(user.uid)) as CreditReportWithId[];
    },
    enabled: !!user,
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

      await refreshCRSData(userId);
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
