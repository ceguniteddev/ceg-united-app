import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GET_DODO_PAYMENTS } from "@/constant/react-query-keys";
import type { DodoPayment } from "@/schema/payments";

const jsonRequest = async (url: string, body: object) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Dodo payment request failed");
  return response.json();
};

export const useGetDodoPayments = () => {
  const query = useQuery<DodoPayment[]>({
    queryKey: [GET_DODO_PAYMENTS],
    queryFn: async () => {
      const response = await fetch("/api/payments/dodo/list");
      if (!response.ok) throw new Error("Failed to fetch Dodo payments");
      return response.json();
    },
  });
  return {
    dodoPayments: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};

export const useMapDodoPayment = () => {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ docId, userId }: { docId: string; userId: string }) =>
      jsonRequest("/api/payments/dodo/map", { docId, userId }),
    onSuccess: () => {
      toast.success("Dodo payment mapped successfully!");
      client.invalidateQueries({ queryKey: [GET_DODO_PAYMENTS] });
    },
    onError: () => toast.error("Failed to map Dodo payment."),
  });
  return { mapPayment: mutation.mutateAsync, isMapping: mutation.isPending };
};

export const useUnmapDodoPayment = () => {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ docId }: { docId: string }) =>
      jsonRequest("/api/payments/dodo/unmap", { docId }),
    onSuccess: () => {
      toast.success("Dodo payment unmapped successfully!");
      client.invalidateQueries({ queryKey: [GET_DODO_PAYMENTS] });
    },
    onError: () => toast.error("Failed to unmap Dodo payment."),
  });
  return {
    unmapPayment: mutation.mutateAsync,
    isUnmapping: mutation.isPending,
  };
};
