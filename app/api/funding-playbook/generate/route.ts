import { NextResponse } from "next/server";
import {
  getClient,
  getLender,
  getProduct,
  getCachedPlaybook,
  cachePlaybook,
  playbookId,
  NotFoundError,
} from "@/lib/funding-playbook/firestore-helpers";
import { findNearestBranches } from "@/lib/funding-playbook/places";
import {
  callReasoningModel,
  getReasoningModelName,
  extractJsonBlock,
} from "@/lib/funding-playbook/ai-router";
import { buildPlaybookPrompt } from "@/lib/funding-playbook/prompt-builder";
import {
  AIPlaybookReasoningOutputSchema,
  validateApprovalRangeWithinBand,
  GeneratePlaybookRequestSchema,
} from "@/lib/funding-playbook/schemas";
import {
  checkAndIncrementRateLimit,
  RateLimitExceededError,
} from "@/lib/funding-playbook/rate-limit";
import type {
  Playbook,
  AIPlaybookReasoningOutput,
  ClientProfile,
  Lender,
  Product,
  Branch,
  CegProductLift,
} from "@/types/funding-playbook";

const PLAYBOOK_TTL_HOURS = 24;

function cegProductLiftFor(
  lift: CegProductLift,
  service:
    | "tradelines"
    | "credit_repair"
    | "income_coaching"
    | "business_formation",
): string | undefined {
  switch (service) {
    case "tradelines":
      return lift.tradelines;
    case "credit_repair":
      return lift.creditRepair;
    case "income_coaching":
      return lift.incomeCoaching;
    case "business_formation":
      return lift.businessFormation;
    default:
      return undefined;
  }
}

function buildFallbackAIOutput(
  client: ClientProfile,
  lender: Omit<Lender, "products">,
  product: Product,
): AIPlaybookReasoningOutput {
  const [lo, hi] = product.typicalApprovalRange;
  return {
    section1_aiPersonalizedNote:
      "Personalized guidance is temporarily unavailable — the curated recommendation above still applies.",
    section4_aiPersonalizedRange: [lo, hi],
    section4_confidenceLevel: "low",
    section4_aiReasoning:
      "This is the lender's documented approval range. Personalized narrowing based on your profile is temporarily unavailable.",
    section5_aiRecommendedStatedIncome: client.income.statedAnnualIncome,
    section5_aiReasoning:
      "Using your most recently recorded stated income; personalized guidance is temporarily unavailable.",
    section6_aiStructuringMath: `Your reported monthly housing payment is $${client.dti.rentOrMortgageMonthly}. Detailed structuring math is temporarily unavailable.`,
    section6_aiRecommendation:
      "Review your DTI with a CEG advisor before applying.",
    section7_aiClientSpecificRisks: product.denialReasons.slice(0, 3),
    section7_aiMitigationSteps: [
      "Speak with a CEG advisor before applying to address any risk factors above.",
    ],
    section8_recommendations: client.cegServicesEnrolled
      .slice(0, 3)
      .map((service, i) => ({
        service,
        rank: i + 1,
        aiApplicability:
          "Personalized applicability notes are temporarily unavailable.",
        estimatedTimeToImpactDays: 30,
      })),
    section10_aiPhoneScript:
      `Hi, I'm calling about my recent application with ${lender.displayName}. I'd like to request reconsideration. ` +
      "I believe my full financial picture supports approval. Could you please review my application again or let me know what additional information would help? Thank you for your time.",
    section11_aiTimingRationale:
      lender.doubleDipRules ||
      "No specific timing guidance available for this lender.",
    section13_aiClosingNote:
      "Reach out to your CEG advisor with any questions about this playbook.",
  };
}

async function getAIPlaybookOutput(
  client: ClientProfile,
  lender: Omit<Lender, "products">,
  product: Product,
) {
  const { systemPrompt, userPrompt } = buildPlaybookPrompt({
    client,
    lender,
    product,
  });

  try {
    const result = await callReasoningModel({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxOutputTokens: 2200,
    });
    const jsonText = extractJsonBlock(result.rawText);
    const parsed = JSON.parse(jsonText);
    const validated = AIPlaybookReasoningOutputSchema.parse(parsed);

    if (
      !validateApprovalRangeWithinBand(
        validated.section4_aiPersonalizedRange,
        product.typicalApprovalRange,
      )
    ) {
      validated.section4_aiPersonalizedRange = product.typicalApprovalRange;
      validated.section4_confidenceLevel = "low";
    }

    return {
      output: validated,
      modelUsed: result.model,
      modelVersion: result.modelVersion,
      costUsd: result.estimatedCostUsd,
      degraded: false,
    };
  } catch (err) {
    console.error(
      "AI reasoning failed or failed validation — falling back to curated-only output.",
      err,
    );
    return {
      output: buildFallbackAIOutput(client, lender, product),
      modelUsed: getReasoningModelNameSafe(),
      modelVersion: "fallback",
      costUsd: 0,
      degraded: true,
    };
  }
}

function getReasoningModelNameSafe(): string {
  try {
    return getReasoningModelName();
  } catch {
    return "unknown";
  }
}

function assessRelationshipDepth(
  months: number,
  avgBalance?: number,
): "none" | "light" | "moderate" | "deep" {
  if (months <= 0) return "none";
  if (months < 6) return "light";
  if (months < 24 || (avgBalance ?? 0) < 5000) return "moderate";
  return "deep";
}

async function buildPlaybook(
  client: ClientProfile,
  lender: Omit<Lender, "products">,
  product: Product,
  branches: Branch[],
): Promise<Playbook> {
  const ai = await getAIPlaybookOutput(client, lender, product);

  const id = playbookId(client.id, lender.id, product.id);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + PLAYBOOK_TTL_HOURS * 60 * 60 * 1000,
  );

  const clientBureauReport =
    client.creditReports.find((r) => r.bureau === lender.primaryBureau) ?? null;
  const existingRelationship = client.existingLenderRelationships.find(
    (r) => r.lenderId === lender.id,
  );

  const dtiWithHousing = client.dti.dtiPct;
  const dtiWithoutHousing = client.dti.rentOrMortgageIsReported
    ? Math.max(
        0,
        ((client.dti.monthlyDebtPayments - client.dti.rentOrMortgageMonthly) /
          client.dti.monthlyGrossIncome) *
          100,
      )
    : client.dti.dtiPct;

  const playbook: Playbook = {
    meta: {
      id,
      clientId: client.id,
      lenderId: lender.id,
      productId: product.id,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      reasoningModel: ai.modelUsed,
      reasoningModelVersion: ai.modelVersion,
      generationCostUsdEstimate: ai.costUsd,
      dataSourceVersions: {
        clientUpdatedAt: client.updatedAt,
        lenderLastVerifiedAt: lender.lastVerifiedAt,
        productLastVerifiedAt: product.lastVerifiedAt,
      },
    },
    section1_bestMethod: {
      recommendedChannel: product.inBranchApplicationRecommended
        ? "in_branch"
        : "online",
      reasoning: product.inBranchApplicationRecommended
        ? "Curated data indicates in-branch applications perform better for this product."
        : "Curated data indicates the standard online application channel is sufficient for this product.",
      applicationUrl: product.applicationUrl,
      inBranchRecommended: !!product.inBranchApplicationRecommended,
      aiPersonalizedNote: ai.output.section1_aiPersonalizedNote,
    },
    section2_relationship: {
      hasExistingRelationship: !!existingRelationship,
      relationshipDetails: existingRelationship,
      relationshipDepthAssessment: existingRelationship
        ? assessRelationshipDepth(
            existingRelationship.accountAgeMonths,
            existingRelationship.averageBalance,
          )
        : "none",
      howRelationshipHelpsApproval:
        lender.bankingRelationshipRequirements.notes,
    },
    section3_bureauPull: {
      primaryBureau: lender.primaryBureau,
      secondaryBureau: lender.secondaryBureau,
      clientScoreOnPrimaryBureau: clientBureauReport?.score ?? null,
      bureauPullNotes: lender.bureauPullNotes,
      doubleDipFriendly: lender.doubleDipFriendly,
      doubleDipRules: lender.doubleDipRules,
    },
    section4_approvalEstimate: {
      lenderDocumentedRange: product.typicalApprovalRange,
      aiPersonalizedRange: ai.output.section4_aiPersonalizedRange,
      confidenceLevel: ai.output.section4_confidenceLevel,
      aiReasoning: ai.output.section4_aiReasoning,
      minFICORequired: product.minFICO,
      clientMeetsMinFICO: (clientBureauReport?.score ?? 0) >= product.minFICO,
    },
    section5_incomeStructuring: {
      currentStatedIncome: client.income.statedAnnualIncome,
      currentVerifiableIncome: client.income.verifiableAnnualIncome,
      aiRecommendedStatedIncome: ai.output.section5_aiRecommendedStatedIncome,
      aiReasoning: ai.output.section5_aiReasoning,
      regulationBNote: ai.output.section5_regulationBNote,
      householdIncomeEligible: !!ai.output.section5_regulationBNote,
    },
    section6_housingStructuring: {
      currentMonthlyHousingPayment: client.dti.rentOrMortgageMonthly,
      isReportedOnCreditReport: client.dti.rentOrMortgageIsReported,
      dtiImpactIfIncluded: Math.round(dtiWithHousing * 10) / 10,
      dtiImpactIfExcluded: Math.round(dtiWithoutHousing * 10) / 10,
      aiStructuringMath: ai.output.section6_aiStructuringMath,
      aiRecommendation: ai.output.section6_aiRecommendation,
    },
    section7_denialPathReasoning: {
      lenderCommonDenialReasons: lender.commonDenialReasons,
      productSpecificDenialReasons: product.denialReasons,
      aiClientSpecificRisks: ai.output.section7_aiClientSpecificRisks,
      aiMitigationSteps: ai.output.section7_aiMitigationSteps,
      reconsiderationSuccessRateForProduct: product.reconsiderationSuccessRate,
    },
    section8_cegRecommendations: {
      recommendations: ai.output.section8_recommendations.map((r) => ({
        service: r.service,
        rank: r.rank,
        curatedImpactEstimate:
          cegProductLiftFor(product.cegProductLift, r.service) ??
          "Impact estimate not documented for this product.",
        aiApplicability: r.aiApplicability,
        estimatedTimeToImpactDays: r.estimatedTimeToImpactDays,
      })),
    },
    section9_nearestBranches: {
      zip: client.zip,
      radiusMiles: 25,
      branches,
    },
    section10_reconsiderationScript: {
      reconsiderationPhone: lender.reconsiderationPhone,
      reconsiderationHours: lender.reconsiderationHours,
      reconsiderationTips: lender.reconsiderationTips,
      aiPhoneScript: ai.output.section10_aiPhoneScript,
    },
    section11_timingStrategy: {
      threeDayRuleNotes: lender.threeDayRuleNotes,
      recommendedSequencing: lender.doubleDipRules,
      aiTimingRationale: ai.output.section11_aiTimingRationale,
    },
    section12_alternatives: {
      alternatives: [],
    },
    section13_helpOptions: {
      cegSupportPhone: process.env.CEG_SUPPORT_PHONE ?? "1-800-555-0100",
      cegSupportEmail: process.env.CEG_SUPPORT_EMAIL ?? "support@cegunited.com",
      scheduleConsultUrl:
        process.env.CEG_CONSULT_URL ?? "https://cegunited.com/schedule",
      relevantLearningModules: [],
      aiClosingNote: ai.output.section13_aiClosingNote,
    },
  };

  return playbook;
}

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
    const { clientId, lenderId, productId } = parsedBody.data;

    await checkAndIncrementRateLimit(clientId, "generatePlaybook");

    const id = playbookId(clientId, lenderId, productId);
    const cached = await getCachedPlaybook(id);
    if (cached) {
      return NextResponse.json({ cached: true, playbook: cached });
    }

    const [client, lender, product] = await Promise.all([
      getClient(clientId),
      getLender(lenderId),
      getProduct(lenderId, productId),
    ]);

    let branches: Branch[] = [];
    try {
      branches = await findNearestBranches(
        lender.displayName,
        lender.placesSearchQuery,
        client.zip,
        25,
        5,
      );
    } catch (err) {
      console.warn(
        "Places lookup failed — continuing with empty branch list.",
        err,
      );
    }

    const playbook = await buildPlaybook(client, lender, product, branches);
    await cachePlaybook(playbook);

    return NextResponse.json({ cached: false, playbook });
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("generatePlaybook failed", err);
    return NextResponse.json(
      { error: "Internal error generating playbook." },
      { status: 500 },
    );
  }
}
