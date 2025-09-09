import { GET_USER_CRS_REPORT } from "@/constant/react-query-keys";
import { useAuth } from "@/provider/AuthContext";
import { getCRSReport } from "@/service/crs";
import { useQuery } from "@tanstack/react-query";

export const useClientCRSReportQuery = () => {
  const { user } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: [GET_USER_CRS_REPORT, user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      return await getCRSReport(user.uid);
    },
    enabled: !!user,
  });

  return {
    users,
    isLoading,
  };
};
