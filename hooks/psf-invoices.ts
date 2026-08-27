import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GET_USER_PSF_INVOICES } from "@/constant/react-query-keys";
import { PsfInvoice, PsfInvoiceItem } from "@/schema/psf-invoice";
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
 * Hook to create a custom PSF invoice (admin use)
 */
export const useCreatePsfInvoiceMutation = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      amount: number;
      invoiceDate?: string;
      items?: PsfInvoiceItem[];
    }) => {
      const response = await fetch(`/api/user/${userId}/psf-invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "custom",
          title: data.title,
          description: data.description,
          amount: data.amount,
          invoiceDate: data.invoiceDate,
          items: data.items,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.errors?.[0] ||
            errorData.message ||
            "Failed to create invoice",
        );
      }

      return response.json() as Promise<{ success: boolean; id: string }>;
    },
    onSuccess: () => {
      toast.success("Custom invoice created successfully!");
      queryClient.invalidateQueries({
        queryKey: [GET_USER_PSF_INVOICES, userId],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create invoice");
    },
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

/** Creates a fresh hosted checkout for a signed, unpaid invoice. */
export const usePayPsfInvoiceMutation = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId }: { invoiceId: string }) => {
      const response = await fetch(
        `/api/user/${userId}/psf-invoices/${invoiceId}/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.errors || errorData.message || "Failed to start payment",
        );
      }

      return response.json() as Promise<{ success: boolean; url: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [GET_USER_PSF_INVOICES, userId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start payment");
    },
  });
};

/**
 * Hook for admin to send a PSF invoice (generates Dodo checkout link)
 * Does not require client signature — admin-initiated send.
 */
export const useSendPsfInvoiceMutation = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId }: { invoiceId: string }) => {
      const response = await fetch(
        `/api/user/${userId}/psf-invoices/${invoiceId}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errors || "Failed to send invoice");
      }

      return response.json() as Promise<{ success: boolean; url: string }>;
    },
    onSuccess: () => {
      toast.success("Invoice sent successfully!");
      queryClient.invalidateQueries({
        queryKey: [GET_USER_PSF_INVOICES, userId],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send invoice");
    },
  });
};

/**
 * Hook for admin to manually mark a PSF invoice as paid
 */
export const useManualPayPsfInvoiceMutation = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId }: { invoiceId: string }) => {
      const response = await fetch(
        `/api/user/${userId}/psf-invoices/${invoiceId}/manual-pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errors || "Failed to mark invoice as paid");
      }

      return response.json() as Promise<{ success: boolean; message: string }>;
    },
    onSuccess: () => {
      toast.success("Invoice marked as paid successfully!");
      queryClient.invalidateQueries({
        queryKey: [GET_USER_PSF_INVOICES, userId],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to mark invoice as paid");
    },
  });
};
