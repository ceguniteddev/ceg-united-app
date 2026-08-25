import { badRequest, forbidden } from "@/app/api/helpers";
import { authenticateRequest } from "@/lib/api-validation";
import { unenrollUserFromCourse } from "@/service/educational-materials/progress";
import { getUserById } from "@/service/user";
import { NextRequest, NextResponse } from "next/server";

export const DELETE = async (
  req: NextRequest,
  { params }: { params?: Promise<{ userId: string; courseId: string }> },
) => {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { userId, courseId } = (await params) ?? {};

  if (!userId || !courseId) {
    return badRequest({ errors: "Missing User ID or Course ID" });
  }

  try {
    let isAdmin = false;
    if (authResult === true) {
      isAdmin = true;
    } else if (authResult && typeof authResult === "object") {
      if (authResult.admin || authResult.role === "Admin") {
        isAdmin = true;
      } else {
        const actingUser = await getUserById(authResult.uid);
        if (actingUser?.role === "Admin") {
          isAdmin = true;
        }
      }
    }

    if (!isAdmin) {
      const authUid = typeof authResult === "object" ? authResult.uid : null;
      if (!authUid || authUid !== userId) {
        return forbidden(
          "Access denied: You do not have permission to unenroll this user",
        );
      }
    }

    await unenrollUserFromCourse({ userId, courseId });
    return NextResponse.json(
      { message: "User unenrolled successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      "DELETE /api/user/[userId]/courses/[courseId]/unenroll Error:",
      error,
    );
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
};
