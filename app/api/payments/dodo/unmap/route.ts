import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { unmapDodoPayment } from "@/service/dodo";

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const { docId } = await request.json();
    if (!docId) return badRequest({ errors: "docId is required" });
    await unmapDodoPayment({ docId });
    return NextResponse.json({ message: "Unmapping successful" });
  } catch {
    return internalServerError("Failed to unmap Dodo payment.");
  }
});
