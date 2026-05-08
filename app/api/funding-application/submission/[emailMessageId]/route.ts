import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import {
  getClassifiedDocuments,
  saveClassifiedDocument,
} from "@/service/funding-auto-submission/funding-document";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";

export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ emailMessageId: string }> },
  ) => {
    try {
      const { emailMessageId } = (await params) ?? {};

      if (!emailMessageId) {
        return badRequest({ errors: "Email Message ID is required" });
      }

      const documents = await getClassifiedDocuments(emailMessageId);
      return NextResponse.json(documents, { status: 200 });
    } catch (error) {
      if (error instanceof AppError) {
        return badRequest({ errors: error.message });
      }
      console.error("Failed to get classified documents:", error);
      return internalServerError("Failed to retrieve documents");
    }
  },
);

export const POST = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ emailMessageId: string }> },
  ) => {
    try {
      const { emailMessageId } = (await params) ?? {};

      if (!emailMessageId) {
        return badRequest({ errors: "Email Message ID is required" });
      }

      const payload = await request.json();

      if (!payload) {
        return badRequest({
          errors: "Classification data is required.",
        });
      }

      // Normalize the payload to an array of classification objects
      // n8n might send:
      // 1. { "data": { ... } }
      // 2. { "data": [ ... ] }
      // 3. [ { "data": { ... } }, { "data": [ ... ] } ]
      // 4. { "document_id": "...", ... }

      let normalizedPayload: any[] = [];
      if (Array.isArray(payload)) {
        normalizedPayload = payload;
      } else if (typeof payload === "object") {
        normalizedPayload = [payload];
      }

      const classificationResults: any[] = [];

      for (const item of normalizedPayload) {
        if (item && item.data) {
          if (Array.isArray(item.data)) {
            classificationResults.push(...item.data);
          } else {
            classificationResults.push(item.data);
          }
        } else if (item && Object.keys(item).length > 0) {
          // It's a raw object without a 'data' wrapper
          classificationResults.push(item);
        }
      }

      if (classificationResults.length === 0) {
        return badRequest({
          errors: "No valid classification data found in the payload.",
        });
      }

      // Save to Firestore
      const savedDocuments = await Promise.all(
        classificationResults.map((result) =>
          saveClassifiedDocument(emailMessageId, result),
        ),
      );

      return NextResponse.json({ data: savedDocuments }, { status: 201 });
    } catch (error) {
      if (error instanceof AppError) {
        return badRequest({ errors: error.message });
      }
      console.error("Failed to save classified documents:", error);
      return internalServerError("Failed to save classified documents");
    }
  },
);
