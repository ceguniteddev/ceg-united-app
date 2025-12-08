import { useAuth } from "@/provider/AuthContext";
import { useMutation } from "@tanstack/react-query";

interface IdentifyFactualErrorsParams {
  disputeType: string;
  action: string;
}

export interface FactualError {
  creditorName: string;
  accountNumber: string;
  error: string;
}

export interface IdentifyFactualErrorsResponse {
  statusCode: string;
  experian: FactualError[];
  transunion: FactualError[];
  equifax: FactualError[];
}

export const useIdentifyFactualErrors = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  return useMutation({
    mutationFn: async (params: IdentifyFactualErrorsParams) => {
      if (!targetUserId) {
        throw new Error("User ID required");
      }

      const response = await fetch(
        `/api/user/${targetUserId}/dispute-letter/identify-factual-error`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to identify factual errors");
      }

      const data: IdentifyFactualErrorsResponse = await response.json();
      return data;
    },
  });
};
