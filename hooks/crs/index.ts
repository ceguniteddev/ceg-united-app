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
    mutationFn: async ({
      userId,
      bureaus,
    }: {
      userId: string;
      bureaus?: { equifax: boolean; experian: boolean; transunion: boolean };
    }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      const response = await fetch(`/api/crs/${userId}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bureaus }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Error refreshing CRS data:", data);
        throw new AppError("Failed to refresh CRS data.");
      }
    },
    onSuccess: (data, _variable) => {
      toast.success("CRS data refreshed successfully.");
    },

    onError: (error: any) => {
      toast.error("Failed to refresh CRS data. Please try again.");
    },
  });

  return {
    refreshCRSData: refreshCRSDataMutation.mutateAsync,
    isUpdating: refreshCRSDataMutation.isPending,
  };
};
