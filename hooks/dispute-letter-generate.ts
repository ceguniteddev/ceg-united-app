import { useAuth } from "@/provider/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface GenerateDisputeLetterParams {
  disputeType: string;
  formData?: Record<string, any>;
}

interface GenerateDisputeLetterResponse {
  content?: string;
  letter?: string;
  response?: string;
  bodyHTML?: string;
  statusCode?: string;
}

/**
 * Hook to generate dispute letter via n8n webhook
 */
export const useGenerateDisputeLetter = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: GenerateDisputeLetterParams) => {
      if (!user?.uid) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(
        `/api/user/${user.uid}/dispute-letter/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            disputeType: params.disputeType,
            formData: params.formData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate dispute letter");
      }

      const data: GenerateDisputeLetterResponse = await response.json();
      console.log("🔍 API Response Data:", data);
      let extractedContent =
        data.bodyHTML || data.content || data.letter || data.response || "";

      // Clean up the HTML for Quill editor
      if (extractedContent) {
        // Remove outer div wrapper if present
        extractedContent = extractedContent.replace(
          /^<div[^>]*>([\s\S]*)<\/div>$/i,
          "$1"
        );

        // Convert <br> and <br/> tags to paragraph breaks first
        extractedContent = extractedContent.replace(/<br\s*\/?>/gi, "</p><p>");

        // Convert inner divs to paragraphs (preserve content, remove inline styles)
        extractedContent = extractedContent.replace(
          /<div[^>]*>([\s\S]*?)<\/div>/gi,
          "<p>$1</p>"
        );

        // Remove all types of newlines: \n, \r\n, \r (both escaped and actual)
        extractedContent = extractedContent
          .replace(/\\n/g, " ")
          .replace(/\n/g, " ")
          .replace(/\r/g, "");

        // Trim whitespace inside paragraph tags
        extractedContent = extractedContent.replace(/<p>\s+/g, "<p>");
        extractedContent = extractedContent.replace(/\s+<\/p>/g, "</p>");

        // Clean up multiple spaces
        extractedContent = extractedContent.replace(/\s+/g, " ");

        // Clean up empty paragraphs
        extractedContent = extractedContent.replace(/<p><\/p>/g, "");
        extractedContent = extractedContent.replace(/<p>\s*<\/p>/g, "");

        // Ensure content is wrapped in paragraph tags if not already
        if (!extractedContent.startsWith("<p>")) {
          extractedContent = `<p>${extractedContent}</p>`;
        }

        extractedContent = extractedContent.trim();
      }

      console.log("🔍 Cleaned Content:", extractedContent);
      return extractedContent;
    },
    onSuccess: () => {
      toast.success("Dispute letter generated successfully!");
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to generate dispute letter. Please try again."
      );
    },
  });
};
