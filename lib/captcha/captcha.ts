"use server";
import AppError from "@/error/AppError";

export async function verifyCaptchaToken(token: string) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    throw new AppError("No secret key found");
  }

  const url = new URL("https://www.google.com/recaptcha/api/siteverify");
  url.searchParams.append("secret", secretKey);
  url.searchParams.append("response", token);

  const res = await fetch(url, { method: "POST" });
  const captchaData: CaptchaData = await res.json();

  if (!res.ok) return null;
  return captchaData;
}

type CaptchaData =
  | {
      success: true;
      challenge_ts: string;
      hostname: string;
      score: number;
      action: string;
    }
  | {
      success: false;
      "error-codes": ErrorCodes[];
    };

type ErrorCodes =
  | "missing-input-secret"
  | "invalid-input-secret"
  | "missing-input-response"
  | "invalid-input-response"
  | "bad-request"
  | "timeout-or-duplicate";
