import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import z from "zod";
import { getMessage } from "@/schema";
import { getApplyFundingByReferenceNumber } from "@/service/apply-funding";

const querySchema = z
  .object({
    referenceNumber: z.string({
      error: "Reference number is required",
    }),
  })
  .strict();

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!query.success) {
    const message = getMessage(query.error);
    return badRequest(message);
  }

  try {
    const { referenceNumber } = query.data;
    const data = await getApplyFundingByReferenceNumber(referenceNumber);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return internalServerError();
  }
});
