import { NextResponse } from "next/server";
import {
  getCachedPlaybook,
  playbookId,
} from "@/lib/funding-playbook/firestore-helpers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const lenderId = searchParams.get("lenderId") || undefined;
    const productId = searchParams.get("productId") || undefined;
    const rawId = searchParams.get("id");

    if (!userId && !rawId) {
      return NextResponse.json(
        { error: "userId or id parameter is required." },
        { status: 400 },
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

    return NextResponse.json({ cached: true, playbook: cached });
  } catch (err) {
    console.error("fetch Playbook failed", err);
    return NextResponse.json(
      { error: "Internal error fetching playbook." },
      { status: 500 },
    );
  }
}
