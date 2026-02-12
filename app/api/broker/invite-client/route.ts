import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { inviteClientSchema } from "@/schema/invite-client";
import { generateClientInvitation, getCurrentUser } from "@/service/user";
import { sendClientInvitationEmail } from "@/lib/nodemailer";

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate request body
    const validation = inviteClientSchema.safeParse(body);
    if (!validation.success) {
      return badRequest({ errors: validation.error.issues[0].message });
    }

    const { email } = validation.data;

    // Get broker info from authenticated user
    const user = await getCurrentUser();
    if (!user || user.role !== "Broker") {
      return NextResponse.json(
        { message: "Unauthorized. Broker access required." },
        { status: 403 },
      );
    }

    const brokerId = user.uid;
    const brokerName = user.name || "";

    // Generate invitation
    const invitation = await generateClientInvitation({
      email,
      brokerId,
      brokerName,
    });

    // Create registration URL with token
    const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register?token=${invitation.token}&type=client`;

    // Send invitation email
    await sendClientInvitationEmail(email, registrationUrl, brokerName);

    return NextResponse.json(
      {
        message: "Invitation sent successfully!",
        email: invitation.email,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error sending client invitation:", error);

    if (
      error.message === "A user with this email already exists." ||
      error.message === "An invitation has already been sent to this email."
    ) {
      return badRequest({ errors: error.message });
    }

    return internalServerError();
  }
});
