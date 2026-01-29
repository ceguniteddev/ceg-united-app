import { badRequest, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { markCongratsAsRead } from "@/service/user";
import { NextRequest, NextResponse } from "next/server";

export const PUT = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string; congratsId: string }> },
  ) => {
    const { userId, congratsId } = (await params) ?? {};
    if (!userId) {
      return badRequest({ errors: "User ID is required" });
    }

    if (!congratsId) {
      return badRequest({ errors: "Congrats ID is required" });
    }

    try {
      await markCongratsAsRead({ userId, docId: congratsId });
      return NextResponse.json({ message: "ok" }, { status: 200 });
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest({ errors: err.message });
      }
      console.log("err", err);
      return internalServerError();
    }
  },
);
