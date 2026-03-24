import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { getBusinessById } from "@/service/business";
import { getCRSBusinessProfile, getCRSBusinessScore } from "@/service/crs";
import { badRequest, internalServerError, notFound } from "@/app/api/helpers";

export const GET = withAuth(
  async (
    request: NextRequest,
    // { params }: { params: { businessId: string } },
    { params }: { params?: Promise<{ businessId: string }> },
  ) => {
    try {
      const { businessId } = (await params) ?? {};
      if (!businessId) {
        return badRequest({ errors: ["Missing businessId parameter"] });
      }

      // Fetch business details
      const business = await getBusinessById(businessId);

      if (!business) {
        return notFound("Business not found");
      }

      // Fetch CRS data (optional - may not exist)
      const [crsBusinessProfile, crsBusinessScore] = await Promise.all([
        getCRSBusinessProfile(businessId).catch(() => null),
        getCRSBusinessScore(businessId).catch(() => null),
      ]);

      //   console.log("Fetched business details with CRS data:", {
      //     business,
      //     crsBusinessProfile: JSON.stringify(crsBusinessProfile),
      //     crsBusinessScore,
      //   });

      // Return combined data
      return NextResponse.json({
        ...business,
        crsBusinessProfile,
        crsBusinessScore,
      });
    } catch (error) {
      console.error("Error fetching business details:", error);
      return internalServerError("Failed to fetch business details");
    }
  },
);
