import { badRequest, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { getMessage } from "@/schema";
import { recordFundMappingAnalysis } from "@/service/bank-products";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const requestBodySchema = z
  .object({
    analysis: z
      .string({
        error: "Analysis is required",
      })
      .min(1, { error: "Required" }),
    referenceNumber: z
      .string({
        error: "Reference number is required",
      })
      .min(1, { error: "Required" }),
    userId: z
      .string({
        error: "User ID is required",
      })
      .min(1, { error: "Required" }),
  })
  .strict();

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json();

  // safeparse
  const parsedBody = requestBodySchema.safeParse(body);

  if (!parsedBody.success) {
    const message = getMessage(parsedBody.error);
    return badRequest(message);
  }
  try {
    const { analysis, referenceNumber, userId } = parsedBody.data;

    await recordFundMappingAnalysis(userId, referenceNumber, analysis);

    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (err) {
    if (err instanceof AppError) {
      return badRequest(err.message);
    }
    console.log(err);
    return internalServerError();
  }
});
