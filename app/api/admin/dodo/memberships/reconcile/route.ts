import { NextRequest, NextResponse } from "next/server";

import { internalServerError } from "@/app/api/helpers";
import { authenticateRequest } from "@/lib/api-validation";
import { reconcileLegacyMemberships } from "@/service/dodo";
import { getUserById } from "@/service/user";

export const POST = async (request: NextRequest) => {
  try {
    const authenticated = await authenticateRequest(request);
    if (authenticated instanceof NextResponse) return authenticated;
    if (authenticated !== true) {
      const user = await getUserById(authenticated.uid);
      if (user?.role !== "Admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(
      await reconcileLegacyMemberships({ apply: body.apply === true }),
    );
  } catch (error) {
    console.error("Dodo membership reconciliation failed", error);
    return internalServerError("Membership reconciliation failed.");
  }
};
