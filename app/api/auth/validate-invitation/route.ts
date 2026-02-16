import { NextRequest, NextResponse } from "next/server";
import { verifyClientInvitationToken } from "@/service/user";
import AppError from "@/error/AppError";

export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 },
      );
    }

    const invitation = await verifyClientInvitationToken(token);

    return NextResponse.json({
      email: invitation.email,
      brokerName: invitation.brokerName,
      brokerId: invitation.brokerId,
    });
  } catch (error: any) {
    console.error("Error validating token:", error);

    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: error.message || "Failed to validate token" },
      { status: 500 },
    );
  }
};
