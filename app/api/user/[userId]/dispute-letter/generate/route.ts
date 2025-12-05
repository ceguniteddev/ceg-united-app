import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";

const { generateDisputeLetterN8N } = await import("@/lib/n8n");
/**
 * POST /api/user/[userId]/dispute-letter/generate
 * Generate a dispute letter using AI
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
      const { disputeType } = await request.json();

      if (!disputeType) {
        return badRequest({ errors: "Dispute type is required" });
      }

      const webhookPath = await generateDisputeLetterN8N();

      const response = await fetch(`${process.env.n8n_HOST}/${webhookPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
        },
        body: JSON.stringify({
          userId,
          disputeType,
        }),
      });

      const data = await response.json();
      // console.log("🔍 N8N Response Status:", response.status);
      // console.log("🔍 N8N Response Data:", JSON.stringify(data, null, 2));
      // console.log("🔍 Data keys:", Object.keys(data));

      if (!response.ok) {
        throw new Error("Failed to generate dispute letter from n8n webhook");
      }

      return NextResponse.json(data, { status: 200 });
      // return NextResponse.json(
      //   {
      //     statusCode: "200",
      //     bodyHTML:
      //       '<div style="border-bottom: 1px solid #ccc; padding-bottom: 20px; margin-bottom: 20px;">\n<p><strong>Date:</strong> [Current Date]</p>\n<p><strong>To:</strong> Equifax<br>\nP.O. Box 740256, Atlanta, GA 30374</p>\n\n<p><strong>From:</strong> SHARONx BECKERBERK<br>\naaroncampecino@gmail.com | SSN: 111-11-1111</p>\n\n<p><strong>RE: Notice of Unlawful Reinsertion - FCRA §611(a)(5)(B) Violation</strong></p>\n\n<p>To Whom It May Concern,</p>\n\n<p>I am writing to formally dispute an account that has been unlawfully reinserted into my credit file. A review of my records indicates this account was previously deleted or missing from my report dated 2025-11-01, but has now reappeared on my report dated 2025-11-20 without the required notification.</p>\n\n<div style="background: #eee; padding: 10px; margin: 15px 0;">\n    <strong>Reinserted Account Details:</strong><br>\n    Creditor Name: POPULAR FINANCE, INC<br>\n    Account Number: 23568923038\n</div>\n\n<p><strong>Violation of Law:</strong><br>\nUnder <strong>FCRA §611(a)(5)(B)</strong>, a credit reporting agency must notify the consumer within 5 business days if a previously deleted account is reinserted. I received no such notice.</p>\n\n<p><strong>Remedy Requested:</strong><br>\nSince you failed to provide the mandatory notification, the reinsertion is illegal. I demand you <strong>permanently delete</strong> this account immediately and send written confirmation.</p>\n\n<p>Sincerely,<br>\nSHARONx BECKERBERK</p>\n</div>',
      //   },
      //   { status: 200 }
      // );
    } catch (error: any) {
      console.error("Failed to generate dispute letter:", error);
      return internalServerError(
        error.message || "Failed to generate dispute letter"
      );
    }
  }
);
