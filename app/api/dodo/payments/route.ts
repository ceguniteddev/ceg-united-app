import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { getDodoPayments } from "@/service/dodo";

export const GET = withAuth(async () =>
  NextResponse.json(await getDodoPayments()),
);
