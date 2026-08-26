import { NextResponse } from "next/server";
import {
  ReconsiderationScriptRequestSchema,
  AIReconsiderationScriptOutputSchema,
} from "@/lib/funding-playbook/schemas";
import {
  getClient,
  getLender,
  reconsiderationCacheId,
  getCachedReconsiderationScript,
  cacheReconsiderationScript,
  NotFoundError,
} from "@/lib/funding-playbook/firestore-helpers";
import { buildReconsiderationPrompt } from "@/lib/funding-playbook/prompt-builder";
import {
  callReasoningModel,
  extractJsonBlock,
} from "@/lib/funding-playbook/ai-router";
import { getCurrentUser } from "@/service/user";
import { unauthorized, forbidden } from "@/app/api/helpers";

function fallbackScript(lenderDisplayName: string): string {
  return (
    `Hi, I'm calling about my recent application with ${lenderDisplayName}. I'd like to request a manual review or reconsideration of my file. ` +
    "I believe my overall financial situation and credit profile support approval for this line. " +
    "Could you please let me know what specific steps or updated documentation would help you reconsider? " +
    "Thank you for taking another look at my application today."
  );
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorized();
    }

    const body = await req.json();
    const parsedBody = ReconsiderationScriptRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body.", details: parsedBody.error.flatten() },
        { status: 400 },
      );
    }
    const { clientId, lenderId, denialReason } = parsedBody.data;

    if (currentUser.role !== "Admin" && currentUser.uid !== clientId) {
      return forbidden(
        "Access denied: You cannot generate a script for another user.",
      );
    }

    const cacheId = reconsiderationCacheId(clientId, lenderId, denialReason);
    const cached = await getCachedReconsiderationScript(cacheId);
    if (cached) {
      const lender = await getLender(lenderId);
      return NextResponse.json({
        cached: true,
        script: cached.script,
        phoneNumber: lender.reconsiderationPhone,
        hours: lender.reconsiderationHours,
      });
    }

    const [client, lender] = await Promise.all([
      getClient(clientId),
      getLender(lenderId),
    ]);
    const { systemPrompt, userPrompt } = buildReconsiderationPrompt({
      client,
      lender,
      denialReason,
    });

    let script = fallbackScript(lender.displayName);
    try {
      const result = await callReasoningModel({
        systemPrompt,
        userPrompt,
        temperature: 0.3,
        maxOutputTokens: 600,
      });
      const jsonText = extractJsonBlock(result.rawText);
      const parsed = JSON.parse(jsonText);
      const validated = AIReconsiderationScriptOutputSchema.parse(parsed);
      script = validated.script;
    } catch (err) {
      console.error(
        "Reconsideration script AI reasoning failed — using fallback script.",
        err,
      );
    }

    await cacheReconsiderationScript(cacheId, script, 24);

    return NextResponse.json({
      cached: false,
      script,
      phoneNumber: lender.reconsiderationPhone,
      hours: lender.reconsiderationHours,
    });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("reconsiderationScript failed", err);
    return NextResponse.json(
      { error: "Internal error generating script." },
      { status: 500 },
    );
  }
}
