import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/api-validation";
import { completeWhopCancellation } from "@/service/dodo";
import { getUserById } from "@/service/user";

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ migrationId: string }> },
) => {
  const authenticated = await authenticateRequest(request);
  if (authenticated instanceof NextResponse) return authenticated;
  if (authenticated === true) {
    return NextResponse.json(
      { error: "An administrator session is required." },
      { status: 403 },
    );
  }
  const admin = await getUserById(authenticated.uid);
  if (admin?.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { migrationId } = await params;
    return NextResponse.json(
      await completeWhopCancellation({
        migrationId,
        completedBy: authenticated.uid,
      }),
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unable to complete migration." },
      { status: 400 },
    );
  }
};
