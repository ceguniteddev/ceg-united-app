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
      toast.success("Document deleted successfully.");
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

export const useUserDocumentsQuery = ({ userId }: { userId: string }) => {
  const { user } = useAuth();

  const {
    data: userDocuments,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [GET_USER_DOCUMENTS, userId],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      // const data = await getUserDocuments({ userId });
      const response = await fetch(`/api/user/${userId}/documents`);
      if (!response.ok) {
        toast.error("Failed to fetch user documents.");
        return null;
      }
      const data = await response.json();

      return data;
    },
    enabled: !!user && !!userId,
    // staleTime: 30 * 60 * 1000,
  });

  return {
    userDocuments,
    isLoading,
    refetch,
  };
};
