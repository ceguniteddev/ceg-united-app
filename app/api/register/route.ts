import { badRequest, internalServerError, notAllowed } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { createEnterpriseAssessment } from "@/lib/captcha/captcha";
import { registerUser } from "@/service/user";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  if (req.method !== "POST") {
    return notAllowed();
  }

  const body = await req.json();
  const { token, values } = body;

  try {
    if (!token || !values) {
      return badRequest({ errors: "Missing token or values" });
    }

    await createEnterpriseAssessment(token, "registration");

    await registerUser({ value: values });

    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (error: any) {
    if (error instanceof AppError) {
      // This is a controlled, user-facing error from our logic.
      console.warn(`AppError caught: ${error.message}`);
      return badRequest({ errors: error.message });
    }

    console.error("Internal Server Error:", error);
    return internalServerError();
  }
};
