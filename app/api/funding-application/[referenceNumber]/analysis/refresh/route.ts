import { badRequest, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { refreshAnalysis } from "@/service/analysis";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ referenceNumber: string }> }
  ) => {
    const { referenceNumber } = (await params) ?? {};
    if (!referenceNumber) {
      return badRequest({ errors: "Missing reference number" });
    }

    try {
      await refreshAnalysis(referenceNumber);

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
