import { useQuery } from "@tanstack/react-query";
import { GET_WHOP_PAYMENTS } from "@/constant/react-query-keys";
import { Payment } from "@whop/sdk/resources.js";

export const useGetWhopPayments = () => {
  const {
    data: whopPayments,
    isLoading,
    error,
  } = useQuery<Payment[]>({
    queryKey: [GET_WHOP_PAYMENTS],
    queryFn: async () => {
      const response = await fetch("/api/payments/whop/list");
      if (!response.ok) {
        throw new Error("Failed to fetch whop payments");
      }
      return response.json();
    },
  });

  return { whopPayments, isLoading, error };
};
