import { NextRequest, NextResponse } from "next/server";
import { getBrokerInvitationByToken } from "@/service/broker";

export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    const invitation = await getBrokerInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { message: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      email: invitation.email,
      //   commissionRate: invitation.commissionRate,
      invitedBy: invitation.invitedBy,
      invitedByName: invitation.invitedByName,
    });
  } catch (error: any) {
    console.error("Error validating token:", error);
    return NextResponse.json(
      { message: error.message || "Failed to validate token" },
      { status: 500 }
    );
  }
};
