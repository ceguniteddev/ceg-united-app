import { NextResponse } from "next/server";
import {
  getClient,
  getLender,
  getProduct,
  listProducts,
  savePlaybook,
} from "@/lib/funding-playbook/firestore-helpers";
import { findNearestBranches } from "@/lib/funding-playbook/places";
import {
  normalizeN8nOutput,
  assemblePlaybook,
} from "@/lib/funding-playbook/playbook-mapper";
import { PlaybookSchema } from "@/lib/funding-playbook/schemas";
import { logInfo, logError } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const adminAccessKey =
      req.headers.get("ADMIN_ACCESS_KEY") ||
      req.headers.get("admin-access-key") ||
      req.headers.get("x-admin-access-key");

    if (
      process.env.ADMIN_ACCESS_KEY &&
      adminAccessKey !== process.env.ADMIN_ACCESS_KEY
    ) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const {
      userId,
      lenderId,
      productId,
      rawResult,
      playbook: directPlaybook,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 },
      );
    }

    logInfo("Funding playbook webhook received:", {
      userId,
      lenderId,
      productId,
    });

    let playbookToSave = directPlaybook;

    if (!playbookToSave) {
      const rawAiData = rawResult || body;
      const normalizedAiOutput = normalizeN8nOutput(rawAiData);

      if (!normalizedAiOutput || typeof normalizedAiOutput !== "object") {
        return NextResponse.json(
          { error: "Invalid or empty AI output payload." },
          { status: 400 },
        );
      }

      const targetLenderId = lenderId || "chase";
      const targetProductId = productId || "chase-sapphire-preferred";

      const [client, lender, product, allLenderProducts] = await Promise.all([
        getClient(userId),
        getLender(targetLenderId),
        getProduct(targetLenderId, targetProductId),
        listProducts(targetLenderId).catch(() => []),
      ]);

      let branches: any[] = [];
      try {
        branches = await findNearestBranches({
          lenderDisplayName:
            lender.displayName || (lender as any).bankName || "Lender",
          userId,
          limit: 5,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        void logError(error, {
          action: "findNearestBranchesForPlaybookWebhook",
          userId,
          lenderId: targetLenderId,
          productId: targetProductId,
        });
      }

      playbookToSave = assemblePlaybook({
        aiOutput: normalizedAiOutput,
        client,
        lender,
        product,
        branches,
        allLenderProducts,
      });
    }

    // Validate assembled or provided playbook against strict Zod schema
    const validation = PlaybookSchema.safeParse(playbookToSave);
    if (!validation.success) {
      void logError(
        new Error("Playbook schema validation failed in webhook callback."),
        {
          action: "validateFundingPlaybookWebhook",
          userId,
          lenderId,
          productId,
          details: validation.error.flatten(),
        },
      );
      return NextResponse.json(
        {
          error: "Generated playbook does not match expected structure.",
          details: validation.error.flatten(),
        },
        { status: 422 },
      );
    }

    const validatedPlaybook = validation.data;
    await savePlaybook(userId, validatedPlaybook);

    logInfo("Successfully saved funding playbook to database via webhook", {
      userId,
      playbookId: validatedPlaybook.meta.id,
    });

    return NextResponse.json({
      success: true,
      cached: false,
      playbookId: validatedPlaybook.meta.id,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    void logError(error, { action: "processFundingPlaybookWebhook" });

    return NextResponse.json(
      { error: error.message || "Internal error processing webhook." },
      { status: 500 },
    );
  }
}
