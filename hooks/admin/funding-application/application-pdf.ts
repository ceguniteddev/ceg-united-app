import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GET_CLIENT_DOCUMENTS,
  GET_USER_DOCUMENTS,
} from "@/constant/react-query-keys";
import AppError from "@/error/AppError";

export const useSaveApplicationPdf = (referenceNumber: string) => {
  const queryClient = useQueryClient();

  const saveApplicationPdfMutation = useMutation({
    mutationFn: async () => {
      if (!referenceNumber) {
        throw new AppError("Application reference number is required");
      }

      const response = await fetch(
        `/api/funding-application/${referenceNumber}/save-application-pdf`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        console.error("Error generating application PDF:", data);
        throw new AppError("Failed to save application to documents.");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Application Form saved to My Documents successfully");

      // Invalidate client documents query to refresh the documents list
      queryClient.invalidateQueries({
        queryKey: [GET_CLIENT_DOCUMENTS],
      });
      queryClient.invalidateQueries({
        queryKey: [GET_USER_DOCUMENTS],
        exact: false,
      });
    },
    onError: (error: any) => {
      toast.error(
        error.message ||
          "Failed to save application to documents. Please try again.",
      );
    },
  });

  return {
    savePdf: saveApplicationPdfMutation.mutateAsync,
    isSaving: saveApplicationPdfMutation.isPending,
  };
};
