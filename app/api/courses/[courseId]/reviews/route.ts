import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import {
  getCourseReviews,
  addCourseReview,
} from "@/service/educational-materials/course";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { getUserById } from "@/service/user";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) => {
  try {
    const { courseId } = (await params) ?? {};
    if (!courseId) return badRequest({ errors: "Missing course ID" });

    const reviews = await getCourseReviews(courseId);
    return NextResponse.json({ reviews });
  } catch (error: any) {
    return internalServerError(error?.message || "Failed to fetch reviews");
  }
};

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ courseId: string }> },
  ) => {
    try {
      const { courseId } = (await params) ?? {};
      if (!courseId) return badRequest({ errors: "Missing course ID" });

      const body = await req.json();
      const { userId, rating, comment } = body;

      if (!userId || !rating || !comment) {
        return badRequest({ errors: "Missing required review fields" });
      }

      const user = await getUserById(userId);
      const userName = user
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Student"
        : "Student";

      const review = await addCourseReview({
        courseId,
        userId,
        userName,
        userAvatar: (user as any)?.avatarUrl || "",
        rating: Number(rating),
        comment,
      });

      return NextResponse.json({ review });
    } catch (error: any) {
      return internalServerError(error?.message || "Failed to add review");
    }
  },
);
