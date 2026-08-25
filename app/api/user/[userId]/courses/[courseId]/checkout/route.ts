import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { createCourseCheckoutConfig } from "@/service/dodo";
import { badRequest, internalServerError } from "@/app/api/helpers";

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ userId: string; courseId: string }> },
  ) => {
    try {
      const { userId, courseId } = (await params) ?? {};
      if (!userId) {
        return badRequest({ errors: "Missing user ID" });
      }
      if (!courseId) {
        return badRequest({ errors: "Missing course ID" });
      }

      let returnUrl: string | undefined;
      try {
        const body = await req.json();
        returnUrl = body?.returnUrl;
      } catch {
        // Body is optional
      }

      const { checkoutId, url } = await createCourseCheckoutConfig({
        userId,
        courseId,
        returnUrl,
      });

      return NextResponse.json({
        checkoutId,
        url,
      });
    } catch (error: any) {
      console.error("Course checkout error:", error);
      return internalServerError(
        error?.message || "Failed to create course checkout session",
      );
    }
  },
);
