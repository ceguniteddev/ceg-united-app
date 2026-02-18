import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { inviteClientSchema } from "@/schema/invite-client";
import { generateClientInvitation, getCurrentUser } from "@/service/user";
import { sendTriggerEmail } from "@/service/trigger-email";
import { EmailJobs } from "@/schema/trigger-email";

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

const sendClientInvitationEmail = async (
  email: string,
  registrationUrl: string,
  brokerName: string,
) => {
  const bodyHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Client Invitation - CEG United LLC</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0179FE; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">You're Invited!</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px;">Join CEG United LLC</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>${brokerName}</strong> has invited you to join CEG United LLC's platform. You'll gain access to our funding services and financial tools designed to help grow your business.
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #0179FE; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; color: #0179FE; font-size: 18px;">What You'll Get:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
                  <li>Access to funding applications</li>
                  <li>Credit and business reporting tools</li>
                  <li>Document management system</li>
                  <li>Direct support from your broker</li>
                  <li>Educational resources and courses</li>
                </ul>
              </div>
              
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Click the button below to create your account and get started. This invitation will expire in <strong>7 days</strong>.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${registrationUrl}" style="display: inline-block; background-color: #0179FE; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Create Your Account
                </a>
              </div>
              
              <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; word-break: break-all;">
                <a href="${registrationUrl}" style="color: #0179FE; text-decoration: none; font-size: 14px;">${registrationUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                CEG United LLC
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await sendTriggerEmail({
    to: email,
    message: {
      subject: `${brokerName} has invited you to join CEG United LLC`,
      html: bodyHTML,
    },
    job: EmailJobs.CLIENT_INVITATION,
  });
};
