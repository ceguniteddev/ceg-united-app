import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { badRequest, handleApiError, forbidden } from "@/app/api/helpers";
import { createAdminInvitation } from "@/service/admin-invite";
import { getCurrentUser, getUserById } from "@/service/user";
import { sendTriggerEmail } from "@/service/trigger-email";
import { EmailJobs } from "@/schema/trigger-email";

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

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "Admin") {
      return forbidden("Unauthorized. Admin access required.");
    }

    const adminUser = await getUserById(currentUser.uid);
    const adminName = adminUser
      ? `${adminUser.firstName} ${adminUser.lastName}`
      : (currentUser.name ?? "Admin");

    // Create invitation
    const { token } = await createAdminInvitation(
      email,
      currentUser.uid,
      adminName,
    );

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const registrationUrl = `${appUrl}/admin-registration?token=${token}`;

    const bodyHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Invitation - CEG United LLC</title>
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
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px;">Join CEG United LLC as an Administrator</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>${adminName}</strong> has invited you to join CEG United LLC as an Administrator. In this role, you will be able to manage clients, brokers, funding applications, and access configuration settings.
              </p>
              
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Click the button below to complete your registration and set up your admin account. This invitation will expire in <strong>7 days</strong>.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${registrationUrl}" style="display: inline-block; background-color: #0179FE; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Complete Admin Registration
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
        subject: "You're Invited to Join CEG United LLC as an Administrator",
        html: bodyHTML,
      },
      job: EmailJobs.ADMIN_INVITATION,
    });

    return NextResponse.json(
      {
        success: true,
        token,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return handleApiError(error, "Error creating admin invitation");
  }
});
