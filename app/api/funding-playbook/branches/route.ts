import { NextResponse } from "next/server";
import { NearestBranchesRequestSchema } from "@/lib/funding-playbook/schemas";
import { findNearestBranches } from "@/lib/funding-playbook/places";
import {
  getLender,
  getCachedBranches,
  cacheBranches,
  NotFoundError,
} from "@/lib/funding-playbook/firestore-helpers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsedBody = NearestBranchesRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body.", details: parsedBody.error.flatten() },
        { status: 400 },
      );
    }
    const { zip, lenderId, radiusMiles } = parsedBody.data;

    const cached = await getCachedBranches(zip, lenderId);
    if (cached) {
      return NextResponse.json({
        cached: true,
        zip,
        lenderId,
        branches: cached.branches,
      });
    }

    const lender = await getLender(lenderId);
    const branches = await findNearestBranches(
      lender.displayName,
      lender.placesSearchQuery,
      zip,
      radiusMiles,
      5,
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await cacheBranches({
      zip,
      lenderId,
      radiusMiles,
      branches,
      fetchedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    return NextResponse.json({ cached: false, zip, lenderId, branches });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("nearestBranches failed", err);
    return NextResponse.json(
      { error: "Internal error looking up branches." },
      { status: 500 },
    );
  }
}
