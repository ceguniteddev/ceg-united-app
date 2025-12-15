import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";

import { registrationSchema, User } from "@/schema/registration";
import { getUserById, registerUser } from "@/service/user";
import AppError from "@/error/AppError";
import { linkClientToBroker } from "@/service/broker";

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ brokerId: string }> }
  ) => {
    try {
      const brokerId = (await params)?.brokerId;
      if (!brokerId) {
        return badRequest({ errors: "Broker ID is required" });
      }
      const body = await req.json();
      // Validate request body - exclude password since broker is creating client
      const validatedData = registrationSchema
        .omit({ password: true })
        .safeParse(body);

      if (!validatedData.success) {
        const message = getMessage(validatedData.error);
        return badRequest({ errors: message });
      }

      const brokerData = await getUserById(brokerId);

      const { data } = validatedData;

      const user: User = {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        email: data.email,
        password: data.email,
        birthdate: data.birthdate,
        gender: data.gender,
        phoneNumber: data.phoneNumber,
        ssn: data.ssn,
        role: "Client",
        isOnboarded: false,
        activeStatus: "Active",
        denefitsSignedUp: false,
        isBrokerInvite: true,

        addressStreet: data.addressStreet,
        houseNumber: data.houseNumber,
        addressCity: data.addressCity,
        addressState: data.addressState,
        addressPostal: data.addressPostal,

        employmentPayPerMonth: data.employmentPayPerMonth,
        payPerMonth: data.payPerMonth,
      };

      const clientData = await registerUser({
        value: user,
        isBrokerRegistration: true,
        brokerName: `${brokerData?.firstName} ${brokerData?.lastName}`,
      });

      await linkClientToBroker({
        brokerId,
        createdBy: "Broker",
        clientEmail: data.email,
        clientId: clientData.id,
        clientName: `${data.firstName} ${data.lastName}`,
      });

      return NextResponse.json("Client registered successfully", {
        status: 200,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return badRequest({ errors: error.message });
      }
      console.error("Error submitting broker application:", error);
      return internalServerError("Failed to submit application");
    }
  }
);
