import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { generateDisputeLetterFactualErrorN8N } from "@/lib/n8n";

/**
 * POST /api/user/[userId]/dispute-letter/generate-inaccurate
 * Generate a dispute letter for inaccurate information
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
      const body = await request.json();
      const { selectedErrors } = body;

      const webhookPath = await generateDisputeLetterFactualErrorN8N();

      const response = await fetch(`${process.env.n8n_HOST}/${webhookPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
        },
        body: JSON.stringify({
          userId,
          disputeType: "inaccurate-information",
          action: "generate",
          selectedErrors,
        }),
      });

      if (!response.ok) {
        console.error("N8N Error:", response.status, await response.text());
        return internalServerError("Failed to process request");
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error generating inaccurate dispute letter:", error);
      return internalServerError("Internal server error");
    }
  }
);
