import { badRequest } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { getUserCoursesWithProgress } from "@/service/educational-materials/progress";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(
  async (req: NextRequest, { params }: { params?: Promise<{ userId: string }> }) => {
    const { userId } = (await params) ?? {};

    if (!userId) {
      return badRequest({ errors: "Missing User ID" });
    }

    try {
      const coursesWithProgress = await getUserCoursesWithProgress(userId);
      return NextResponse.json(coursesWithProgress, { status: 200 });
    } catch (error: any) {
      console.error("GET /api/user/[userId]/courses/progress Error:", error);
      return NextResponse.json(
        { message: error.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  }
);
