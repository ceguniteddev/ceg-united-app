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
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false,
    },
  });
};

export const sendMail = async (emailTo: string, subject: string, bodyHTML: string) => {
  const transporter = await getTransporter();

  if (transporter === null) {
    throw new AppError("No transporter found");
  }

  const info = await transporter.sendMail({
    from: "CEG United LLC <noreply@cegunited.com>",
    to: emailTo,
    subject,
    html: bodyHTML,
  });
  return info.messageId;
};
