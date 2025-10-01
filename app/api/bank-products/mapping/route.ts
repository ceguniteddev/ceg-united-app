import { badRequest, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { getMessage } from "@/schema";
import { recordFundMappingAnalysis } from "@/service/bank-products";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const requestBodySchema = z
  .object({
    ids: z.array(z.object({ id: z.string() })),
    // referenceNumber: z
    //   .string({
    //     error: "Reference number is required",
    //   })
    //   .min(1, { error: "Required" }),
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
    const { ids, userId } = parsedBody.data;

    await recordFundMappingAnalysis(userId, ids);

    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (err) {
    if (err instanceof AppError) {
      return badRequest(err.message);
    }
    console.log(err);
    return internalServerError();
  }
});
