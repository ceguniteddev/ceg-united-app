import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { getBusinessAuditData } from "@/service/business-audit";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string; businessId: string }> },
  ) => {
    const { userId, businessId } = (await params) ?? {};

    if (!userId || !businessId) {
      return badRequest({
        errors: "Missing userId or businessId",
      });
    }

    try {
      const data = await getBusinessAuditData(userId, businessId);

      return NextResponse.json(data, { status: 200 });
    } catch (err) {
      console.error("Error fetching business audit data:", err);
      return internalServerError();
    }
  },
);
