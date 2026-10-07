import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import {
  getUserPositiveSnapshot,
  selectPositiveProviders,
  advancePositiveMilestone,
  attachPositiveDocument,
  requestPositiveHelp,
  setPositiveConsent,
  estimatePositiveScenario,
  publishPositiveProvider,
  publishPositiveRule,
  updatePositiveContext,
  seedPositiveRecommendation,
} from "@/service/positive";

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

      const snapshot = await getUserPositiveSnapshot(userId);
      return NextResponse.json(snapshot, { status: 200 });
    } catch (err) {
      console.error("Error in GET positive snapshot:", err);
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

      if (action === "select") {
        const { category, ids, bureau, reportId } = body;
        if (!category || !ids || !bureau) {
          return badRequest({ errors: "Missing category, ids, or bureau" });
        }
        const updated = await selectPositiveProviders({
          userId,
          category,
          ids,
          bureau,
          reportId: reportId || "default",
        });
        return NextResponse.json(updated, { status: 200 });
      }

      if (action === "advance") {
        const { enrollmentId, version, nextStage, documentPath, documentUrl } = body;
        if (!enrollmentId || !nextStage) {
          return badRequest({ errors: "Missing enrollmentId or nextStage" });
        }
        const updated = await advancePositiveMilestone({
          userId,
          enrollmentId,
          version,
          nextStage,
          documentPath,
          documentUrl,
        });
        return NextResponse.json(updated, { status: 200 });
      }

      if (action === "upload") {
        const { enrollmentId, documentPath } = body;
        if (!enrollmentId || !documentPath) {
          return badRequest({ errors: "Missing enrollmentId or documentPath" });
        }
        const updated = await attachPositiveDocument({
          userId,
          enrollmentId,
          path: documentPath,
        });
        return NextResponse.json(updated, { status: 200 });
      }

      if (action === "help") {
        const { enrollmentId, enrollmentName, message } = body;
        if (!enrollmentId || !message) {
          return badRequest({ errors: "Missing enrollmentId or message" });
        }
        await requestPositiveHelp({
          userId,
          enrollmentId,
          enrollmentName: enrollmentName || "Enrollment",
          message,
        });
        return NextResponse.json({ success: true }, { status: 200 });
      }

      if (action === "consent") {
        const { enabled } = body;
        const updated = await setPositiveConsent({ userId, enabled: !!enabled });
        return NextResponse.json(updated, { status: 200 });
      }

      if (action === "estimate") {
        const { bureau, model, providerIds } = body;
        const result = await estimatePositiveScenario({
          userId,
          bureau: bureau || "experian",
          model: model || "FICO Score 8",
          providerIds: providerIds || [],
        });
        return NextResponse.json(result, { status: 200 });
      }

      if (action === "publishProvider") {
        const { provider } = body;
        if (!provider) return badRequest({ errors: "Missing provider data" });
        await publishPositiveProvider(provider);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      if (action === "publishRule") {
        const { rule } = body;
        if (!rule) return badRequest({ errors: "Missing rule data" });
        await publishPositiveRule(rule);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      if (action === "updateContext") {
        const { context } = body;
        if (!context) return badRequest({ errors: "Missing context data" });
        await updatePositiveContext(userId, context);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      if (action === "seed") {
        await seedPositiveRecommendation(userId);
        const updated = await getUserPositiveSnapshot(userId);
        return NextResponse.json(updated, { status: 200 });
      }

      return badRequest({ errors: "Unknown action" });
    } catch (err: any) {
      console.error("Error in POST positive action:", err);
      return internalServerError();
    }
  },
);
