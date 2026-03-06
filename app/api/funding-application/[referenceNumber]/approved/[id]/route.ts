import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { getApprovedMappedFund } from "@/service/bank-products";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(
  async (
    _req: NextRequest,
    {
      params,
    }: { params?: Promise<{ referenceNumber: string; id: string }> },
  ) => {
    const { referenceNumber, id } = (await params) ?? {};

    if (!referenceNumber || !id) {
      return badRequest({ errors: "Missing referenceNumber or id" });
    }

    try {
      const result = await getApprovedMappedFund({
        referenceNumber,
        fundMappingApprovedId: id,
      });

      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
      console.error("Unexpected error:", error);
      return internalServerError();
    }
  },
);
