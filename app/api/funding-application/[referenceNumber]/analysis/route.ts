import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { getAnalysis, recordAnalysis } from "@/service/analysis";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const requestBodySchema = z
  .object({
    analysis: z
      .string({
        error: "Analysis is required",
      })
      .min(1, { error: "Required" }),
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

export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ referenceNumber: string }> }
  ) => {
    const { referenceNumber } = (await params) ?? {};
    if (!referenceNumber) {
      return badRequest({ errors: "Missing reference number" });
    }

    try {
      const analysis = await getAnalysis(referenceNumber);
      return NextResponse.json(analysis, { status: 200 });
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest({ errors: err.message });
      }
      console.log("err", err);
      return internalServerError();
    }
  }
);

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ referenceNumber: string }> }
  ) => {
    const { referenceNumber } = (await params) ?? {};
    if (!referenceNumber) {
      return badRequest({ errors: "Missing reference number" });
    }
    const body = await req.json();

    // safeparse
    const parsedBody = requestBodySchema.safeParse(body);

    if (!parsedBody.success) {
      const message = getMessage(parsedBody.error);
      return badRequest({ errors: message });
    }
    try {
      const { analysis, userId } = parsedBody.data;

      await recordAnalysis(userId, referenceNumber, analysis);

      return NextResponse.json({ message: "ok" }, { status: 200 });
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest({ errors: err.message });
      }
      console.log("err", err);
      return internalServerError();
    }
  }
);
