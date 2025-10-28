import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { internalServerError } from "@/app/api/helpers";
import { getAdminStatistics } from "@/service/statistics";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const data = (await getAdminStatistics()) as AdminStatistics;
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return internalServerError();
  }
});
