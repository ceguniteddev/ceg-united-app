import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { purchaseTradeline } from "@/service/tradelines";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { currency } from "@/lib/utils";

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
  ) => {
    try {
      const { userId } = (await params) ?? {};
      if (!userId) {
        return badRequest({ errors: "Missing user ID" });
      }

      const body = await req.json();
      const { items, totalPrice, planId, receiptId, checkoutId } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return badRequest({ errors: "Cart items are required" });
      }

      // Record each item as a separate purchase
      const purchasePromises = items.map((item: any) => {
        const itemTotal = item.tradeline.price * item.quantity;

        return purchaseTradeline(userId, {
          bank_name: item.tradeline.bankName,
          card_id: item.tradeline.cardId,
          credit_limit: currency(item.tradeline.creditLimit),
          credit_limit_original: item.tradeline.creditLimit,
          date_opened: item.tradeline.dateOpened,
          purchase_by_date: item.tradeline.purchaseByDate,
          reporting_date: item.tradeline.reportingDate,
          quantity: item.quantity,
          price: currency(item.tradeline.price),
          itemTotal: currency(itemTotal),
          grandTotal: currency(totalPrice),
          image: item.tradeline.image || "",
          status: "pending",
          // Dodo payment details
          dodo_plan_id: planId,
          dodo_receipt_id: receiptId,
          dodo_checkout_id: checkoutId,
        });
      });

      await Promise.all(purchasePromises);

      return NextResponse.json({
        success: true,
        message: "Purchase recorded successfully",
        itemCount: items.length,
      });
    } catch (error: any) {
      console.error("Error recording tradeline purchase:", error);
      return internalServerError(error.message || "Failed to record purchase");
    }
  },
);
