import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { removeBankProductFromMapping } from "@/service/bank-products";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const requestBodySchema = z
  .object({
    referenceNumber: z
      .string({
        error: "Reference number is required",
      })
      .min(1, { error: "Required" }),
    bankProductId: z
      .string({
        error: "Bank product ID is required",
      })
      .min(1, { error: "Required" }),
  })
  .strict();

export const DELETE = withAuth(async (req: NextRequest) => {
  const body = await req.json();

  // safeparse
  const parsedBody = requestBodySchema.safeParse(body);

  if (!parsedBody.success) {
    const message = getMessage(parsedBody.error);

    return badRequest({ errors: message });
  }
  try {
    const { referenceNumber, bankProductId } = parsedBody.data;

    await removeBankProductFromMapping(referenceNumber, bankProductId);

    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (err) {
    if (err instanceof AppError) {
      return badRequest({ errors: err.message });
    }
    console.log("err", err);
    return internalServerError();
  }
});
