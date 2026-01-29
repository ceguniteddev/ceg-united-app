import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CongratsMessage {
  id: string;
  message: string;
  userId: string;
  isRead: boolean;
  createdAt: string;
}

export const useGetCongrats = (userId: string) => {
  const { data: congratsMessages, isLoading } = useQuery({
    queryKey: ["GET_CONGRATS", userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/${userId}/congrats`);

      if (!response.ok) {
        throw new Error("Failed to fetch congrats messages");
      }

      const data = await response.json();
      return data as CongratsMessage[] | null;
    },
    enabled: !!userId,
  });

  return {
    congratsMessages,
    isLoading,
  };
};

export const useMarkCongratsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      docId,
    }: {
      userId: string;
      docId: string;
    }) => {
      const response = await fetch(`/api/user/${userId}/congrats/${docId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors || "Failed to mark as read");
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["GET_CONGRATS", variables.userId],
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to mark message as read", {
        description: error.message,
      });
    },
  });
};
