import { badRequest } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { enrollUserInCourse } from "@/service/educational-materials/progress";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string; courseId: string }> }
  ) => {
    const { userId, courseId } = (await params) ?? {};

    if (!userId || !courseId) {
      return badRequest({ errors: "Missing User ID or Course ID" });
    }

    try {
      const enrollment = await enrollUserInCourse({ userId, courseId });
      return NextResponse.json(enrollment, { status: 200 });
    } catch (error: any) {
      console.error("POST /api/user/[userId]/courses/[courseId]/enroll Error:", error);
      return NextResponse.json(
        { message: error.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  }
);
