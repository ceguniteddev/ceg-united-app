import { withAuth } from "@/lib/api-validation";
import { recordFundMappingAnalysis } from "@/service/bank-products";
import { badRequest, internalServerError, notFound } from "@/app/api/helpers";
import { NextResponse } from "next/server";
import { mapBankProductsN8n } from "@/lib/n8n";

export const POST = withAuth(async (req, context) => {
  try {
    const body = await req.json();
    const { referenceNumber, userId } = body;

    if (!referenceNumber) {
      return badRequest({ errors: "Reference number is required" });
    }

    if (!userId) {
      return badRequest({ errors: "User ID is required" });
    }

    // Call the AI service to get bank product recommendations
    const aiResponse = await fetch(
      `${process.env.n8n_HOST}/${await mapBankProductsN8n()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
        },
        body: JSON.stringify({
          referenceNumber,
          userId,
        }),
      }
    );

    if (!aiResponse.ok) {
      return notFound("Failed to get AI recommendations for bank products");
    }

    const aiData = await aiResponse.json();
    const bankProductIds = aiData?.ids || [];

    if (!bankProductIds || bankProductIds.length === 0) {
      return badRequest({
        errors: "No bank product IDs received from AI service",
      });
    }

    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (error: any) {
    console.error("Error refreshing bank products:", error);
    return internalServerError(
      error.message || "Failed to refresh bank products"
    );
  }
});
