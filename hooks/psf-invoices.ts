import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GET_USER_PSF_INVOICES } from "@/constant/react-query-keys";
import { PsfInvoice } from "@/schema/psf-invoice";
import { toast } from "sonner";

/**
 * Hook to retrieve all PSF invoices for a specific user
 */
export const useUserPsfInvoicesQuery = (userId: string) => {
  return useQuery<PsfInvoice[]>({
    queryKey: [GET_USER_PSF_INVOICES, userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/user/${userId}/psf-invoices`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errors || "Failed to fetch PSF invoices");
      }
      return response.json();
    },
    enabled: !!userId,
  });
};

/**
 * Hook to sign a PSF invoice and generate checkout link
 */
export const useSignPsfInvoiceMutation = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      signature,
      ipAddress,
    }: {
      invoiceId: string;
      signature: {
        type: "type" | "draw";
        value: string;
        ipAddress?: string;
        macAddress?: string;
      };
      ipAddress?: string;
    }) => {
      const response = await fetch(
        `/api/user/${userId}/psf-invoices/${invoiceId}/sign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ signature, ipAddress }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errors || "Failed to sign PSF invoice");
      }

      return response.json() as Promise<{ success: boolean; url: string }>;
    },
    onSuccess: () => {
      toast.success("Invoice signed successfully!");
      queryClient.invalidateQueries({
        queryKey: [GET_USER_PSF_INVOICES, userId],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to sign invoice");
    },
  });
};
