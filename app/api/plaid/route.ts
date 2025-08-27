import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "../helpers";
import z from "zod";
import { getMessage } from "@/schema";
import { getPlaidCompleteData } from "@/service/plaid";

const querySchema = z
  .object({
    userId: z.string({
      error: "User ID is required",
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
    const { userId } = query.data;
    const data = await getPlaidCompleteData(userId);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return internalServerError();
  }
});
