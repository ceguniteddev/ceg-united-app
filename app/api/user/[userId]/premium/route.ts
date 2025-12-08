import { badRequest, getMessage } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { updateUserPremiumStatus } from "@/service/user";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const querySchema = z.object({
  isPremium: z.boolean(),
});

export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ userId: string }> }
  ) => {
    const requestBody = await request.json();

    const query = querySchema.safeParse(requestBody);
    if (!query.success) {
      const message = getMessage(query.error);
      return badRequest({ errors: message });
    }

    try {
      const { userId } = (await params) ?? {};
      if (!userId) {
        return badRequest({ errors: "Missing User ID" });
      }

      const { isPremium } = query.data;

      await updateUserPremiumStatus({ id: userId, isPremium });

      return NextResponse.json(
        { message: "Premium status updated successfully" },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("POST /api/user/[userId]/premium Error:", error);
      return badRequest({ errors: error.message });
    }
  }
);
