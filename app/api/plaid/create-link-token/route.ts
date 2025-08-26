import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, ensureJsonContentType, internalServerError } from "../../helpers";
import { getMessage } from "@/schema";
import z from "zod";
import { getPlaidLinkToken } from "@/service/plaid";

const requestSchema = z
  .object({
    id: z.string({
      error: "Unique identifier is required",
    }),
  })
  .strict();

export const POST = withAuth(async (request: NextRequest) => {
  const validationError = ensureJsonContentType(request);
  if (validationError) {
    console.info("Missing or invalid JSON content type");
    return validationError;
  }
  const requestBody = await request.json();
  const result = requestSchema.safeParse(requestBody);
  if (!result.success) {
    const message = getMessage(result.error);
    return badRequest(message);
  }

  try {
    const data = getPlaidLinkToken(result.data.id);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    if (error instanceof Error) {
      return badRequest(error.message);
    }

    console.error("Unexpected error:", error);
    return internalServerError();
  }
});
