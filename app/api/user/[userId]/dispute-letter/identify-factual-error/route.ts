import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { generateDisputeLetterFactualErrorN8N } from "@/lib/n8n";

/**
 * POST /api/user/[userId]/dispute-letter/identify-factual-error
 * Identify factual errors in credit report
 */
export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string }> }
  ) => {
    const { userId } = (await params) ?? {};

    if (!userId) {
      return badRequest({ errors: "User ID is required" });
    }

    try {
      const { disputeType, action } = await request.json();

      if (!disputeType) {
        return badRequest({ errors: "Dispute type is required" });
      }

      const webhookPath = await generateDisputeLetterFactualErrorN8N();

      console.log("Invoking N8N webhook at path:", webhookPath);
      console.log(
        `${process.env.n8n_HOST}/generate-dispute-letter-factual-error`
      );

      const response = await fetch(
        `${process.env.n8n_HOST}/generate-dispute-letter-factual-error`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
          },
          body: JSON.stringify({
            userId,
            disputeType,
            action,
          }),
        }
      );

      if (!response.ok) {
        console.error("N8N Error:", response.status, await response.text());
        return internalServerError("Failed to process request");
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error identifying factual errors:", error);
      return internalServerError("Internal server error");
    }
  }
);
