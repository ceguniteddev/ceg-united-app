import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import {
  getSpecialDealById,
  updateSpecialDeal,
  deleteSpecialDeal,
  toggleSpecialDealActive,
} from "@/service/special-deals";
import { SpecialDealFormSchema } from "@/schema/special-deals";
import { badRequest, internalServerError } from "@/app/api/helpers";

// GET - Fetch single special deal
export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ dealId: string }> },
  ) => {
    try {
      const { dealId } = (await params) ?? {};
      if (!dealId) {
        return badRequest({ errors: "Missing deal ID" });
      }

      const deal = await getSpecialDealById(dealId);
      if (!deal) {
        return NextResponse.json(
          { message: "Deal not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(deal);
    } catch (error: any) {
      console.error("Error fetching special deal:", error);
      return internalServerError(
        error.message || "Failed to fetch special deal",
      );
    }
  },
);

// PUT - Update special deal (admin only)
export const PUT = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ dealId: string }> },
  ) => {
    try {
      const { dealId } = (await params) ?? {};
      if (!dealId) {
        return badRequest({ errors: "Missing deal ID" });
      }

      const body = await req.json();

      // Handle toggle active action
      if (body.action === "toggleActive") {
        await toggleSpecialDealActive(dealId, body.isActive);
        return NextResponse.json({ success: true });
      }

      // Validate request body for full update
      const validation = SpecialDealFormSchema.safeParse(body);
      if (!validation.success) {
        return badRequest({ errors: validation.error.issues });
      }

      const data = validation.data;

      // Calculate sale price
      const salePrice = data.originalPrice * (1 - data.discountPercent / 100);

      // Convert expiresAt to Date
      const expiresAt = new Date(data.expiresAt);

      // Update deal
      await updateSpecialDeal(dealId, {
        ...data,
        salePrice,
        expiresAt: expiresAt.toISOString(),
      });

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Error updating special deal:", error);
      return internalServerError(
        error.message || "Failed to update special deal",
      );
    }
  },
);

// DELETE - Delete special deal (admin only)
export const DELETE = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ dealId: string }> },
  ) => {
    try {
      const { dealId } = (await params) ?? {};
      if (!dealId) {
        return badRequest({ errors: "Missing deal ID" });
      }

      await deleteSpecialDeal(dealId);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting special deal:", error);
      return internalServerError(
        error.message || "Failed to delete special deal",
      );
    }
  },
);
