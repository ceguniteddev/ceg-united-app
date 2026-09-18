import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import {
  getTradelinePricing,
  TradelinePricingError,
} from "@/lib/tradeline-pricing";

export const GET = withAuth(async () => {
  try {
    return NextResponse.json(await getTradelinePricing(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof TradelinePricingError
            ? error.message
            : "Unable to load tradeline pricing. Please try again.",
      },
      {
        status: error instanceof TradelinePricingError ? error.status : 502,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
});
