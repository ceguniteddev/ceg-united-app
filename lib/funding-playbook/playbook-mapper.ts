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
          serviceLabel:
            typeof rec.service === "string" ? rec.service : undefined,
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
  allLenderProducts?: Product[];
}

/**
 * Assembles the nested Playbook object from normalized AI reasoning output
 * and deterministic Firestore data (Client, Lender, Product, Branches).
 */
export function assemblePlaybook(inputs: AssemblyInputs): Playbook {
  const { aiOutput, client, lender, product, branches, allLenderProducts } =
    inputs;

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

  // Build double-dip section by merging listProducts with AI decisions
  const allProducts =
    allLenderProducts && allLenderProducts.length > 0
      ? allLenderProducts
      : [product];

  const aiDdProducts = Array.isArray(aiOutput.section8dd_products)
    ? aiOutput.section8dd_products
    : [];

  const doubleDipProducts = allProducts.map((p) => {
    const aiProduct = aiDdProducts.find(
      (a: any) =>
        a.productId === p.id ||
        (a.displayName &&
          a.displayName.toLowerCase().includes(p.displayName.toLowerCase())),
    );

    const [lo, hi] = p.typicalApprovalRange || [5000, 25000];

    return {
      productId: p.id,
      displayName: p.displayName,
      note:
        aiProduct?.note ||
        p.structuringAdvice ||
        "Product option for double-dip sequence.",
      bundleRecommended: aiProduct?.bundleRecommended ?? true,
      estLimitLow: aiProduct?.estLimitLow ?? lo,
      estLimitHigh: aiProduct?.estLimitHigh ?? hi,
    };
  });

  const section8_doubleDip = {
    friendly: aiOutput.section8dd_friendly ?? lender.doubleDipFriendly ?? true,
    intro:
      aiOutput.section8dd_intro ||
      lender.doubleDipRules ||
      `${lender.displayName} processes multiple applications submitted on the same day against a single credit pull.`,
    combinedExposureLow:
      aiOutput.section8dd_combinedExposureLow ??
      doubleDipProducts.reduce((sum, p) => sum + (p.estLimitLow || 0), 0),
    combinedExposureHigh:
      aiOutput.section8dd_combinedExposureHigh ??
      doubleDipProducts.reduce((sum, p) => sum + (p.estLimitHigh || 0), 0),
    howToRunSequence:
      aiOutput.section8dd_howToRunSequence ||
      `Submit your primary ${product.displayName} application first and let it decision. Immediately after, in the same browser session, submit the second application. Do not wait more than a few hours — a fresh session can trigger a second pull.`,
    products: doubleDipProducts,
  };

  const cleanFirstName = (() => {
    const raw = client.fullName?.trim();
    if (!raw) return "Client";
    if (/^[a-zA-Z0-9_-]{15,}$/.test(raw) && !raw.includes(" ")) return "Client";
    const first = raw.split(" ")[0];
    if (/^[a-zA-Z0-9_-]{15,}$/.test(first)) return "Client";
    return first || "Client";
  })();

  const formatBranchDisplayName = () => {
    const lenderName = lender.displayName || "Lender";
    const branch = branches?.[0];
    if (!branch?.name) return `${lenderName} — Local Branch`;

    // Deduplicate if branch name already starts with or contains lender name
    const branchNameLower = branch.name.toLowerCase();
    const lenderNameLower = lenderName.toLowerCase();

    let displayName = branch.name;
    if (!branchNameLower.includes(lenderNameLower)) {
      displayName = `${lenderName} — ${branch.name}`;
    }

    if (branch.address) {
      displayName += `, ${branch.address}`;
    }
    return displayName;
  };

  const playbook: Playbook = {
    meta: {
      id: `${client.id}_${lender.id}_${product.id}`,
      clientId: client.id,
      clientName: cleanFirstName,
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
            serviceLabel: r.serviceLabel,
            rank: r.rank,
            curatedImpactEstimate:
              cegProductLiftFor(product.cegProductLift, r.service) ??
              `+${r.rank === 1 ? 40 : r.rank === 2 ? 25 : 15} pts / lift`,
            aiApplicability: r.aiApplicability,
            estimatedTimeToImpactDays: r.estimatedTimeToImpactDays,
          }))
        : [],
    },

    section8_doubleDip,

    section9_nearestBranches: {
      zip: client.zip || "32601",
      radiusMiles: 25,
      branches: branches || [],
    },

    booking: {
      available: true,
      primaryPhone:
        branches?.[0]?.phone || lender.reconsiderationPhone || "3523751161",
      primaryPhoneLabel:
        branches?.[0]?.phone || lender.reconsiderationPhone || "(352) 375-1161",
      branchName: formatBranchDisplayName(),
      onlineSchedulerUrl: branches?.[0]?.googleMapsUrl || null,
      onlineSchedulerLabel: `Book with a ${lender.displayName || "Lender"} business banker`,
      bestTimeToCall:
        "Tuesday–Thursday, 10:00am–11:30am — lowest branch call volume",
      callScript: [
        `Hi, my name is ${cleanFirstName} — I've banked with ${lender.displayName || "Lender"} and want to discuss account options for my business.`,
        `I'd like to book 20 minutes with a business banker this week to review the ${product.displayName || "business card"} before I submit my application.`,
        `If the banker has any availability Tuesday through Thursday morning, that works best for me — and could you note on my profile that I came in through the business side?`,
      ],
      scriptGoal:
        "Goal of the call: get 20 minutes on the calendar with a business banker, not a general teller, and have them note your relationship before you apply.",
      unavailableNote: null,
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

    improvers: (Array.isArray(aiOutput.section8_recommendations)
      ? aiOutput.section8_recommendations
      : []
    ).map((r: any, idx: number) => {
      const serviceName =
        r.serviceLabel || (r.service ? r.service.replace("_", " ") : "Service");
      const serviceType = r.service || "credit_repair";

      let icon: "tradeline" | "repair" | "income" | "mentor" = "repair";
      if (serviceType === "tradelines") icon = "tradeline";
      else if (serviceType === "income_coaching") icon = "income";
      else if (serviceType === "business_formation") icon = "mentor";

      return {
        rank: r.rank || idx + 1,
        title: `${serviceName} Strategy`,
        cegProduct: `CEG ${serviceName}`,
        description: r.aiApplicability || "Recommended optimization strategy.",
        impactScore:
          cegProductLiftFor(product.cegProductLift, serviceType) ??
          `+${r.rank === 1 ? 40 : 25} pts`,
        impactApproval: `+${r.rank === 1 ? 35 : 20}% odds`,
        timeline: `${r.estimatedTimeToImpactDays || 30} days`,
        investment: "Program Service",
        ctaLabel: `Explore ${serviceName}`,
        href: "https://cegunited.com",
        icon,
      };
    }),

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
