import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { recordFundMappingAnalysis } from "@/service/bank-products";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const requestBodySchema = z
  .object({
    ids: z.array(z.object({ id: z.string() })),
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

    return badRequest({ errors: message });
  }
  try {
    const { ids, userId, referenceNumber } = parsedBody.data;

    await recordFundMappingAnalysis(userId, referenceNumber, ids);

    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (err) {
    if (err instanceof AppError) {
      return badRequest({ errors: err.message });
    }
      console.log("err", err);
    return internalServerError();
  }
});
