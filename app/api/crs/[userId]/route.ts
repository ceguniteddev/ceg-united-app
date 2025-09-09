import { badRequest, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { getMessage } from "@/schema";
import { recordAnalysis } from "@/service/analysis";
import { recordCRSReport } from "@/service/crs";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function POST(req: NextRequest, { params }: { params?: Promise<{ userId: string }> }) {
  const { userId } = (await params) ?? {};
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  const body = await req.json();
  // safeparse
  try {
    await recordCRSReport(userId, body);

    return NextResponse.json({ message: "ok" }, { status: 200 });
  } catch (err) {
    if (err instanceof AppError) {
      return badRequest(err.message);
    }
    console.log(err);
    return internalServerError();
  }
}
