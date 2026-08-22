import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { getUserCourseEnrollment } from "@/service/educational-materials/progress";
import { badRequest, internalServerError } from "@/app/api/helpers";

export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ userId: string; courseId: string }> },
  ) => {
    try {
      const { userId, courseId } = (await params) ?? {};
      if (!userId || !courseId) {
        return badRequest({ errors: "Missing userId or courseId" });
      }

      const enrollment = await getUserCourseEnrollment({ userId, courseId });
      return NextResponse.json({
        isEnrolled: Boolean(enrollment),
        enrollment,
      });
    } catch (error: any) {
      return internalServerError(
        error?.message || "Failed to check enrollment",
      );
    }
  },
);
