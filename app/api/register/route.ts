import { NextResponse } from "next/server";
import {
  authSchema,
  businessDetailsSchema,
  fundingPageSchema,
} from "@/schema/new-registration";
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

    // Validate payloads
    const parsedAuth = authSchema.parse(body.auth);
    let parsedBusiness = null;
    if (body.business) {
      parsedBusiness = businessDetailsSchema.parse(body.business);
    }
    let parsedFunding = null;
    if (body.funding) {
      parsedFunding = fundingPageSchema.parse(body.funding);
    }

    // Call service to register the user
    await registerUser({
      user: {
        ...parsedAuth,
        role: "Client",
        consentConfirmTerms: true,
        consentConfirmPrivacy: true,
        businessDetails: parsedBusiness,
        fundingDetails: parsedFunding,
      } as any as User,
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
