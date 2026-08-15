import type {
  Playbook,
  ClientProfile,
  Lender,
  Product,
  Branch,
  ApplicationChannel,
  BureauRiskTier,
  BureauInquiryInfo,
  OtherChannel,
  CegProductLift,
  ExistingLenderRelationship,
} from "@/types/funding-playbook";
import { AIPlaybookReasoningOutputSchema } from "./schemas";

/**
 * Normalizes raw n8n response into the flat AI reasoning output shape.
 * Handles nested `{ output: { ... } }`, arrays, and casing/enum misalignments.
 */
export function normalizeN8nOutput(raw: any): any {
  let candidate = Array.isArray(raw) ? raw[0] : raw;
  if (candidate && typeof candidate === "object" && "output" in candidate) {
    candidate = candidate.output;
  }
  if (candidate && typeof candidate === "object" && "playbook" in candidate) {
    candidate = candidate.playbook;
  }

  if (!candidate || typeof candidate !== "object") {
    return candidate;
  }

  const normalized = { ...candidate };

  // 1. Normalize section4_confidenceLevel casing
  if (typeof normalized.section4_confidenceLevel === "string") {
    const val = normalized.section4_confidenceLevel.toLowerCase();
    if (val === "high" || val === "medium" || val === "low") {
      normalized.section4_confidenceLevel = val;
    } else {
      normalized.section4_confidenceLevel = "medium";
    }
  } else if (!normalized.section4_confidenceLevel) {
    normalized.section4_confidenceLevel = "medium";
  }

  // 2. Normalize section4_topDrivers impact casing
  if (Array.isArray(normalized.section4_topDrivers)) {
    normalized.section4_topDrivers = normalized.section4_topDrivers.map(
      (driver: any) => {
        if (!driver || typeof driver !== "object") return driver;
        const impactStr = String(driver.impact || "").toLowerCase();
        let impact: "positive" | "negative" | "neutral" = "neutral";
        if (impactStr.includes("pos")) impact = "positive";
        else if (impactStr.includes("neg")) impact = "negative";

        return {
          ...driver,
          impact,
          weightPct: Math.round(Number(driver.weightPct) || 25),
        };
      },
    );
  }

  // 3. Normalize section1_otherChannels channels
  if (Array.isArray(normalized.section1_otherChannels)) {
    normalized.section1_otherChannels = normalized.section1_otherChannels.map(
      (oc: any) => {
        if (!oc || typeof oc !== "object") return oc;
        return {
          channel: normalizeChannelEnum(oc.channel),
          recommended: Boolean(oc.recommended),
          note: String(oc.note || ""),
        };
      },
    );
  }

  // 4. Normalize section8_recommendations service names
  if (Array.isArray(normalized.section8_recommendations)) {
    normalized.section8_recommendations =
      normalized.section8_recommendations.map((rec: any, idx: number) => {
        if (!rec || typeof rec !== "object") return rec;
        return {
          service: normalizeServiceEnum(rec.service),
          rank: Number(rec.rank) || idx + 1,
          aiApplicability: String(rec.aiApplicability || ""),
          estimatedTimeToImpactDays:
            Number(rec.estimatedTimeToImpactDays) || 30,
        };
      });
  }

  return normalized;
}

export function normalizeChannelEnum(channelInput: any): ApplicationChannel {
  if (typeof channelInput !== "string") return "online";
  const lower = channelInput.toLowerCase();
  if (lower.includes("branch")) return "in_branch";
  if (lower.includes("phone") || lower.includes("call")) return "phone";
  if (lower.includes("app") || lower.includes("mobile")) return "mobile_app";
  if (lower.includes("online") || lower.includes("web")) return "online";
  // Preserve original channel string (e.g. "Business Credit Cards", "SBA Loans", "CEG Credit Suite")
  return channelInput as ApplicationChannel;
}

export function normalizeServiceEnum(
  serviceInput: any,
): "tradelines" | "credit_repair" | "income_coaching" | "business_formation" {
  if (typeof serviceInput !== "string") return "credit_repair";
  const lower = serviceInput.toLowerCase();
  if (lower.includes("tradeline")) return "tradelines";
  if (lower.includes("income") || lower.includes("coach"))
    return "income_coaching";
  if (lower.includes("formation") || lower.includes("entity"))
    return "business_formation";
  if (
    lower.includes("credit") ||
    lower.includes("suite") ||
    lower.includes("repair")
  )
    return "credit_repair";
  return "credit_repair";
}

function cegProductLiftFor(
  lift: CegProductLift | undefined,
  service:
    | "tradelines"
    | "credit_repair"
    | "income_coaching"
    | "business_formation",
): string | undefined {
  if (!lift) return undefined;
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

export interface AssemblyInputs {
  aiOutput: any;
  client: ClientProfile;
  lender: Omit<Lender, "products">;
  product: Product;
  branches: Branch[];
}

/**
 * Assembles the nested Playbook object from normalized AI reasoning output
 * and deterministic Firestore data (Client, Lender, Product, Branches).
 */
export function assemblePlaybook(inputs: AssemblyInputs): Playbook {
  const { aiOutput, client, lender, product, branches } = inputs;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Derive recommended channel
  const recommendedChannel = product.inBranchApplicationRecommended
    ? "in_branch"
    : "online";

  // Match existing lender relationship
  const lenderNameLower = (lender.displayName || "").toLowerCase();
  const rel = Array.isArray(client.existingLenderRelationships)
    ? client.existingLenderRelationships.find(
        (r) =>
          r.lenderId === lender.id ||
          (r.lenderDisplayName &&
            r.lenderDisplayName.toLowerCase().includes(lenderNameLower)),
      )
    : undefined;

  // Bureau Inquiry count calculation
  const reports = Array.isArray(client.creditReports)
    ? client.creditReports
    : [];
  const primaryBureauName = (lender.primaryBureau || "experian").toLowerCase();

  const primaryReport = reports.find(
    (r) => (r.bureau || "").toLowerCase() === primaryBureauName,
  );

  const bureauInquiries: BureauInquiryInfo[] = [
    "experian",
    "equifax",
    "transunion",
  ].map((bureauKey) => {
    const rep = reports.find(
      (r) => (r.bureau || "").toLowerCase() === bureauKey,
    );
    const score = rep?.score || 0;
    const inq =
      (rep as any)?.recentInquiriesCountLast6Months ??
      rep?.inquiriesLast6Months ??
      0;
    let riskTier: BureauRiskTier = "optimal";
    let riskLabel = "0–3 inquiries (Optimal)";
    if (inq >= 7) {
      riskTier = "high-risk";
      riskLabel = `${inq} inquiries (High Risk)`;
    } else if (inq >= 4) {
      riskTier = "caution";
      riskLabel = `${inq} inquiries (Caution)`;
    }

    return {
      bureau: bureauKey as "experian" | "equifax" | "transunion",
      score: score > 0 ? score : null,
      inquiries6mo: inq,
      riskTier,
      riskLabel,
      isPrimary: bureauKey === primaryBureauName,
    };
  });

  const primaryInqObj = bureauInquiries.find((b) => b.isPrimary);
  const primaryInqCount = primaryInqObj?.inquiries6mo || 0;
  const primaryRiskTier = primaryInqObj?.riskTier || "optimal";
  const primaryRiskLabel =
    primaryInqObj?.riskLabel || "0–3 inquiries (Optimal)";

  const primaryScore =
    primaryReport?.score ||
    (client as any).creditScores?.[primaryBureauName] ||
    (client as any).ficoCreditScore ||
    0;

  const appUrl =
    product.applicationUrl ||
    lender.productPageBaseUrl ||
    "https://cegunited.com";

  // Stated vs Verifiable income
  const statedIncome =
    client.income?.statedAnnualIncome ||
    client.income?.householdIncome ||
    client.income?.verifiableAnnualIncome ||
    75000;
  const recommendedStated =
    aiOutput.section5_aiRecommendedStatedIncome || statedIncome;

  const bizRev =
    client.income?.businessAnnualRevenue ||
    client.income?.annualizedBusinessRunRate ||
    recommendedStated * 2;

  const housingPayment = client.dti?.rentOrMortgageMonthly ?? 1500;

  const playbook: Playbook = {
    meta: {
      id: `${client.id}_${lender.id}_${product.id}`,
      clientId: client.id,
      lenderId: lender.id,
      productId: product.id,
      lenderDisplayName: lender.displayName,
      productDisplayName: product.displayName,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      reasoningModel: "n8n-gemini-2.5-pro",
      dataSourceVersions: {
        clientUpdatedAt: client.updatedAt || now.toISOString(),
        lenderLastVerifiedAt: lender.lastVerifiedAt || now.toISOString(),
        productLastVerifiedAt: product.lastVerifiedAt || now.toISOString(),
      },
    },

    section1_bestMethod: {
      recommendedChannel,
      recommendedHeadline:
        aiOutput.section1_recommendedHeadline ||
        (recommendedChannel === "in_branch"
          ? "Apply in branch — a banker can strengthen your file before submitting"
          : "Apply online — you'll likely get a fast decision"),
      reasoning:
        aiOutput.section1_reasoning || "Optimized based on your profile.",
      applicationUrl: appUrl,
      inBranchRecommended: product.inBranchApplicationRecommended ?? false,
      aiPersonalizedNote: aiOutput.section1_aiPersonalizedNote || "",
      keyTakeaways: Array.isArray(aiOutput.section1_keyTakeaways)
        ? aiOutput.section1_keyTakeaways
        : [],
      otherChannels: Array.isArray(aiOutput.section1_otherChannels)
        ? aiOutput.section1_otherChannels
        : [],
      decisionSpeedNote:
        aiOutput.section1_decisionSpeedNote ||
        "Decisions typically take 1–3 business days.",
    },

    section2_relationship: {
      hasExistingRelationship: Boolean(rel),
      relationshipDetails: rel,
      relationshipDepthAssessment: rel ? "moderate" : "none",
      howRelationshipHelpsApproval:
        aiOutput.section2_whyThisMatters ||
        "Existing accounts help demonstrate banking history to underwriters.",
      lenderDisplayName: lender.displayName,
      yearsWithLender: rel?.accountAgeMonths
        ? Math.round(rel.accountAgeMonths / 12)
        : null,
      accounts: rel
        ? [
            {
              label: rel.relationshipType.replace("_", " ").toUpperCase(),
              detail: `Active ${rel.relationshipType} account`,
              openedYear: rel.accountAgeMonths
                ? now.getFullYear() - Math.round(rel.accountAgeMonths / 12)
                : null,
              balanceOrLimit: rel.averageBalance
                ? `$${rel.averageBalance.toLocaleString()} avg bal`
                : "Active",
            },
          ]
        : [],
      applicationUrlLabel: rel
        ? "Your pre-filled application link"
        : "Standard application link",
      whyThisMatters: aiOutput.section2_whyThisMatters || "",
    },

    section3_bureauPull: {
      primaryBureau: (lender.primaryBureau as any) || "experian",
      secondaryBureau: (lender.secondaryBureau as any) || null,
      clientScoreOnPrimaryBureau: primaryScore || null,
      bureauPullNotes: lender.bureauPullNotes || "Standard bureau pull.",
      doubleDipFriendly: lender.doubleDipFriendly ?? false,
      doubleDipRules: lender.doubleDipRules || "",
      bureauInquiries,
      primaryBureauInquiries: primaryInqCount,
      primaryRiskTier,
      primaryRiskLabel,
      favorable: primaryInqCount <= 3,
      ourRead: aiOutput.section3_ourRead || lender.bureauPullNotes || "",
    },

    section4_approvalEstimate: {
      lenderDocumentedRange: product.typicalApprovalRange || [5000, 50000],
      aiPersonalizedRange: Array.isArray(aiOutput.section4_aiPersonalizedRange)
        ? aiOutput.section4_aiPersonalizedRange
        : product.typicalApprovalRange || [5000, 50000],
      confidenceLevel: aiOutput.section4_confidenceLevel || "medium",
      confidencePct: aiOutput.section4_confidencePct ?? 65,
      aiReasoning: aiOutput.section4_aiReasoning || "",
      estimateNote: aiOutput.section4_estimateNote,
      topDrivers: Array.isArray(aiOutput.section4_topDrivers)
        ? aiOutput.section4_topDrivers
        : [],
      minFICORequired: product.minFICO || 680,
      clientMeetsMinFICO: primaryScore >= (product.minFICO || 680),
    },

    section5_incomeStructuring: {
      currentStatedIncome: statedIncome,
      currentVerifiableIncome: client.income?.verifiableAnnualIncome || 0,
      aiRecommendedStatedIncome: recommendedStated,
      aiReasoning: aiOutput.section5_aiReasoning || "",
      regulationBNote: aiOutput.section5_regulationBNote,
      householdIncomeEligible: true,
      businessRevenue: {
        annualBusinessRevenue: bizRev,
        trailing3MonthRevenue: Math.round(bizRev / 4),
        annualizedRunRate: bizRev,
        documentableFrom: "Business bank statements",
        reasoning:
          aiOutput.section5_businessRevenueReasoning ||
          "Report projected business revenue based on deposit run-rate.",
        fieldToEnter: bizRev,
      },
      personalHouseholdIncome: {
        householdTotal: recommendedStated,
        yourIncome: Math.round(recommendedStated * 0.7),
        additionalIncome: Math.round(recommendedStated * 0.3),
        additionalIncomeSourceLabel: "Spouse / Additional income",
        reasoning:
          aiOutput.section5_personalHouseholdReasoning ||
          "Report total household income as personal guarantor.",
        fieldToEnter: recommendedStated,
      },
      whatToEnterSummary: `$${bizRev.toLocaleString()} business revenue · $${recommendedStated.toLocaleString()} personal household income`,
    },

    section6_housingStructuring: {
      currentMonthlyHousingPayment: housingPayment,
      isReportedOnCreditReport: client.dti?.rentOrMortgageIsReported ?? false,
      dtiImpactIfIncluded: client.dti?.dtiPct || 28,
      dtiImpactIfExcluded: Math.max(0, (client.dti?.dtiPct || 28) - 10),
      aiStructuringMath: aiOutput.section6_aiStructuringMath || "",
      aiRecommendation: aiOutput.section6_aiRecommendation || "",
    },

    section7_denialPathReasoning: {
      lenderCommonDenialReasons: lender.commonDenialReasons || [],
      productSpecificDenialReasons: product.denialReasons || [],
      aiClientSpecificRisks: Array.isArray(
        aiOutput.section7_aiClientSpecificRisks,
      )
        ? aiOutput.section7_aiClientSpecificRisks
        : [],
      aiMitigationSteps: Array.isArray(aiOutput.section7_aiMitigationSteps)
        ? aiOutput.section7_aiMitigationSteps
        : [],
      reconsiderationSuccessRateForProduct:
        product.reconsiderationSuccessRate ?? 0.65,
    },

    section8_cegRecommendations: {
      recommendations: Array.isArray(aiOutput.section8_recommendations)
        ? aiOutput.section8_recommendations.map((r: any) => ({
            service: r.service,
            rank: r.rank,
            curatedImpactEstimate:
              cegProductLiftFor(product.cegProductLift, r.service) ??
              "High impact service for approval readiness.",
            aiApplicability: r.aiApplicability,
            estimatedTimeToImpactDays: r.estimatedTimeToImpactDays,
          }))
        : [],
    },

    section9_nearestBranches: {
      zip: client.zip || "32601",
      radiusMiles: 25,
      branches: branches || [],
    },

    section10_reconsiderationScript: {
      reconsiderationPhone: lender.reconsiderationPhone || "1-800-555-0100",
      reconsiderationHours:
        lender.reconsiderationHours || "Mon-Fri 8am-8pm EST",
      reconsiderationTips:
        lender.reconsiderationTips ||
        "Highlight total household income and length of credit history.",
      aiPhoneScript: aiOutput.section10_aiPhoneScript || "",
    },

    section11_timingStrategy: {
      threeDayRuleNotes: lender.threeDayRuleNotes,
      recommendedSequencing:
        lender.doubleDipRules || "Apply within 1-3 business days.",
      aiTimingRationale: aiOutput.section11_aiTimingRationale || "",
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
      aiClosingNote: aiOutput.section13_aiClosingNote || "",
    },
  };

  return playbook;
}
