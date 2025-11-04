import { badRequest, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { getContracts } from "@/service/denefits";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const data = await getContracts();

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    if (err instanceof AppError) {
      return badRequest({ errors: err.message });
    }
    console.log("err", err);
    return internalServerError();
  }
});
