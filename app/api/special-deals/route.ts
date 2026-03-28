import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import {
  createSpecialDeal,
  getAllSpecialDeals,
  getActiveSpecialDeals,
} from "@/service/special-deals";
import { SpecialDealFormSchema } from "@/schema/special-deals";
import { badRequest, internalServerError } from "@/app/api/helpers";

// GET - Fetch all special deals (admin) or active deals (client)
export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const deals = activeOnly
      ? await getActiveSpecialDeals()
      : await getAllSpecialDeals();

    return NextResponse.json(deals);
  } catch (error: any) {
    console.error("Error fetching special deals:", error);
    return internalServerError(
      error.message || "Failed to fetch special deals",
    );
  }
};

// POST - Create new special deal (admin only)
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();

    // Validate request body
    const validation = SpecialDealFormSchema.safeParse(body);
    if (!validation.success) {
      return badRequest({ errors: validation.error.issues });
    }

    const data = validation.data;

    // Calculate sale price
    const salePrice = data.originalPrice * (1 - data.discountPercent / 100);

    // Convert expiresAt to Date
    const expiresAt = new Date(data.expiresAt);

    // Create deal
    const dealId = await createSpecialDeal({
      ...data,
      salePrice,
      expiresAt: expiresAt.toISOString(),
      isActive: data.isActive ?? true,
    });

    return NextResponse.json({ id: dealId, success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating special deal:", error);
    return internalServerError(
      error.message || "Failed to create special deal",
    );
  }
});
