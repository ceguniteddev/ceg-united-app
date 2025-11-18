import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";
import { generateDisputeLetter } from "@/service/dispute-letter/generate";
import { DisputeTypeEnum } from "@/schema/dispute-letter";
import { z } from "zod";

const generateLetterSchema = z.object({
  disputeType: DisputeTypeEnum,
  opportunity: z.object({
    type: DisputeTypeEnum,
    severity: z.enum(["high", "medium", "low"]),
    affectedBureaus: z.array(z.enum(["Equifax", "Experian", "TransUnion"])),
    account: z
      .object({
        accountName: z.string(),
        accountNumber: z.string().optional(),
        accountType: z.string().optional(),
        creditorName: z.string(),
        balance: z.number().optional(),
      })
      .optional(),
    reason: z.string(),
    details: z.string(),
    recommendedAction: z.string(),
    potentialImpact: z.string(),
  }),
  userInfo: z.object({
    firstName: z.string(),
    lastName: z.string(),
    address: z.object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
    }),
    phoneNumber: z.string().optional(),
  }),
  templateId: z.string().optional(),
  customInstructions: z.string().optional(),
});

/**
 * POST /api/dispute-letter/generate
 * Generate a dispute letter using AI
 */
export const POST = withAuth(async (request: NextRequest, context) => {
  const currentUser = context.currentUser;

  if (!currentUser) {
    return badRequest({ errors: "User not authenticated" });
  }

  try {
    const body = await request.json();
    const validation = generateLetterSchema.safeParse(body);

    if (!validation.success) {
      const message = getMessage(validation.error);
      return badRequest({ errors: message });
    }

    const generatedLetter = await generateDisputeLetter(validation.data);
    return NextResponse.json(generatedLetter, { status: 200 });
  } catch (error: any) {
    console.error("Failed to generate dispute letter:", error);
    return internalServerError(
      error.message || "Failed to generate dispute letter"
    );
  }
});
