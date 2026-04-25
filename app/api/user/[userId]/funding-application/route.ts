import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import AppError from "@/error/AppError";
import { getApplyFunding } from "@/service/apply-funding";

export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string }> },
  ) => {
    const { userId } = (await params) ?? {};
    if (!userId) {
      return badRequest({ errors: "Missing User ID" });
    }

    try {
      const data = await getApplyFunding(userId);

      return NextResponse.json(data ?? [], { status: 200 });
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest({ errors: err.message });
      }
      console.error("err", err);
      return internalServerError();
    }
  },
);
