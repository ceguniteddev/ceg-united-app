import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { updatePathwayStatus } from "@/service/apply-funding";
import { recordFundMappingAnalysisNoOutput } from "@/service/bank-products";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const requestBodySchema = z
  .object({
    reason: z
      .string({
        error: "Reason is required",
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
    append: z.boolean().optional().default(false),
    selectedPathwayId: z.string(),
  })
  .strict();

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json();

  // safeparse
  const parsedBody = requestBodySchema.safeParse(body);

  if (!parsedBody.success) {
    const message = getMessage(parsedBody.error);

    return badRequest({ errors: message });
  }
  try {
    const { reason, userId, referenceNumber, selectedPathwayId } =
      parsedBody.data;

    await recordFundMappingAnalysisNoOutput({
      userId,
      referenceNumber,
      selectedPathwayId,
      reason,
    });

    await updatePathwayStatus({
      referenceNumber,
      pathwayId: selectedPathwayId,
      status: "Declined",
      noOutputReason: reason,
    });

    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (err) {
    if (err instanceof AppError) {
      return badRequest({ errors: err.message });
    }
    console.log("err", err);
    return internalServerError();
  }
});
