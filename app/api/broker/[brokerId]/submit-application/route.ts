import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";

import { registrationSchema, User } from "@/schema/registration";
import { getUserById, registerUser } from "@/service/user";
import AppError from "@/error/AppError";
import { linkClientToBroker } from "@/service/broker";
import { applyFundingSchema, ApplyFunding } from "@/schema/apply-funding";

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
      const { step1Data, step2Data } = body;

      if (!step1Data || !step2Data) {
        return badRequest({
          errors: "Both step1Data and step2Data are required",
        });
      }

      // Validate Step 1 (personal info) - exclude password since broker is creating client
      const validatedStep1 = registrationSchema
        .omit({ password: true })
        .safeParse(step1Data);

      if (!validatedStep1.success) {
        const message = getMessage(validatedStep1.error);
        return badRequest({ errors: message });
      }

      // Validate Step 2 (funding info)
      const validatedStep2 = applyFundingSchema.safeParse(step2Data);

      if (!validatedStep2.success) {
        const message = getMessage(validatedStep2.error);
        return badRequest({ errors: message });
      }

      const brokerData = await getUserById(brokerId);

      const { data } = validatedStep1;
      const fundingData = validatedStep2.data;

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

        // addressStreet: data.addressStreet,
        // houseNumber: data.houseNumber,
        // addressCity: data.addressCity,
        // addressState: data.addressState,
        // addressPostal: data.addressPostal,

        // employmentPayPerMonth: data.employmentPayPerMonth,
        // payPerMonth: data.payPerMonth,
      };

      const clientData = await registerUser({
        value: user,
        isBrokerRegistration: true,
        brokerName: `${brokerData?.firstName} ${brokerData?.lastName}`,
        fundingData,
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
