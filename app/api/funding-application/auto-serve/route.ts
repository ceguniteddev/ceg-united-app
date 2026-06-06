import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, getMessage, internalServerError } from "../../helpers";
import { getAutoServedClientFunds } from "@/service/bank-products";

const querySchema = z.object({
  userId: z.string(),
  referenceNumber: z.string(),
  pathwayId: z.string().optional(),
});

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const queryToValidate = {
    userId: searchParams.get("userId") ?? undefined,
    referenceNumber: searchParams.get("referenceNumber") ?? undefined,
    pathwayId: searchParams.get("pathwayId") ?? undefined,
  };

  const query = querySchema.safeParse(queryToValidate);

  if (!query.success) {
    const message = getMessage(query.error);
    return badRequest({ errors: message });
  }

  const { userId, referenceNumber, pathwayId } = query.data;

  try {
    const data = await getAutoServedClientFunds({
      userId,
      referenceNumber,
      pathwayId,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error in auto-serve:", error);
    return internalServerError();
  }
});
