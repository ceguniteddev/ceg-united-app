import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DisputeLetter } from "@/schema/dispute-letter";
import { useAuth } from "@/provider/AuthContext";

/**
 * Hook to get all dispute letters for the current user or a specific user (admin view)
 */
export const useGetDisputeLetters = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  return useQuery({
    queryKey: ["dispute-letters", targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error("User ID required");
      const response = await fetch(`/api/user/${targetUserId}/dispute-letter`);
      if (!response.ok) {
        throw new Error("Failed to fetch dispute letters");
      }
      return response.json() as Promise<DisputeLetter[]>;
    },
    enabled: !!targetUserId,
  });
};

/**
 * Hook to get a single dispute letter
 */
export const useGetDisputeLetter = (id: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dispute-letter", user?.uid, id],
    queryFn: async () => {
      if (!user?.uid) throw new Error("User not authenticated");
      const response = await fetch(
        `/api/user/${user.uid}/dispute-letter/${id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch dispute letter");
      }
      return response.json() as Promise<DisputeLetter>;
    },
    enabled: !!id && !!user?.uid,
  });
};

/**
 * Hook to create a new dispute letter
 */
export const useCreateDisputeLetter = (userId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  return useMutation({
    mutationFn: async (data: Partial<DisputeLetter>) => {
      if (!targetUserId) throw new Error("User ID required");
      const response = await fetch(`/api/user/${targetUserId}/dispute-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors || "Failed to create dispute letter");
      }

      return response.json() as Promise<DisputeLetter>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispute-letters"] });
      toast.success("Letter created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook to update a dispute letter
 */
export const useUpdateDisputeLetter = (id: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<DisputeLetter>) => {
      if (!user?.uid) throw new Error("User not authenticated");
      const response = await fetch(
        `/api/user/${user.uid}/dispute-letter/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors || "Failed to update dispute letter");
      }

      return response.json() as Promise<DisputeLetter>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispute-letters"] });
      queryClient.invalidateQueries({
        queryKey: ["dispute-letter", user?.uid, id],
      });
      toast.success("Letter updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook to delete a dispute letter
 */
export const useDeleteDisputeLetter = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      const response = await fetch(
        `/api/user/${user.uid}/dispute-letter/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors || "Failed to delete dispute letter");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispute-letters"] });
      toast.success("Letter deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook to submit a letter for review
 */
export const useSubmitLetterForReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.uid) throw new Error("User not authenticated");
      const response = await fetch(
        `/api/user/${user.uid}/dispute-letter/${id}/submit`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors || "Failed to submit letter for review");
      }

      return response.json() as Promise<DisputeLetter>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispute-letters"] });
      toast.success("Letter submitted for review");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
