import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import {
  getCongrats,
  recordCongrats,
  markCongratsAsRead,
} from "@/service/analysis";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const requestBodySchema = z
  .object({
    message: z
      .string({
        error: "Congratulations message is required",
      })
      .min(1, { error: "Required" }),
    userId: z
      .string({
        error: "User ID is required",
      })
      .min(1, { error: "Required" }),
  })
  .strict();

export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ referenceNumber: string }> }
  ) => {
    const { referenceNumber } = (await params) ?? {};
    if (!referenceNumber) {
      return badRequest({ errors: "Missing reference number" });
    }

    try {
      const congrats = await getCongrats(referenceNumber);
      return NextResponse.json(congrats, { status: 200 });
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest({ errors: err.message });
      }
      console.log("err", err);
      return internalServerError();
    }
  }
);

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ referenceNumber: string }> }
  ) => {
    const { referenceNumber } = (await params) ?? {};
    if (!referenceNumber) {
      return badRequest({ errors: "Missing reference number" });
    }
    const body = await req.json();

    // safeparse
    const parsedBody = requestBodySchema.safeParse(body);

    if (!parsedBody.success) {
      const message = getMessage(parsedBody.error);
      return badRequest({ errors: message });
    }
    try {
      const { message, userId } = parsedBody.data;

      await recordCongrats(userId, referenceNumber, message);

      return NextResponse.json({ message: "ok" }, { status: 200 });
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest({ errors: err.message });
      }
      console.log("err", err);
      return internalServerError();
    }
  }
);

export const PUT = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ referenceNumber: string }> }
  ) => {
    const { referenceNumber } = (await params) ?? {};
    if (!referenceNumber) {
      return badRequest({ errors: "Missing reference number" });
    }
    const body = await req.json();
    const { docId } = body;

    if (!docId) {
      return badRequest({ errors: "Document ID is required" });
    }

    try {
      await markCongratsAsRead(referenceNumber, docId);
      return NextResponse.json({ message: "ok" }, { status: 200 });
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest({ errors: err.message });
      }
      console.log("err", err);
      return internalServerError();
    }
  }
);
