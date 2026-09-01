import { z } from "zod";
import { NextResponse } from "next/server";
import { forbidden, handleApiError } from "@/app/api/helpers";
import { setAdminCourseCapabilityGrant } from "@/service/course-capabilities";
import { getCurrentUser, getUserById } from "@/service/user";

const requestSchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1),
  active: z.boolean(),
  reason: z.string().trim().min(3),
});

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return forbidden("Admin access required.");
    const admin = await getUserById(currentUser.uid);
    if (admin?.role !== "Admin") return forbidden("Admin access required.");

    const input = requestSchema.parse(await request.json());
    const result = await setAdminCourseCapabilityGrant({
      ...input,
      adminId: currentUser.uid,
      adminEmail: currentUser.email || admin.email || "unknown",
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
