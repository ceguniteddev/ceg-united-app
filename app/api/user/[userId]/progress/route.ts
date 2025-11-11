import { badRequest } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { updateUserProgress } from "@/service/educational-materials/progress";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(
  async (req: NextRequest, { params }: { params?: Promise<{ userId: string }> }) => {
    const { userId } = (await params) ?? {};

    if (!userId) {
      return badRequest({ errors: "Missing User ID" });
    }

    try {
      const body = await req.json();
      const { chapterId, courseId, isCompleted } = body;

      if (!chapterId || !courseId || typeof isCompleted !== "boolean") {
        return badRequest({
          errors: "Missing or invalid chapterId, courseId, or isCompleted",
        });
      }

      const progress = await updateUserProgress({
        userId,
        chapterId,
        courseId,
        isCompleted,
      });

      return NextResponse.json(progress, { status: 200 });
    } catch (error: any) {
      console.error("POST /api/user/[userId]/progress Error:", error);
      return NextResponse.json(
        { message: error.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  }
);
