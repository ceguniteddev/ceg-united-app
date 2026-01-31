import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { mapWhopPaymentToUser } from "@/service/whop";
import { badRequest, internalServerError } from "@/app/api/helpers";

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const { docId, userId } = await request.json();

    if (!docId || !userId) {
      return badRequest({
        message: "Payment ID and User ID are required.",
        errors: "Payment ID and User ID are required.",
      });
    }

    await mapWhopPaymentToUser({ docId, userId });
    return NextResponse.json({ message: "Mapping successful" });
  } catch (error) {
    return internalServerError("An error occurred while mapping the payment.");
  }
});
