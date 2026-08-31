import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/api-validation";
import { createWhopMigrationCheckout } from "@/service/dodo";

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) => {
  const authenticated = await authenticateRequest(request);
  if (authenticated instanceof NextResponse) return authenticated;
  const { userId } = await params;
  if (authenticated !== true && authenticated.uid !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (
    !body ||
    (body.target !== "membership" && body.target !== "credit_module_pro")
  ) {
    return NextResponse.json(
      { error: "A valid migration target is required." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      await createWhopMigrationCheckout({ userId, target: body.target }),
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unable to start billing migration." },
      { status: 400 },
    );
  }
};
