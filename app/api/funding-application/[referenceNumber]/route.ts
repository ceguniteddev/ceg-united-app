import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { getApplyFundingByReferenceNumber } from "@/service/apply-funding";
import { getCurrentUser } from "@/service/user";

export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ referenceNumber: string }> },
  ) => {
    const { referenceNumber } = (await params) ?? {};
    if (!referenceNumber) {
      return badRequest({ errors: "Missing reference number" });
    }

    try {
      const currentUser = await getCurrentUser();
      const data = await getApplyFundingByReferenceNumber({ referenceNumber });

      if (!data) {
        return NextResponse.json("Funding application not found", {
          status: 404,
        });
      }

      // If the user is a Client, ensure they own this funding application
      if (currentUser?.role === "Client" && data.userId !== currentUser.uid) {
        return NextResponse.json("Unauthorized: Access denied", {
          status: 403,
        });
      }

      return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
      console.error("Unexpected error:", error);
      return internalServerError();
    }
  },
);
