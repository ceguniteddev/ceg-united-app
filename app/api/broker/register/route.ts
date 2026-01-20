import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { acceptBrokerInvitation } from "@/service/broker";
import { registerUser } from "@/service/user";
import { User } from "@/schema/registration";
import { da } from "date-fns/locale";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      //   userId,
      firstName,
      //   middleName,
      lastName,
      email,
      //   birthdate,
      //   gender,
      password,
      phoneNumber,
      //   ssn,
      companyName,
      //   commissionRate,
      invitedBy,
      invitationToken,
    } = body;

    if (!firstName || !lastName || !email || !phoneNumber || !invitationToken) {
      return badRequest({
        message: "Missing required fields",
        errors: [
          "userId, firstName, lastName, phoneNumber, email, and invitationToken are required",
        ],
      });
    }

    const user: User = {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      birthdate: new Date(),
      gender: "Other",
      ssn: "",
      role: "Broker",
      isOnboarded: false,
      activeStatus: "Active",
      denefitsSignedUp: false,
      commissionRate: 10,
      consentConfirm: true,
      // addressStreet: "",
      // houseNumber: "",
      // addressCity: "",
      // addressState: "",
      // addressPostal: "",

      // employmentPayPerMonth: 0,
    };

    await registerUser({ user, registrationType: "Broker" });

    // Accept the invitation
    await acceptBrokerInvitation(invitationToken);

    return NextResponse.json(
      {
        success: true,
        message: "Broker registered successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error registering broker:", error);
    return internalServerError(error.message || "Failed to register broker");
  }
};
