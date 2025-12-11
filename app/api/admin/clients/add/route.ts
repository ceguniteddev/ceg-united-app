import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";

import { registrationSchema, User } from "@/schema/registration";
import { registerUser } from "@/service/user";
import AppError from "@/error/AppError";

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    // Validate request body - exclude password since admin is creating client
    const validatedData = registrationSchema
      .omit({ password: true, employmentPayPerMonth: true })
      .safeParse(body);

    if (!validatedData.success) {
      const message = getMessage(validatedData.error);
      return badRequest({ errors: message });
    }

    const { data } = validatedData;

    const user: User = {
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      email: data.email,
      password: data.email, // Temporary password is email
      birthdate: data.birthdate,
      gender: data.gender,
      phoneNumber: data.phoneNumber,
      ssn: data.ssn,
      role: "Client",
      isOnboarded: false,
      activeStatus: "Active",
      denefitsSignedUp: false,
      isBrokerInvite: false,

      addressStreet: data.addressStreet,
      houseNumber: data.houseNumber,
      addressCity: data.addressCity,
      addressState: data.addressState,
      addressPostal: data.addressPostal,

      employmentPayPerMonth: 0,
    };

    await registerUser({
      value: user,
      isBrokerRegistration: false,
      isAdminRegistration: true,
    });

    return NextResponse.json("Client registered successfully", {
      status: 200,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return badRequest({ errors: error.message });
    }
    console.error("Error submitting admin application:", error);
    return internalServerError("Failed to submit application");
  }
});
