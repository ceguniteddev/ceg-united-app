import nodemailer from "nodemailer";
import { google } from "googleapis";

import AppError from "@/error/AppError";
import { formatPrivateKey } from "./fireabase-admin";

// const jwtClient = new google.auth.JWT(
//   {
//     email: process.env.FIREBASE_CLIENT_EMAIL,
//     key: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY ?? ""),
//     scopes: ["https://www.googleapis.com/auth/gmail.send"],

//     process.env.FIREBASE_CLIENT_EMAIL,
//   undefined,
//   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//   ["https://mail.google.com/"],
//   "your-user@yourdomain.com" // delegated user
//   }
// );

// await jwtClient.authorize();

// const accessToken = await jwtClient.getAccessToken();

export const getTransporter = async (email: string) => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: email,
      serviceClient: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY ?? ""),
    },
  });
};

export const sendMail = async (
  emailFrom: string,
  emailTo: string,
  subject: string,
  bodyHTML: string
) => {
  const transporter = await getTransporter(emailFrom);

  if (transporter === null) {
    throw new AppError("No transporter found");
  }

  const info = await transporter.sendMail({
    from: emailFrom,
    to: emailTo,
    subject,
    html: bodyHTML,
  });
  return info.messageId;
};
