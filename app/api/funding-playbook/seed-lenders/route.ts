import { NextResponse } from "next/server";
import { seedLenderData } from "@/lib/funding-playbook/seed-data";

export async function POST() {
  try {
    const result = await seedLenderData();
    return NextResponse.json({
      ok: true,
      message: "Lenders seeded successfully",
      ...result,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("seed-lenders failed", err);
    return NextResponse.json(
      { error: "Failed to seed lenders", details: errorMessage },
      { status: 500 },
    );
  }
}
