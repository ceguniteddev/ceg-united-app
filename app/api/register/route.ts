import { NextResponse } from "next/server";
import { authSchema } from "@/schema/new-registration";
import { registerUser } from "@/service/user";
import { User } from "@/schema/registration";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.auth) {
      return NextResponse.json(
        { error: "Incomplete registration data" },
        { status: 400 },
      );
    }

    // Validate the auth payload
    const parsedAuth = authSchema.parse(body.auth);

    // Call service to register the user
    await registerUser({
      user: {
        ...parsedAuth,
        role: "Client",
        consentConfirmTerms: true,
        consentConfirmPrivacy: true,
      } as User,
      registrationType: "Self",
    });

    return NextResponse.json(
      { success: true, message: "Registration successful" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("New Registration API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process registration" },
      { status: 500 },
    );
  }
}
