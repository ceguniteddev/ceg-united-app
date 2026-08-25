import { badRequest, forbidden } from "@/app/api/helpers";
import { authenticateRequest } from "@/lib/api-validation";
import { enrollUserInCourse } from "@/service/educational-materials/progress";
import { getUserById } from "@/service/user";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (
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
    let actingAdminId: string | undefined;
    let actingAdminEmail: string | undefined;

    if (authResult === true) {
      isAdmin = true;
    } else if (authResult && typeof authResult === "object") {
      actingAdminId = authResult.uid;
      actingAdminEmail = authResult.email;
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
          "Access denied: You do not have permission to enroll this user",
        );
      }
    }

    let body: any = {};
    try {
      if (req.headers.get("content-type")?.includes("application/json")) {
        body = await req.json();
      }
    } catch {
      // Body is optional
    }

    const enrollment = await enrollUserInCourse({
      userId,
      courseId,
      isManualEnrollment: isAdmin,
      isPaymentVerified: isAdmin,
      assignedByAdminId: isAdmin ? actingAdminId : undefined,
      assignedByAdminEmail: isAdmin ? actingAdminEmail : undefined,
      enrollmentSource: isAdmin ? "manual_admin" : undefined,
      notes: body?.notes,
    });

    return NextResponse.json(enrollment, { status: 200 });
  } catch (error: any) {
    console.error(
      "POST /api/user/[userId]/courses/[courseId]/enroll Error:",
      error,
    );
    const status =
      error.message === "Course not found"
        ? 404
        : error.message?.includes("not available")
          ? 422
          : 400;
    return NextResponse.json(
      { message: error.message || "Failed to enroll user in course" },
      { status },
    );
  }
};
