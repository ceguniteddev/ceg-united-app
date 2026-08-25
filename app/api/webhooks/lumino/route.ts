import { NextRequest, NextResponse } from "next/server";
import { parseLuminoZapierWebhookPayload } from "@/schema/lumino-webhook";
import {
  processLuminoZapierWebhook,
  validateLuminoWebhookAuth,
} from "@/service/lumino";

export async function POST(req: NextRequest) {
  // 1. Authenticate using Bearer token
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");

  const isAuthenticated = await validateLuminoWebhookAuth(authHeader);
  if (!isAuthenticated) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Invalid or missing Authorization Bearer token",
      },
      { status: 401 },
    );
  }

  // 2. Parse and validate payload
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: "Invalid JSON in request body",
      },
      { status: 400 },
    );
  }

  const queryCourseId =
    req.nextUrl.searchParams.get("courseId") ||
    req.nextUrl.searchParams.get("course_id") ||
    req.nextUrl.searchParams.get("course") ||
    req.headers.get("x-course-id") ||
    null;

  let payload;
  try {
    payload = parseLuminoZapierWebhookPayload(rawBody, queryCourseId);
  } catch (validationErr: any) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message:
          validationErr.message ||
          "Validation failed for Lumino webhook payload",
        details: validationErr.errors || undefined,
      },
      { status: 400 },
    );
  }

  // 3. Process payment and fulfill enrollment
  try {
    const result = await processLuminoZapierWebhook(payload);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error processing Lumino Zapier webhook:", error);

    const statusCode =
      typeof error?.statusCode === "number" ? error.statusCode : 500;

    return NextResponse.json(
      {
        error: error.name || "Internal Server Error",
        message: error.message || "Failed to process Lumino webhook",
      },
      { status: statusCode },
    );
  }
}
