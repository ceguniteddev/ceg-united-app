import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { DenefitsRequestSchema } from "@/schema/denefits";
import { recordContractCreated } from "@/service/denefits";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(async (request: NextRequest) => {
  const requestBody = await request.json();

  const query = DenefitsRequestSchema.safeParse(requestBody);
  if (!query.success) {
    const message = getMessage(query.error);
    return badRequest({ errors: message });
  }

  try {
    await recordContractCreated({ denefitsRequest: query.data });
    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return internalServerError();
  }
});
