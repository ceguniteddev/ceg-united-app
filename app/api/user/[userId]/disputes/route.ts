import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import {
  getUserDisputeSnapshot,
  startDisputeAudit,
  markDisputeItem,
  attestDisputeLines,
  addDisputeEvidence,
  acceptWeakDisputeEvidence,
  buildDisputeLetters,
  signDisputeLetter,
  mailDisputeLetter,
  uploadDisputeResponse,
  answerDisputeClarification,
  confirmNoDisputeResponse,
  markDisputeNotificationRead,
  setDisputeNotificationPrefs,
  resetUserDisputes,
} from "@/service/disputes";

export const GET = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string }> },
  ) => {
    try {
      const { userId } = (await params) ?? {};
      if (!userId) {
        return badRequest({ errors: "Missing User ID" });
      }

      const snapshot = await getUserDisputeSnapshot(userId);
      return NextResponse.json(snapshot, { status: 200 });
    } catch (err) {
      console.error("Error in GET dispute snapshot:", err);
      return internalServerError();
    }
  },
);

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string }> },
  ) => {
    try {
      const { userId } = (await params) ?? {};
      if (!userId) {
        return badRequest({ errors: "Missing User ID" });
      }

      const body = await req.json();
      const { action } = body;

      switch (action) {
        case "start_audit": {
          const snapshot = await startDisputeAudit(userId);
          return NextResponse.json(snapshot, { status: 200 });
        }

        case "mark_item": {
          const { itemId, verdict, errorCodes, explanation } = body;
          if (!itemId || !verdict) {
            return badRequest({ errors: "Missing itemId or verdict" });
          }
          const snapshot = await markDisputeItem(userId, {
            itemId,
            verdict,
            errorCodes,
            explanation,
          });
          return NextResponse.json(snapshot, { status: 200 });
        }

        case "attest": {
          const { lineIds, statement } = body;
          if (!lineIds || !statement) {
            return badRequest({ errors: "Missing lineIds or statement" });
          }
          const snapshot = await attestDisputeLines(userId, { lineIds, statement });
          return NextResponse.json(snapshot, { status: 200 });
        }

        case "add_evidence": {
          const { lineId, storagePath, docType, itemId, fileName, sizeBytes, contentType } =
            body;
          if (!lineId || !storagePath || !docType) {
            return badRequest({ errors: "Missing lineId, storagePath, or docType" });
          }
          const snapshot = await addDisputeEvidence(userId, {
            lineId,
            storagePath,
            docType,
            itemId,
            fileName,
            sizeBytes,
            contentType,
          });
          return NextResponse.json(snapshot, { status: 200 });
        }

        case "accept_weak": {
          const { lineIds } = body;
          if (!lineIds) return badRequest({ errors: "Missing lineIds" });
          const snapshot = await acceptWeakDisputeEvidence(userId, { lineIds });
          return NextResponse.json(snapshot, { status: 200 });
        }

        case "build_letters": {
          const { lineIds } = body;
          if (!lineIds) return badRequest({ errors: "Missing lineIds" });
          const snapshot = await buildDisputeLetters(userId, { lineIds });
          return NextResponse.json(snapshot, { status: 200 });
        }

        case "sign_letter": {
          const { letterId, signatureName } = body;
          if (!letterId || !signatureName) {
            return badRequest({ errors: "Missing letterId or signatureName" });
          }
          const snapshot = await signDisputeLetter(userId, {
            letterId,
            signatureName,
          });
          return NextResponse.json(snapshot, { status: 200 });
        }

        case "mail_letter": {
          const { letterId, method } = body;
          if (!letterId || !method) {
            return badRequest({ errors: "Missing letterId or method" });
          }
          const snapshot = await mailDisputeLetter(userId, { letterId, method });
          return NextResponse.json(snapshot, { status: 200 });
        }

        case "upload_response": {
          const { lineIds, storagePaths, receivedDate, sender } = body;
          if (!lineIds || !storagePaths || !receivedDate || !sender) {
            return badRequest({ errors: "Missing response parameters" });
          }
          const snapshot = await uploadDisputeResponse(userId, {
            lineIds,
            storagePaths,
            receivedDate,
            sender,
          });
          return NextResponse.json(snapshot, { status: 200 });
        }

        case "answer_clarification": {
          const { responseId, answer } = body;
          if (!responseId || !answer) {
            return badRequest({ errors: "Missing responseId or answer" });
          }
          const snapshot = await answerDisputeClarification(userId, {
            responseId,
            answer,
          });
          return NextResponse.json(snapshot, { status: 200 });
        }

        case "confirm_no_response": {
          const { lineIds } = body;
          if (!lineIds) return badRequest({ errors: "Missing lineIds" });
          const snapshot = await confirmNoDisputeResponse(userId, { lineIds });
          return NextResponse.json(snapshot, { status: 200 });
        }

        case "mark_notification_read": {
          const { notificationId } = body;
          if (!notificationId) {
            return badRequest({ errors: "Missing notificationId" });
          }
          await markDisputeNotificationRead(userId, notificationId);
          return NextResponse.json({ success: true }, { status: 200 });
        }

        case "set_notification_prefs": {
          const { prefs } = body;
          await setDisputeNotificationPrefs(userId, prefs || {});
          return NextResponse.json({ success: true }, { status: 200 });
        }

        case "reset": {
          const snapshot = await resetUserDisputes(userId);
          return NextResponse.json(snapshot, { status: 200 });
        }

        default:
          return badRequest({ errors: `Unknown action: ${action}` });
      }
    } catch (err: any) {
      console.error("Error in POST dispute action:", err);
      return internalServerError();
    }
  },
);
