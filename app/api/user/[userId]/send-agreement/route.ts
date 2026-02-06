import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { sendClientServiceAgreement } from "@/service/n8n";

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string }> },
  ) => {
    try {
      const { userId } = (await params) ?? {};

      if (!userId) {
        return badRequest({ errors: "Missing User ID" });
      }

      await sendClientServiceAgreement({ userId });
      return NextResponse.json({ message: "Agreement sent successfully" });
    } catch (error) {
      console.error("Error sending client service agreement:", error);
      return internalServerError();
    }
  },
);
