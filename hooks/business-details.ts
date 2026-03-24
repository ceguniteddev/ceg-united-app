import { useQuery } from "@tanstack/react-query";
import { Business } from "@/schema";

type BusinessWithCRSData = Business & {
  crsBusinessProfile?: any;
  crsBusinessScore?: any;
};

/**
 * Hook to fetch detailed business information including CRS credit data
 * @param businessId - The business ID to fetch details for
 * @param enabled - Whether to enable the query
 */
export const useBusinessDetails = (
  businessId: string | null,
  enabled: boolean = true,
) => {
  const {
    data: businessDetails,
    isLoading,
    error,
  } = useQuery<BusinessWithCRSData | null>({
    queryKey: ["GET_BUSINESS_DETAILS_WITH_CRS", businessId],
    queryFn: async () => {
      if (!businessId) return null;

      // Fetch business details with CRS data
      const response = await fetch(`/api/business/${businessId}/details`);

      if (!response.ok) {
        throw new Error("Failed to fetch business details");
      }

      const data = await response.json();
      return data;
    },
    enabled: enabled && !!businessId,
  });

  return {
    businessDetails,
    isLoading,
    error,
  };
};
