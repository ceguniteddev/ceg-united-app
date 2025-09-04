import { useAuth } from "@/provider/AuthContext";
import { getAssetReportRequestByUserId } from "@/service/plaid/asset";
import { useQuery } from "@tanstack/react-query";

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
