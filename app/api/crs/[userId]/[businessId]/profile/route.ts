import { badRequest, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { recordCRSBusinessProfile } from "@/service/crs";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string; businessId: string }> }
  ) => {
    const { userId, businessId } = (await params) ?? {};
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }
    const body = await req.json();
    // safeparse
    try {
      await recordCRSBusinessProfile(userId, businessId, body);

      return NextResponse.json({ message: "ok" }, { status: 200 });
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest(err.message);
      }
      console.log(err);
      return internalServerError();
    }
  }
);
