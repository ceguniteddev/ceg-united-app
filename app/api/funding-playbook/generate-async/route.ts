import { NextResponse } from "next/server";
import { GeneratePlaybookRequestSchema } from "@/lib/funding-playbook/schemas";
import {
  getCachedPlaybook,
  playbookId,
} from "@/lib/funding-playbook/firestore-helpers";
import { generateFundingPlaybook } from "@/service/n8n";
import {
  checkAndIncrementRateLimit,
  RateLimitExceededError,
} from "@/lib/funding-playbook/rate-limit";
import { logInfo, logError } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsedBody = GeneratePlaybookRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body.", details: parsedBody.error.flatten() },
        { status: 400 },
      );
    }

    const {
      userId,
      lenderId: reqLenderId,
      productId: reqProductId,
    } = parsedBody.data;

    const lenderId = reqLenderId || "chase";
    const productId = reqProductId || "chase-sapphire-preferred";

    // 1. Check if playbook is already cached
    const id = playbookId(userId, lenderId, productId);
    const cached = await getCachedPlaybook(id);
    if (cached) {
      logInfo("Playbook already cached, skipping n8n generation trigger", {
        id,
      });
      return NextResponse.json({
        cached: true,
        status: "already_exists",
        playbookId: id,
      });
    }

    // 2. Check rate limit
    await checkAndIncrementRateLimit(userId, "generatePlaybook");

    // 3. Fire-and-forget: Trigger n8n without blocking the response
    logInfo("Triggering background funding playbook generation...", {
      userId,
      lenderId,
      productId,
    });

    generateFundingPlaybook({
      userId,
      lenderId,
      productId,
    }).catch((err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      void logError(error, {
        action: "generateFundingPlaybook",
        userId,
        lenderId,
        productId,
      });
    });

    return NextResponse.json(
      {
        cached: false,
        status: "initiated",
        message: "Playbook generation triggered in background.",
      },
      { status: 202 },
    );
  } catch (err: unknown) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }

    const error = err instanceof Error ? err : new Error(String(err));
    void logError(error, { action: "generateFundingPlaybookAsync" });

    return NextResponse.json(
      {
        error:
          error.message || "Internal error triggering playbook generation.",
      },
      { status: 500 },
    );
  }
}
