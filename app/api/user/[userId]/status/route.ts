import { badRequest, getMessage } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { UserActiveStatusEnum } from "@/schema/registration";
import { updateUserStatus } from "@/service/user";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const querySchema = z.object({
  status: UserActiveStatusEnum,
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

      const { status } = query.data;

      await updateUserStatus({ id: userId, status });

      return NextResponse.json(
        { message: "Note updated successfully" },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("POST /api/user-notes Error:", error);
      return NextResponse.json(
        { message: error.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  }
);
