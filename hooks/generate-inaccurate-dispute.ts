import { useAuth } from "@/provider/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { FactualError } from "./identify-factual-errors";

interface GenerateInaccurateDisputeParams {
  selectedErrors: {
    experian: FactualError[];
    transunion: FactualError[];
    equifax: FactualError[];
  };
}

interface GenerateInaccurateDisputeResponse {
  content?: string;
  letter?: string;
  response?: string;
  bodyHTML?: string;
  statusCode?: string;
}

/**
 * Hook to generate inaccurate information dispute letter
 */
export const useGenerateInaccurateDisputeLetter = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.uid;

  return useMutation({
    mutationFn: async (params: GenerateInaccurateDisputeParams) => {
      if (!targetUserId) {
        throw new Error("User ID required");
      }

      const response = await fetch(
        // `/api/user/${targetUserId}/dispute-letter/generate-inaccurate`,
        `/api/user/${targetUserId}/dispute-letter/identify-factual-error/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedErrors: params.selectedErrors,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate dispute letter");
      }

      const data: GenerateInaccurateDisputeResponse = await response.json();
      return data.content || data.letter || data.response || "";
    },
  });
};
