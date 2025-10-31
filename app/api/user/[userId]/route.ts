import { badRequest, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { getUserById } from "@/service/user";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string }> }
  ) => {
    const { userId } = (await params) ?? {};
    if (!userId) {
      return badRequest({ errors: "Missing User ID" });
    }

    try {
      const data = await getUserById(userId);

      return NextResponse.json(data, { status: 200 });
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest({ errors: err.message });
      }
      console.log("err", err);
      return internalServerError();
    }
  }
);
