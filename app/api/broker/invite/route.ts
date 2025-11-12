import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { createBrokerInvitation } from "@/service/broker";
import { sendBrokerInvitationEmail } from "@/lib/nodemailer";
import { getCurrentUser, getUserById } from "@/service/user";

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return badRequest({
        message: "Email is required",
        errors: ["Email field is required"],
      });
    }

    // const currentUser = await getUserById(userId);
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "Admin") {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    // Create invitation
    const token = await createBrokerInvitation(
      email,
      currentUser.uid,
      `${currentUser.name}`
    );

    // Send invitation email
    const registrationUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/broker-registration?token=${token}`;

    await sendBrokerInvitationEmail(
      email,
      registrationUrl,
      `${currentUser.name}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Broker invitation sent successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error sending broker invitation:", error);
    return internalServerError(error.message || "Failed to send invitation");
  }
});
