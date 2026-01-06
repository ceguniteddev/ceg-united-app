import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CongratsMessage {
  id: string;
  message: string;
  userId: string;
  isRead: boolean;
  createdAt: string;
}

export const useGetCongrats = (referenceNumber: string) => {
  const { data: congratsMessages, isLoading } = useQuery({
    queryKey: ["GET_CONGRATS", referenceNumber],
    queryFn: async () => {
      const response = await fetch(
        `/api/funding-application/${referenceNumber}/congrats`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch congrats messages");
      }

      const data = await response.json();
      return data as CongratsMessage[] | null;
    },
    enabled: !!referenceNumber,
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
      referenceNumber,
      docId,
    }: {
      referenceNumber: string;
      docId: string;
    }) => {
      const response = await fetch(
        `/api/funding-application/${referenceNumber}/congrats`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ docId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors || "Failed to mark as read");
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["GET_CONGRATS", variables.referenceNumber],
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to mark message as read", {
        description: error.message,
      });
    },
  });
};
