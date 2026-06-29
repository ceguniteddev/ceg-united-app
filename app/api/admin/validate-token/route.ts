import { NextRequest, NextResponse } from "next/server";
import { getAdminInvitationByToken } from "@/service/admin-invite";
import { badRequest, handleApiError } from "@/app/api/helpers";

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return badRequest({
        message: "Token is required",
        errors: ["Token search parameter is required"],
      });
    }

    const invite = await getAdminInvitationByToken(token);

    if (!invite) {
      return NextResponse.json(
        { valid: false, error: "Invalid or expired token" },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        valid: true,
        email: invite.email,
        invitedByName: invite.invitedByName || null,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return handleApiError(error, "Error validating admin invitation token");
  }
};
