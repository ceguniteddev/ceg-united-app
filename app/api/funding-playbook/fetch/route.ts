import { NextResponse } from "next/server";
import {
  getCachedPlaybook,
  playbookId,
} from "@/lib/funding-playbook/firestore-helpers";
import { getCurrentUser } from "@/service/user";
import { unauthorized, forbidden, badRequest } from "@/app/api/helpers";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const lenderId = searchParams.get("lenderId") || undefined;
    const productId = searchParams.get("productId") || undefined;
    const rawId = searchParams.get("id");

    if (!userId && !rawId) {
      return badRequest({ errors: "userId or id parameter is required." });
    }

    if (userId && currentUser.role !== "Admin" && currentUser.uid !== userId) {
      return forbidden(
        "Access denied: You cannot access another user's playbook.",
      );
    }

    const id = rawId || playbookId(userId!, lenderId, productId);

    const cached = await getCachedPlaybook(id);

    if (!cached) {
      return NextResponse.json(
        { error: "No cached playbook found." },
        { status: 404 },
      );
    }

    // Additional IDOR safeguard against rawId parameter
    const playbookOwnerId = cached.meta?.clientId || id.split("_")[0];
    if (
      currentUser.role !== "Admin" &&
      playbookOwnerId &&
      playbookOwnerId !== currentUser.uid
    ) {
      return forbidden(
        "Access denied: You cannot access another user's playbook.",
      );
    }

    return NextResponse.json({ cached: true, playbook: cached });
  } catch (err) {
    console.error("fetch Playbook failed", err);
    return NextResponse.json(
      { error: "Internal error fetching playbook." },
      { status: 500 },
    );
  }
}
