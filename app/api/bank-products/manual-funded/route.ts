import { withAuth } from "@/lib/api-validation";
import { manuallyAddFundedBankProduct } from "@/service/bank-products";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const manualFundedSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  bankProductId: z.string().optional(),
  fundedAmount: z.number().positive("Funded amount must be greater than 0"),
  fundedRemarks: z.string().optional(),
  bankName: z.string().min(1, "Bank name is required"),
  productName: z.string().optional(),
});

export const POST = withAuth(
  async (req: NextRequest, context: { userId: string; role: string }) => {
    try {
      const body = await req.json();
      const validatedData = manualFundedSchema.parse(body);

      const result = await manuallyAddFundedBankProduct({
        ...validatedData,
        bankProductId: validatedData.bankProductId || undefined,
      });

      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "validation",
            message: error.issues[0].message,
          },
          { status: 400 }
        );
      }

      console.error("Error in manual funded API:", error);
      return NextResponse.json(
        {
          success: false,
          error: "error",
          message: "An unexpected error occurred.",
        },
        { status: 500 }
      );
    }
  }
);
