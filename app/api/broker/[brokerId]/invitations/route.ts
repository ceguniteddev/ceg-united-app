import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { getBrokerPendingInvitations } from "@/service/broker";
import { getCurrentUser } from "@/service/user";

export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ brokerId: string }> },
  ) => {
    try {
      const { brokerId } = await params;
      const user = await getCurrentUser();

      if (!user) {
        return badRequest({ errors: "User not authenticated" });
      }

      if (user.uid !== brokerId && !user.admin) {
        return NextResponse.json(
          { message: "Unauthorized access" },
          { status: 403 },
        );
      }

      const invitations = await getBrokerPendingInvitations(brokerId);

      return NextResponse.json(invitations);
    } catch (error: any) {
      console.error("Error fetching broker invitations:", error);
      return internalServerError(error);
    }
  },
);
