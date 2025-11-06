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
