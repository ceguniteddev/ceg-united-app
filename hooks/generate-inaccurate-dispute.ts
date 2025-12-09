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
  experian?: string | null;
  transunion?: string | null;
  equifax?: string | null;
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

      // Check if response contains bureau-specific content
      if (data.experian || data.transunion || data.equifax) {
        return {
          // experian: cleanHtmlContent(data.experian),
          // transunion: cleanHtmlContent(data.transunion),
          // equifax: cleanHtmlContent(data.equifax),
          experian: data.experian,
          transunion: data.transunion,
          equifax: data.equifax,
        };
      }

      const rawContent = data.content || data.letter || data.response || "";
      return cleanHtmlContent(rawContent);
    },
  });
};

const cleanHtmlContent = (content: string | null | undefined): string => {
  if (!content) return "";
  let extractedContent = content;

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

  return extractedContent.trim();
};
