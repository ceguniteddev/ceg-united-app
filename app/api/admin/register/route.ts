import { NextRequest, NextResponse } from "next/server";
import { badRequest, handleApiError } from "@/app/api/helpers";
import {
  acceptAdminInvitation,
  getAdminInvitationByToken,
} from "@/service/admin-invite";
import { registerUser } from "@/service/user";
import { User } from "@/schema/registration";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, phoneNumber, token } = body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !phoneNumber ||
      !token
    ) {
      return badRequest({
        message: "Missing required fields",
        errors: [
          "firstName, lastName, email, password, phoneNumber, and token are required",
        ],
      });
    }

    // Validate token first
    const invite = await getAdminInvitationByToken(token);
    if (!invite) {
      return badRequest({
        message: "Invalid or expired invitation token",
        errors: ["The invitation token provided is invalid or has expired"],
      });
    }

    // Ensure the email matches the invitation email (case-insensitive)
    if (invite.email.toLowerCase() !== email.trim().toLowerCase()) {
      return badRequest({
        message: "Email mismatch",
        errors: ["The email address must match the invitation email"],
      });
    }

    const user: User = {
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      password,
      phoneNumber,
      ssn: "", // Dummy SSN for Admin role
      role: "Admin",
      isOnboarded: true, // Admin is auto-onboarded
      activeStatus: "Active",
      denefitsSignedUp: false,
      consentConfirmTerms: true,
      consentConfirmPrivacy: true,
    };

    // Create user in Firestore and Auth
    await registerUser({ user, registrationType: "Admin" });

    // Mark invitation as accepted
    await acceptAdminInvitation(token);

    return NextResponse.json(
      {
        success: true,
        message: "Admin registered successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    return handleApiError(error, "Error registering admin");
  }
};
