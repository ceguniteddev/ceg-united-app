import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError, notFound } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { brokerageSchema } from "@/schema/brokerage";
import { createBrokerage, getBrokerages } from "@/service/brokerage";

export const GET = withAuth(async () => {
  try {
    const data = await getBrokerages();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching brokerages:", error);
    return internalServerError();
  }
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const result = brokerageSchema.safeParse(body);

    if (!result.success) {
      return badRequest({ errors: result.error.flatten() });
    }

    const id = await createBrokerage(result.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Error creating brokerage:", error);
    return internalServerError();
  }
});
