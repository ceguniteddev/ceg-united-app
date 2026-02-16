import { badRequest, internalServerError, notAllowed } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { createEnterpriseAssessment } from "@/lib/captcha/captcha";
import { User } from "@/schema/registration";
import { consumeClientInvitationToken, registerUser, verifyClientInvitationToken } from "@/service/user";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  if (req.method !== "POST") {
    return notAllowed();
  }

  const body = await req.json();
  const { token, step1Data, step2Data, values, invitationToken, invitationType } = body;

  try {
    if (!token) {
      return badRequest({ errors: "Missing token" });
    }

    // Support both old format (values) and new format (step1Data, step2Data)
    if (!step1Data && !values) {
      return badRequest({ errors: "Missing registration data" });
    }

    await createEnterpriseAssessment(token, "registration");

    let brokerId: string | undefined;
    let brokerName: string | undefined;
    let invitationId: string | undefined;

    // Handle Client Invitation
    if (invitationToken && invitationType === "client") {
      try {
        const invitation = await verifyClientInvitationToken(invitationToken);
        brokerId = invitation.brokerId;
        brokerName = invitation.brokerName;
        invitationId = invitation.id;
      } catch (error: any) {
        return badRequest({ errors: error.message });
      }
    }

    // If step1Data and step2Data are provided, use the multi-step registration
    if (step1Data && step2Data) {
      await registerUser({
        user: {
          ...step1Data,
          role: "Client",
          consentConfirmTerms: step2Data.consentConfirmTerms,
          consentConfirmPrivacy: step2Data.consentConfirmPrivacy,
        } as User,
        fundingData: step2Data,
        registrationType: "Self",
        brokerId,
        brokerName,
        isBrokerInvite: !!invitationId,
      });
    } else {
      // Fallback to old single-step registration
      await registerUser({ 
        user: values, 
        registrationType: "Self",
        brokerId,
        brokerName,
        isBrokerInvite: !!invitationId,
      });
    }

    // Mark invitation as accepted if successful
    if (invitationId) {
      await consumeClientInvitationToken(invitationId);
    }

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
