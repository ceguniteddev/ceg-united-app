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
  ExistingLenderRelationship,
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
  const range =
    product?.typicalApprovalRange &&
    Array.isArray(product.typicalApprovalRange) &&
    product.typicalApprovalRange.length >= 2
      ? product.typicalApprovalRange
      : ([5000, 50000] as [number, number]);
  const [lo, hi] = range;

  const denialReasons =
    product?.denialReasons && Array.isArray(product.denialReasons)
      ? product.denialReasons.slice(0, 3)
      : [
          "Inadequate credit history for requested limit",
          "High utilization on existing revolving accounts",
        ];

  const displayName = lender?.displayName || "Lender";

  const statedIncome = client?.income?.statedAnnualIncome ?? 75000;
  const housingPayment = client?.dti?.rentOrMortgageMonthly ?? 1500;
  const servicesEnrolled = Array.isArray(client?.cegServicesEnrolled)
    ? client.cegServicesEnrolled
    : ["tradelines", "credit_repair", "income_coaching"];

  const recommendedChannel: "online" | "in_branch" =
    product?.inBranchApplicationRecommended ? "in_branch" : "online";

  const otherChannels: {
    channel: "online" | "phone" | "in_branch" | "mobile_app";
    recommended: boolean;
    note: string;
  }[] =
    recommendedChannel === "in_branch"
      ? [
          {
            channel: "online",
            recommended: false,
            note: "The standard online application is available, but an in-branch banker can note your relationship on file before submitting.",
          },
          {
            channel: "phone",
            recommended: false,
            note: lender?.generalCustomerService
              ? `Call ${lender.generalCustomerService} only if the online application errors out or asks you to call.`
              : "Use the phone channel only if the online application errors out or asks you to call.",
          },
        ]
      : [
          {
            channel: "in_branch",
            recommended: false,
            note: "Only worth it if you want a banker to note your relationship on file before applying — ask them to submit while you sit with them.",
          },
          {
            channel: "phone",
            recommended: false,
            note: lender?.generalCustomerService
              ? `Call ${lender.generalCustomerService} only if the online application errors out or asks you to call.`
              : "Use the phone channel only if the online application errors out or asks you to call.",
          },
        ];

  return {
    section1_aiPersonalizedNote:
      "Personalized guidance is temporarily unavailable — the curated recommendation above still applies.",
    section1_recommendedChannel: recommendedChannel,
    section1_recommendedHeadline:
      recommendedChannel === "in_branch"
        ? "Apply in branch — a banker can strengthen your file before submitting"
        : "Apply online — you'll likely get a fast decision",
    section1_reasoning:
      recommendedChannel === "in_branch"
        ? `${displayName}'s curated data indicates in-branch applications perform better for this product. A banker can review your file and note your relationship before submitting.`
        : `${displayName}'s curated data indicates the standard online application channel is sufficient for this product and typically returns the fastest decision.`,
    section1_keyTakeaways: [
      "This recommendation is based on the lender's documented application behavior for this product.",
      "Apply on a weekday morning (Tue–Thu) so any manual review is picked up the same day.",
      "Have your income and identity details ready to reduce manual review triggers.",
    ],
    section1_otherChannels: otherChannels,
    section1_decisionSpeedNote:
      "Decision timing varies — many applications receive an instant decision, or 2–5 business days if referred to manual review.",
    section2_whyThisMatters:
      client?.existingLenderRelationships &&
      client.existingLenderRelationships.length > 0
        ? `Sign in to ${displayName} first — your application will pre-fill from your existing profile and your relationship is visible to underwriting. Applications submitted while signed in show a measurably higher approval rate than cold public applications.`
        : `You're applying to ${displayName} as a new customer, which is completely fine. Building a checking or deposit relationship over time can boost your approval odds on future applications.`,
    section3_ourRead:
      "This lender pulls the bureau shown above. To keep your file clean, avoid applying for other credit that pulls the same bureau in the 30 days before this application.",
    section4_aiPersonalizedRange: [lo, hi],
    section4_confidenceLevel: "low",
    section4_aiReasoning:
      "This is the lender's documented approval range. Personalized narrowing based on your profile is temporarily unavailable.",
    section5_aiRecommendedStatedIncome: statedIncome,
    section5_aiReasoning:
      "Using your most recently recorded stated income; personalized guidance is temporarily unavailable.",
    section6_aiStructuringMath: `Your reported monthly housing payment is $${housingPayment}. Detailed structuring math is temporarily unavailable.`,
    section6_aiRecommendation:
      "Review your DTI with a CEG advisor before applying.",
    section7_aiClientSpecificRisks: denialReasons,
    section7_aiMitigationSteps: [
      "Speak with a CEG advisor before applying to address any risk factors above.",
    ],
    section8_recommendations: servicesEnrolled
      .slice(0, 3)
      .map((service, i) => ({
        service: service as
          | "tradelines"
          | "credit_repair"
          | "income_coaching"
          | "business_formation",
        rank: i + 1,
        aiApplicability:
          "Personalized applicability notes are temporarily unavailable.",
        estimatedTimeToImpactDays: 30,
      })),
    section10_aiPhoneScript:
      `Hi, I'm calling about my recent application with ${displayName}. I'd like to request reconsideration. ` +
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

const RELATIONSHIP_TYPE_LABEL: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  loan: "Loan",
  business_banking: "Business Banking",
};

function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

/** Build display-ready account cards from a client's relationships with a lender. */
function buildRelationshipAccounts(
  relationships: ExistingLenderRelationship[],
): {
  label: string;
  detail: string;
  openedYear: number | null;
  balanceOrLimit: string;
}[] {
  const now = new Date();
  return relationships.map((rel) => {
    const typeLabel =
      RELATIONSHIP_TYPE_LABEL[rel.relationshipType] ?? rel.relationshipType;
    const openedYear =
      rel.accountAgeMonths > 0
        ? now.getFullYear() - Math.floor(rel.accountAgeMonths / 12)
        : null;

    const isRevolving = rel.relationshipType === "credit_card";
    const balanceOrLimit =
      rel.averageBalance && rel.averageBalance > 0
        ? isRevolving
          ? `${formatCurrency(rel.averageBalance)} limit`
          : `${formatCurrency(rel.averageBalance)} avg balance`
        : "Active";

    return {
      label: `${rel.lenderDisplayName} ${typeLabel}`,
      detail: isRevolving ? "personal, never late" : typeLabel,
      openedYear,
      balanceOrLimit,
    };
  });
}

const BUREAU_DISPLAY: Record<string, "experian" | "equifax" | "transunion"> = {
  experian: "experian",
  equifax: "equifax",
  transunion: "transunion",
};

function normalizeBureauKey(
  bureau: string,
): "experian" | "equifax" | "transunion" {
  const key = (bureau || "").toLowerCase().replace(/[^a-z]/g, "");
  return BUREAU_DISPLAY[key] ?? "experian";
}

function inquiryRiskTier(count: number): "optimal" | "caution" | "high-risk" {
  if (count <= 3) return "optimal";
  if (count <= 6) return "caution";
  return "high-risk";
}

function inquiryRiskLabel(tier: "optimal" | "caution" | "high-risk"): string {
  if (tier === "optimal") return "Optimal";
  if (tier === "caution") return "Caution";
  return "High risk";
}

/** Read a credit report's 6-month inquiry count regardless of field naming. */
function reportInquiries6mo(report: any): number {
  return Number(
    report?.recentInquiriesCountLast6Months ??
      report?.inquiriesLast6Months ??
      0,
  );
}

/** Build the per-bureau inquiry breakdown for section 3. */
function buildBureauInquiries(
  client: ClientProfile,
  primaryBureau: string,
): {
  bureauInquiries: {
    bureau: "experian" | "equifax" | "transunion";
    score: number | null;
    inquiries6mo: number;
    riskTier: "optimal" | "caution" | "high-risk";
    riskLabel: string;
    isPrimary: boolean;
  }[];
  primaryInfo: {
    inquiries: number;
    tier: "optimal" | "caution" | "high-risk";
    label: string;
    score: number | null;
  };
} {
  const primaryKey = normalizeBureauKey(primaryBureau);
  const order: ("experian" | "equifax" | "transunion")[] = [
    "experian",
    "equifax",
    "transunion",
  ];

  const reports = Array.isArray(client?.creditReports)
    ? client.creditReports
    : [];

  const bureauInquiries = order.map((bureauKey) => {
    const report = reports.find(
      (r) => normalizeBureauKey((r as any).bureau) === bureauKey,
    );
    const inquiries6mo = report ? reportInquiries6mo(report) : 0;
    const score =
      report && typeof (report as any).score === "number"
        ? (report as any).score
        : null;
    const riskTier = inquiryRiskTier(inquiries6mo);
    return {
      bureau: bureauKey,
      score,
      inquiries6mo,
      riskTier,
      riskLabel: inquiryRiskLabel(riskTier),
      isPrimary: bureauKey === primaryKey,
    };
  });

  const primary =
    bureauInquiries.find((b) => b.isPrimary) ?? bureauInquiries[0];

  return {
    bureauInquiries,
    primaryInfo: {
      inquiries: primary.inquiries6mo,
      tier: primary.riskTier,
      label: primary.riskLabel,
      score: primary.score,
    },
  };
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
    client?.creditReports?.find(
      (r) =>
        normalizeBureauKey((r as any).bureau) ===
        normalizeBureauKey(lender.primaryBureau),
    ) ?? null;

  const bureauData = buildBureauInquiries(client, lender.primaryBureau);
  const lenderRelationships =
    client?.existingLenderRelationships?.filter(
      (r) => r.lenderId === lender.id,
    ) ?? [];
  const existingRelationship = lenderRelationships[0];
  const lenderDisplayName =
    lender.displayName || (lender as any).bankName || lender.id;
  const maxAccountAgeMonths = lenderRelationships.reduce(
    (max, r) => Math.max(max, r.accountAgeMonths || 0),
    0,
  );
  const yearsWithLender =
    maxAccountAgeMonths > 0 ? Math.floor(maxAccountAgeMonths / 12) : null;

  const dtiWithHousing =
    client?.dti?.dtiPct ?? (client?.dti as any)?.dtiRatioPercent ?? 25;
  const rentOrMortgageMonthly = client?.dti?.rentOrMortgageMonthly ?? 1500;
  const monthlyDebtPayments =
    client?.dti?.monthlyDebtPayments ??
    (client?.dti as any)?.totalMonthlyDebtService ??
    1700;
  const monthlyGrossIncome = client?.dti?.monthlyGrossIncome ?? 6250;

  const dtiWithoutHousing = client?.dti?.rentOrMortgageIsReported
    ? Math.max(
        0,
        ((monthlyDebtPayments - rentOrMortgageMonthly) /
          (monthlyGrossIncome || 1)) *
          100,
      )
    : dtiWithHousing;

  const playbook: Playbook = {
    meta: {
      id,
      clientId: client.id,
      lenderId: lender.id,
      productId: product.id,
      lenderDisplayName:
        lender.displayName || (lender as any).bankName || lender.id,
      productDisplayName:
        product.displayName ||
        (product as any).products?.[0]?.productName ||
        product.id,
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
      recommendedChannel:
        ai.output.section1_recommendedChannel ??
        (product.inBranchApplicationRecommended ? "in_branch" : "online"),
      recommendedHeadline: ai.output.section1_recommendedHeadline,
      reasoning:
        ai.output.section1_reasoning ||
        (product.inBranchApplicationRecommended
          ? "Curated data indicates in-branch applications perform better for this product."
          : "Curated data indicates the standard online application channel is sufficient for this product."),
      applicationUrl: product.applicationUrl,
      inBranchRecommended: !!product.inBranchApplicationRecommended,
      aiPersonalizedNote: ai.output.section1_aiPersonalizedNote,
      keyTakeaways: ai.output.section1_keyTakeaways ?? [],
      otherChannels: ai.output.section1_otherChannels ?? [],
      decisionSpeedNote: ai.output.section1_decisionSpeedNote,
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
        lender?.bankingRelationshipRequirements?.notes ??
        "No prior banking relationship required.",
      lenderDisplayName,
      yearsWithLender,
      accounts: buildRelationshipAccounts(lenderRelationships),
      applicationUrlLabel: existingRelationship
        ? `Open your pre-filled ${lenderDisplayName} application`
        : `Open the ${lenderDisplayName} application`,
      whyThisMatters: ai.output.section2_whyThisMatters,
    },
    section3_bureauPull: {
      primaryBureau: lender.primaryBureau,
      secondaryBureau: lender.secondaryBureau,
      clientScoreOnPrimaryBureau: clientBureauReport?.score ?? null,
      bureauPullNotes: lender.bureauPullNotes,
      doubleDipFriendly: lender.doubleDipFriendly,
      doubleDipRules: lender.doubleDipRules,
      bureauInquiries: bureauData.bureauInquiries,
      primaryBureauInquiries: bureauData.primaryInfo.inquiries,
      primaryRiskTier: bureauData.primaryInfo.tier,
      primaryRiskLabel: bureauData.primaryInfo.label,
      favorable: bureauData.primaryInfo.tier === "optimal",
      ourRead: ai.output.section3_ourRead,
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

    const cacheId = playbookId(clientId, lenderId, productId);
    const cached = await getCachedPlaybook(cacheId);
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
        lender.displayName || (lender as any).bankName || "Lender",
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
