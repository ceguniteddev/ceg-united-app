import { NextResponse } from "next/server";
import {
  GeneratePlaybookRequestSchema,
  PlaybookSchema,
} from "@/lib/funding-playbook/schemas";
import {
  getClient,
  getLender,
  getProduct,
  listProducts,
  savePlaybook,
  getCachedPlaybook,
  playbookId,
  NotFoundError,
} from "@/lib/funding-playbook/firestore-helpers";
import { findNearestBranches } from "@/lib/funding-playbook/places";
import { generateFundingPlaybook } from "@/service/n8n";
import {
  checkAndIncrementRateLimit,
  RateLimitExceededError,
} from "@/lib/funding-playbook/rate-limit";
import {
  normalizeN8nOutput,
  assemblePlaybook,
} from "@/lib/funding-playbook/playbook-mapper";
import type { Branch } from "@/types/funding-playbook";

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

    await checkAndIncrementRateLimit(userId, "generatePlaybook");

    // Check cache before calling n8n
    const id = playbookId(userId, lenderId, productId);
    const cached = await getCachedPlaybook(id);
    if (cached) {
      return NextResponse.json({ cached: true, playbook: cached });
    }

    // Fetch deterministic data and AI playbook generation in parallel
    const [client, lender, product, allLenderProducts, rawResult] =
      await Promise.all([
        getClient(userId),
        getLender(lenderId),
        getProduct(lenderId, productId),
        listProducts(lenderId).catch(() => []),
        generateFundingPlaybook({
          userId,
          lenderId,
          productId,
        }),
      ]);

    // Check for 400 response status from n8n / AI service
    if (
      rawResult &&
      typeof rawResult === "object" &&
      (("status" in rawResult && rawResult.status === 400) ||
        ("statusCode" in rawResult && rawResult.statusCode === 400))
    ) {
      return NextResponse.json(
        {
          error:
            (rawResult as any).message ||
            (rawResult as any).error ||
            "Failed to generate funding playbook",
        },
        { status: 400 },
      );
    }

    // Normalize and unwrap n8n response format
    const normalizedAiOutput = normalizeN8nOutput(rawResult);

    if (
      normalizedAiOutput &&
      typeof normalizedAiOutput === "object" &&
      (("status" in normalizedAiOutput && normalizedAiOutput.status === 400) ||
        ("statusCode" in normalizedAiOutput &&
          normalizedAiOutput.statusCode === 400))
    ) {
      return NextResponse.json(
        {
          error:
            normalizedAiOutput.message ||
            normalizedAiOutput.error ||
            "Bad request from AI service.",
        },
        { status: 400 },
      );
    }

    if (!normalizedAiOutput || typeof normalizedAiOutput !== "object") {
      return NextResponse.json(
        { error: "Empty or invalid response received from AI service." },
        { status: 502 },
      );
    }

    // Fetch nearest branches (fail silently to empty list if search fails)
    let branches: Branch[] = [];
    try {
      branches = await findNearestBranches(
        lender.displayName || (lender as any).bankName || "Lender",
        lender.placesSearchQuery,
        client.zip || "32601",
        25,
        5,
      );
    } catch (err) {
      console.warn(
        "Places lookup failed — continuing with empty branch list.",
        err,
      );
    }

    // Assemble nested Playbook combining deterministic data and AI reasoning
    const playbook = assemblePlaybook({
      aiOutput: normalizedAiOutput,
      client,
      lender,
      product,
      branches,
      allLenderProducts,
    });

    // Strict schema validation of final assembled playbook
    const validation = PlaybookSchema.safeParse(playbook);
    if (!validation.success) {
      console.error(
        "Playbook validation failed for user:",
        userId,
        validation.error.flatten(),
      );
      return NextResponse.json(
        {
          error: "Generated playbook does not match expected structure.",
          details: validation.error.flatten(),
        },
        { status: 502 },
      );
    }

    const validatedPlaybook = validation.data;

    // Save validated playbook & return
    await savePlaybook(userId, validatedPlaybook);

    return NextResponse.json({ cached: false, playbook: validatedPlaybook });
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (
      err instanceof Error &&
      (err.message.includes("(400)") || err.message.includes("400"))
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("generatePlaybook failed", err);
    return NextResponse.json(
      { error: "Internal error generating playbook." },
      { status: 500 },
    );
  }
}
