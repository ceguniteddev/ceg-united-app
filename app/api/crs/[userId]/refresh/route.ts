import { badRequest, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { getApplyFunding } from "@/service/apply-funding";
import { refreshCRSData } from "@/service/crs";

import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string }> }
  ) => {
    const { userId } = (await params) ?? {};
    if (!userId) {
      return badRequest({ errors: "Missing userId" });
    }
    try {
      const body = await req.json().catch(() => ({}));
      const { bureaus } = body;

      if (
        !bureaus ||
        (!bureaus.equifax && !bureaus.experian && !bureaus.transunion)
      ) {
        return badRequest({ errors: "At least one bureau must be selected." });
      }

      const appliedFundings = await getApplyFunding(userId);
      let referenceNumber = "";
      if (appliedFundings && appliedFundings.length > 0) {
        referenceNumber = appliedFundings[0].referenceNumber!;
      }

      if (!referenceNumber) {
        return badRequest({ errors: "Missing reference number" });
      }

      await refreshCRSData({ userId, referenceNumber, bureaus });

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
