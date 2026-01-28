import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GET_WHOP_PAYMENTS } from "@/constant/react-query-keys";
import { WhopPayment } from "@/schema/payments";
import { toast } from "sonner";

export const useGetWhopPayments = () => {
  const {
    data: whopPayments,
    isLoading,
    error,
  } = useQuery<WhopPayment[]>({
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

export const useMapWhopPayment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: mapPayment, isPending: isMapping } = useMutation({
    mutationFn: async ({
      docId,
      userId,
    }: {
      docId: string;
      userId: string;
    }) => {
      const response = await fetch("/api/payments/whop/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, userId }),
      });
      if (!response.ok) {
        throw new Error("Failed to map payment");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Payment mapped successfully!");
      queryClient.invalidateQueries({ queryKey: [GET_WHOP_PAYMENTS] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to map payment.");
    },
  });

  return { mapPayment, isMapping };
};

export const useUnmapWhopPayment = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: unmapPayment, isPending: isUnmapping } = useMutation({
    mutationFn: async ({ docId }: { docId: string }) => {
      const response = await fetch("/api/payments/whop/unmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
      });
      if (!response.ok) {
        throw new Error("Failed to unmap payment");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Payment unmapped successfully!");
      queryClient.invalidateQueries({ queryKey: [GET_WHOP_PAYMENTS] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unmap payment.");
    },
  });

  return { unmapPayment, isUnmapping };
};
