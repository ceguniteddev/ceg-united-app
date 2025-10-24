import { badRequest, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { getBusinessById } from "@/service/business";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string; businessId: string }> }
  ) => {
    const { userId, businessId } = (await params) ?? {};
    if (!userId) {
      return NextResponse.json({ error: "Missing User ID" }, { status: 400 });
    }
    if (!businessId) {
      return NextResponse.json({ error: "Missing Business ID" }, { status: 400 });
    }
    // safeparse
    try {
      const data = await getBusinessById(businessId);

      return NextResponse.json(data, { status: 200 });
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest(err.message);
      }
      console.log(err);
      return internalServerError();
    }
  }
);
