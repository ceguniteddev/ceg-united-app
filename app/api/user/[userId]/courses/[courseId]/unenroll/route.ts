import { badRequest } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { unenrollUserFromCourse } from "@/service/educational-materials/progress";
import { NextRequest, NextResponse } from "next/server";

export const DELETE = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string; courseId: string }> }
  ) => {
    const { userId, courseId } = (await params) ?? {};

    if (!userId || !courseId) {
      return badRequest({ errors: "Missing User ID or Course ID" });
    }

    try {
      await unenrollUserFromCourse({ userId, courseId });
      return NextResponse.json({ message: "User unenrolled successfully" }, { status: 200 });
    } catch (error: any) {
      console.error("DELETE /api/user/[userId]/courses/[courseId]/unenroll Error:", error);
      return NextResponse.json(
        { message: error.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  }
);
