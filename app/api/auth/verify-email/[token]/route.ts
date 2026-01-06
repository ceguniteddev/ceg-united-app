import { badRequest, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { verifyEmailToken } from "@/service/email-verification";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    console.log(token);
    if (!token) {
      return badRequest({ errors: "Verification token is required" });
    }

    const result = await verifyEmailToken(token);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return badRequest({ errors: error.message });
    }
    console.error("Error in verify-email API:", error);
    return internalServerError();
  }
}
