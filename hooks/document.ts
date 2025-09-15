import { GET_USER_DOCUMENTS } from "@/constant/react-query-keys";
import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { deleteDocument } from "@/service/documents";
import { getUserDocuments } from "@/service/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useUserDocumentMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async ({ path }: { path: string }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      await deleteDocument(path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [GET_USER_DOCUMENTS, user?.uid],
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
    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};

export const useUserDocumentsQuery = () => {
  const { user } = useAuth();

  const {
    data: userDocuments,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [GET_USER_DOCUMENTS, user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      return await getUserDocuments(user.uid);
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    userDocuments,
    isLoading,
    refetch,
  };
};
