"use server";
import nodemailer from "nodemailer";

import AppError from "@/error/AppError";

export const getTransporter = async () => {
  return nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || "",
      pass: process.env.EMAIL_PASSWORD || "",
    },
    requireTLS: true,
  });
};

type MailOptions = {
  emailTo: string;
  subject: string;
  bodyHTML: string;
  cc?: string[];
};

export const sendMail = async ({
  emailTo,
  subject,
  bodyHTML,
  cc,
}: MailOptions) => {
  const transporter = await getTransporter();

  if (transporter === null) {
    throw new AppError("No transporter found");
  }

  const info = await transporter.sendMail({
    from: "CEG United LLC <noreply@cegunited.com>",
    to: emailTo,
    subject,
    html: bodyHTML,
    cc,
  });
  console.log("Message sent: %s", info.messageId);
  return info.messageId;
};

export const sendBrokerInvitationEmail = async (
  email: string,
  registrationUrl: string,
  invitedByName: string
) => {
  const bodyHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Broker Invitation - CEG United LLC</title>
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
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px;">Join CEG United LLC as a Broker</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                <strong>${invitedByName}</strong> has invited you to join CEG United LLC's broker program. As a broker, you'll be able to submit funding applications on behalf of your clients and earn commissions on approved deals.
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #0179FE; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; color: #0179FE; font-size: 18px;">Your Benefits:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
                  <li>Submit applications on behalf of clients</li>
                  <li>Track application status in real-time</li>
                  <li>View your funded deals and earnings</li>
                  <li>Manage your client portfolio</li>
                </ul>
              </div>
              
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Click the button below to complete your registration. This invitation will expire in <strong>7 days</strong>.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${registrationUrl}" style="display: inline-block; background-color: #0179FE; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Complete Registration
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

  return await sendMail({
    emailTo: email,
    subject: "You're Invited to Join CEG United LLC as a Broker",
    bodyHTML,
  });
};
