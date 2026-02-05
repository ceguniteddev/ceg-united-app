import { GET_WHOP_CHECKOUT_DETAILS } from "@/constant/react-query-keys";
import { useQuery } from "@tanstack/react-query";

export const useWhopCheckoutDetails = (checkoutId: string) => {
  const {
    data: checkoutDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: [GET_WHOP_CHECKOUT_DETAILS, checkoutId],
    queryFn: async () => {
      if (!checkoutId) return null;
      const response = await fetch(`/api/whop/checkout/${checkoutId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch checkout details");
      }
      return response.json();
    },
    enabled: !!checkoutId, // Only run the query if checkoutId is available
  });

  return { checkoutDetails, isLoading, error };
};
