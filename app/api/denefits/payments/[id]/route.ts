import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { updateDenefitsContractUserId } from "@/service/denefits";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateUserIdSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const PATCH = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;

    if (!id) {
      return badRequest({ errors: "Contract ID is required" });
    }

    const requestBody = await request.json();

    const query = UpdateUserIdSchema.safeParse(requestBody);
    if (!query.success) {
      const message = getMessage(query.error);
      return badRequest({ errors: message });
    }

    try {
      const result = await updateDenefitsContractUserId({
        contractId: id,
        userId: query.data.userId,
      });
      return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
      console.error("Unexpected error:", error);
      return internalServerError();
    }
  }
);
