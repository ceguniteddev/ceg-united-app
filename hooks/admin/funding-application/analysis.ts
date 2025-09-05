import { GET_CLIENT_DOCUMENTS } from "@/constant/react-query-keys";
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
    refetchOnWindowFocus: true,
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
