import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { unmapWhopPayment } from "@/service/whop";
import { badRequest, internalServerError } from "@/app/api/helpers";

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const { docId } = await request.json();

    if (!docId) {
      return badRequest({
        message: "Payment ID is required.",
        errors: "Payment ID is required.",
      });
    }

    await unmapWhopPayment({ docId });
    return NextResponse.json({ message: "Unmapping successful" });
  } catch (error) {
    return internalServerError(
      "An error occurred while unmapping the payment.",
    );
  }
});
