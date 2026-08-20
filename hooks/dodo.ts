import { useQuery } from "@tanstack/react-query";
import { GET_DODO_CHECKOUT_DETAILS } from "@/constant/react-query-keys";

export const useDodoCheckoutDetails = (checkoutId: string) => {
  const query = useQuery({
    queryKey: [GET_DODO_CHECKOUT_DETAILS, checkoutId],
    queryFn: async () => {
      const response = await fetch(`/api/dodo/checkout/${checkoutId}`);
      if (!response.ok)
        throw new Error("Failed to fetch Dodo checkout details");
      return response.json();
    },
    enabled: Boolean(checkoutId),
  });
  return {
    checkoutDetails: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};
