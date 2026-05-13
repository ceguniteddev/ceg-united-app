import {
  GET_CLIENT_DOCUMENTS,
  GET_USER_DOCUMENTS,
} from "@/constant/react-query-keys";
import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { getAnalysis, updateAnalysis } from "@/service/analysis";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useAnalysisQuery = (referenceNumber: string) => {
  const { user } = useAuth();

  const {
    data: analysisData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["GET_APPLICATION_ANALYSIS", referenceNumber],
    enabled: !!user && !!referenceNumber,
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = await getAnalysis(referenceNumber);
      return data;
    },
    staleTime: 0,
    // refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
  });

  return { analysisData, isLoading, error };
};

export const useAnalysisMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      analysis,
      referenceNumber,
    }: {
      analysis: string;
      id: string;
      referenceNumber: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      await updateAnalysis(referenceNumber, id, analysis);
    },
    onSuccess: (_data, variable) => {
      queryClient.invalidateQueries({
        queryKey: ["GET_APPLICATION_ANALYSIS", variable.referenceNumber],
      });
    },
    onError: (error: any) => {
      if (error instanceof AppError) {
        toast.warning(error.message);
      } else {
        toast.warning(error.message);
        console.error(error);
      }
    },
  });

  return {
    updateAnalysis: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};

export const useRefreshAnalysisData = () => {
  const { user } = useAuth();

  const refreshAnalysisDataMutation = useMutation({
    mutationFn: async ({ referenceNumber }: { referenceNumber: string }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      const response = await fetch(
        `/api/funding-application/${referenceNumber}/analysis/refresh`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        console.error("Error refreshing Analysis data:", data);
        throw new AppError("Failed to refresh Analysis data.");
      }
    },

    onError: (error: any) => {
      toast.error("Failed to refresh Analysis data. Please try again.");
    },
  });

  return {
    refreshAnalysisData: refreshAnalysisDataMutation.mutateAsync,
    isUpdating: refreshAnalysisDataMutation.isPending,
  };
};

export const useEmailClientAnalysisData = () => {
  const { user } = useAuth();

  const emailClientAnalysisDataMutation = useMutation({
    mutationFn: async ({ referenceNumber }: { referenceNumber: string }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      const response = await fetch(
        `/api/funding-application/${referenceNumber}/analysis/send-client`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        console.error("Error sending Client analysis data:", data);
        throw new AppError("Failed to send Client analysis data.");
      }
    },
    onSuccess: (data, _variable) => {
      toast.success("Client analysis data sent successfully.");
    },

    onError: (error: any) => {
      toast.error("Failed to send Client analysis data. Please try again.");
    },
  });

  return {
    emailClientAnalysisData: emailClientAnalysisDataMutation.mutateAsync,
    isSending: emailClientAnalysisDataMutation.isPending,
  };
};

export const useSaveToDocuments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const saveToDocumentsMutation = useMutation({
    mutationFn: async ({ referenceNumber }: { referenceNumber: string }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      const response = await fetch(
        `/api/funding-application/${referenceNumber}/save-to-documents`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        console.error("Error saving analysis to documents:", data);
        throw new AppError("Failed to save analysis to documents.");
      }

      return response.json();
    },
    onSuccess: (data, variable) => {
      toast.success("Analysis saved to My Documents successfully.");
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
      toast.error("Failed to save analysis to documents. Please try again.");
    },
  });

  return {
    saveToDocuments: saveToDocumentsMutation.mutateAsync,
    isSaving: saveToDocumentsMutation.isPending,
  };
};
