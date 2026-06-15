import { badRequest, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { getFundMappingAnalysis } from "@/service/bank-products";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(
  async (
    req: NextRequest,
    {
      params,
    }: {
      params?: Promise<{
        userId: string;
        referenceNumber: string;
        pathwayId: string;
      }>;
    },
  ) => {
    try {
      const { userId, referenceNumber, pathwayId } = (await params) ?? {};

      if (!userId) {
        return badRequest({ errors: "Missing User ID" });
      }

      if (!referenceNumber) {
        return badRequest({ errors: "Missing Reference Number" });
      }

      if (!pathwayId) {
        return badRequest({ errors: "Missing Pathway ID" });
      }

      

      const mappedProducts = await getFundMappingAnalysis(
        referenceNumber,
        pathwayId,
      );

      return NextResponse.json(mappedProducts, { status: 200 });
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest({ errors: err.message });
      }
      console.error("err", err);
      return internalServerError();
    }
  },
);
