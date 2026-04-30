import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import AppError from "@/error/AppError";
import { saveBusinessIncomeComputation } from "@/service/apply-funding";

export const POST = withAuth(
  async (
    req: NextRequest,
    {
      params,
    }: { params?: Promise<{ userId: string; referenceNumber: string }> },
  ) => {
    const resolvedParams = await params;
    const userId = resolvedParams?.userId;
    const referenceNumber = resolvedParams?.referenceNumber;

    if (!userId) {
      return badRequest({ errors: "Missing User ID" });
    }

    if (!referenceNumber) {
      return badRequest({ errors: "Missing Reference Number" });
    }

    try {
      const body = await req.json();

      await saveBusinessIncomeComputation(referenceNumber, userId, body);

      return NextResponse.json(
        { message: "Business income computation saved successfully" },
        { status: 200 },
      );
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest({ errors: err.message });
      }
      console.error("err", err);
      return internalServerError();
    }
  },
);
