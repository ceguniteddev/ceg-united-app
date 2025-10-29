import { withAuth } from "@/lib/api-validation";
import { ClientApplicationStatusEnum } from "@/schema/bank-products";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, getMessage, internalServerError } from "../helpers";
import { getFundMappingAnalysisDetails } from "@/service/bank-products";

const querySchema = z.object({
  userId: z.string().optional(),
  // Your existing Zod schema for the array is correct
  clientApplicationStatus: ClientApplicationStatusEnum.array().optional(),
  referenceNumber: z.string().optional(),
});

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // THIS IS THE CRITICAL FIX: Build the object for Zod manually
  const queryToValidate = {
    userId: searchParams.get("userId") ?? undefined,
    referenceNumber: searchParams.get("referenceNumber") ?? undefined,
    // Use .getAll() to correctly capture all values for the array key
    clientApplicationStatus: searchParams.getAll("clientApplicationStatus"),
  };

  const query = querySchema.safeParse(queryToValidate);

  if (!query.success) {
    // Your error handling is correct
    const message = getMessage(query.error);
    return badRequest({ errors: message });
  }

  // query.data is now correctly typed and validated
  const { userId, clientApplicationStatus, referenceNumber } = query.data;

  try {
    const data = await getFundMappingAnalysisDetails({
      userId,
      clientApplicationStatus,
      referenceNumber,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return internalServerError();
  }
});
