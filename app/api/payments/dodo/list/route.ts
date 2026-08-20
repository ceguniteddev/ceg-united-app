import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { getDodoPayments } from "@/service/dodo";
import { internalServerError } from "@/app/api/helpers";

export const GET = withAuth(async () => {
  try {
    return NextResponse.json(await getDodoPayments());
  } catch {
    return internalServerError(
      "An error occurred while fetching Dodo payments.",
    );
  }
});
