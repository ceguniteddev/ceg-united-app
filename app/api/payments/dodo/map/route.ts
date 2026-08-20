import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { mapDodoPaymentToUser } from "@/service/dodo";

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const { docId, userId } = await request.json();
    if (!docId || !userId)
      return badRequest({ errors: "docId and userId are required" });
    await mapDodoPaymentToUser({ docId, userId });
    return NextResponse.json({ message: "Mapping successful" });
  } catch {
    return internalServerError("Failed to map Dodo payment.");
  }
});
