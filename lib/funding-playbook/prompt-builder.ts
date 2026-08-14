import type { ClientProfile, Lender, Product } from "@/types/funding-playbook";

const SYSTEM_PROMPT_PLAYBOOK = `You are a funding-strategy reasoning assistant for CEG United, a credit and business-funding advisory firm.

You will be given CURATED LENDER DATA (researched and verified by CEG staff), CLIENT DATA (from CEG's client file), and INSTRUCTIONS describing exactly which fields to produce.

STRICT RULES — violating any of these makes your output unusable:
1. Do not invent lender policies, requirements, phone numbers, URLs, or approval criteria that are not present in the provided CURATED LENDER DATA. If information is not present, reason only from what's given plus general, well-known public knowledge about credit/lending mechanics (e.g. how utilization affects scores).
2. Do not make legal claims. The only legal reference you may make is citing Regulation B (12 CFR 1002.6(b)(8)) for household income consideration, and ONLY when the client's situation plausibly qualifies (e.g. married, shared household finances) — never assert it applies with certainty; frame it as "may allow" and recommend the client confirm eligibility.
3. Approval estimates MUST fall within the lender's documented typical approval range, expanded by at most ±30%. Never exceed this band regardless of how strong the client's profile looks.
4. Do not fabricate credit repair, tradeline, or income coaching outcomes beyond what is described in the curated "cegProductLift" data — you may explain applicability to this specific client, but the magnitude of impact must come from curated data.
5. Write in a direct, professional, encouraging tone. No hedging filler ("it's important to note that..."). No disclaimers beyond what's explicitly requested.
6. Return ONLY a single valid JSON object matching the exact schema described in the instructions. No markdown, no prose outside the JSON, no trailing commentary.
7. All numeric fields must be plain numbers (not strings, not formatted with $ or commas).`;

const SYSTEM_PROMPT_RECONSIDERATION = `You are a funding-strategy reasoning assistant for CEG United. You write short, personalized phone scripts clients can read nearly verbatim when calling a lender's credit reconsideration line after a denial.

STRICT RULES:
1. Do not invent lender policies not present in the provided data.
2. Do not make legal claims. Do not tell the client to lie, misstate income, or omit material facts.
3. The script must be exactly 4 sentences: (1) a polite opener stating purpose, (2) a concise, honest explanation addressing the specific denial reason, (3) one concrete compensating factor from the client's real profile, (4) a clear, courteous ask (reconsideration or specific accommodation).
4. Return ONLY a single valid JSON object: { "script": "..." }. No markdown, no extra keys.`;

function serializeClientForPrompt(
  client: ClientProfile,
  primaryBureau?: string,
) {
  const reports = Array.isArray(client.creditReports)
    ? client.creditReports
    : [];
  const primaryKey = (primaryBureau || "").toLowerCase().replace(/[^a-z]/g, "");
  const primaryReport =
    reports.find(
      (r) =>
        (r as any).bureau?.toLowerCase().replace(/[^a-z]/g, "") === primaryKey,
    ) ?? reports[0];

  const primaryFicoScore =
    primaryReport?.score ||
    (client as any).creditScores?.[primaryKey] ||
    (client as any).ficoCreditScore ||
    0;
  const primaryFicoBureau =
    primaryReport?.bureau || primaryBureau || "Experian";
  const ficoSource = primaryReport?.score ? "crs-report-data" : "user-leads";

  return {
    primaryFicoScore,
    primaryFicoBureau,
    ficoSource,
    zip: client.zip,
    state: client.state,
    fundingPath: client.fundingPath,
    fundingGoalAmount: client.fundingGoalAmount,
    creditReports: client.creditReports,
    income: client.income,
    dti: client.dti,
    existingLenderRelationships: client.existingLenderRelationships,
    cegServicesEnrolled: client.cegServicesEnrolled,
  };
}

function serializeLenderForPrompt(
  lender: Omit<Lender, "products">,
  product: Product,
) {
  return {
    lender: {
      id: lender.id,
      displayName: lender.displayName,
      type: lender.type,
      primaryBureau: lender.primaryBureau,
      secondaryBureau: lender.secondaryBureau,
      bureauPullNotes: lender.bureauPullNotes,
      doubleDipFriendly: lender.doubleDipFriendly,
      doubleDipRules: lender.doubleDipRules,
      bankingRelationshipRequirements: lender.bankingRelationshipRequirements,
      reconsiderationPhone: lender.reconsiderationPhone,
      reconsiderationHours: lender.reconsiderationHours,
      reconsiderationTips: lender.reconsiderationTips,
      commonDenialReasons: lender.commonDenialReasons,
      threeDayRuleNotes: lender.threeDayRuleNotes,
    },
    product: {
      id: product.id,
      displayName: product.displayName,
      productType: product.productType,
      typicalApprovalRange: product.typicalApprovalRange,
      minFICO: product.minFICO,
      idealFICO: product.idealFICO,
      denialReasons: product.denialReasons,
      reconsiderationSuccessRate: product.reconsiderationSuccessRate,
      structuringAdvice: product.structuringAdvice,
      cegProductLift: product.cegProductLift,
      inBranchApplicationRecommended: product.inBranchApplicationRecommended,
    },
  };
}

export interface PlaybookPromptInputs {
  client: ClientProfile;
  lender: Omit<Lender, "products">;
  product: Product;
}

export function buildPlaybookPrompt(inputs: PlaybookPromptInputs): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { client, lender, product } = inputs;

  const dataBlock = {
    CLIENT_DATA: serializeClientForPrompt(client, lender.primaryBureau),
    CURATED_LENDER_DATA: serializeLenderForPrompt(lender, product),
  };

  const userPrompt = `=== DATA (read-only, do not modify or contradict) ===
${JSON.stringify(dataBlock, null, 2)}

=== INSTRUCTIONS ===
Using ONLY the DATA above plus general public knowledge of lending mechanics, produce a single JSON object with EXACTLY these keys:

{
  "section1_aiPersonalizedNote": string (1-2 sentences, personalized note on WHY the recommended application channel suits this client),
  "section1_recommendedChannel": "online" | "phone" | "in_branch" | "mobile_app" (the single best channel for THIS client — favor in_branch only when CURATED_LENDER_DATA.product.inBranchApplicationRecommended is true or an existing relationship makes it clearly better),
  "section1_recommendedHeadline": string (short punchy headline for the recommended method, e.g. "Apply online — you'll likely get an instant decision" — reference the client's actual advantage),
  "section1_reasoning": string (2-3 sentences under a "Why this method" heading, explaining the underwriting behavior of THIS lender/product for THIS client's credit tier and relationship — cite real numbers where possible),
  "section1_keyTakeaways": string[] (3-4 concise, concrete bullet points supporting the recommendation — reference this client's FICO tier, relationship, offers, or best day/time to apply; 1-6 items),
  "section1_otherChannels": array of the NON-recommended channels the client could still use, each item: { "channel": "online"|"phone"|"in_branch"|"mobile_app", "recommended": boolean, "note": string (1-2 sentences on when/why to use or avoid this channel, referencing lender data like phone numbers or branch behavior) } (0-4 items, do NOT repeat section1_recommendedChannel),
  "section1_decisionSpeedNote": string (1 sentence on expected decision speed, e.g. "Instant decision in ~60 seconds, or 2-5 business days if referred to manual review"),
  "section2_whyThisMatters": string (2-3 sentences on why the client's existing relationship with this lender — or lack of one — matters for THIS application; if the client has existing accounts, explain how signing in pre-fills the application and how their tenure/relationship is visible to underwriting; if no relationship exists, explain that applying as a new customer is fine and how building a deposit relationship can boost future odds),
  "section3_ourRead": string (2-3 sentences comparing this client's inquiry counts across all three bureaus — cite the real numbers from CLIENT_DATA.creditReports — and explain whether the lender's primaryBureau works in the client's favor; advise on avoiding other applications that pull the same bureau in the 30 days before this one),
  "section4_aiPersonalizedRange": [number, number] (must anchor on CLIENT_DATA.primaryFicoScore tier and profile, within CURATED_LENDER_DATA.product.typicalApprovalRange expanded by at most ±30%),
  "section4_confidenceLevel": "low" | "medium" | "high",
  "section4_confidencePct": number (integer 0-100 representing confidence percentage, e.g. 82 for high confidence),
  "section4_aiReasoning": string (1-2 sentences explaining the estimate, referencing real numbers e.g. "Based on your 742 FICO, $145K household income... and lender typical approval band..."),
  "section4_estimateNote": string (1-2 sentences explaining product minimum starting limit, profile band cluster, and long tail conditions e.g. "Product has a $5,000 minimum starting limit. Approvals in your profile band cluster at $18K–$32K, with a long tail to $45K for applicants carrying 2+ seasoned business tradelines."),
  "section4_topDrivers": array of EXACTLY 3 objects driving this estimate, ordered by impact rank: [
    {
      "label": string (short punchy title, e.g. "742 FICO (Experian)" or "5-year Chase relationship + $18.9K avg business balance" or "Thin business credit file"),
      "detail": string (short status/assessment, e.g. "Very Good tier" or "Strong" or "Caps the high end"),
      "weightPct": number (integer 1-100 relative impact weight, total summing to ~100),
      "impact": "positive" | "negative" | "neutral" ("positive" for green status bar, "negative" for red status bar)
    }
  ],
  "section5_aiRecommendedStatedIncome": number (a specific dollar figure this client could honestly state, based on CLIENT_DATA.income),
  "section5_aiReasoning": string,
  "section5_regulationBNote": string (OPTIONAL — include guidance on Regulation B 12 CFR 1002.6(b)(8) permitting household income from spouse/partner for personal products),
  "section5_businessRevenueReasoning": string (OPTIONAL — concise 1-2 sentence explanation of business projected annual revenue based on trailing 3-month deposits x 4 run-rate),
  "section5_personalHouseholdReasoning": string (OPTIONAL — concise 1-2 sentence explanation of total household income combining personal verified/stated income plus spouse or additional income),
  "section6_aiStructuringMath": string (walk through exact numbers: rent/mortgage, DTI with and without it counted),
  "section6_aiRecommendation": string,
  "section7_aiClientSpecificRisks": string[] (which of the lender's/product's documented denial reasons actually apply to THIS client's profile, and why — 1-5 items),
  "section7_aiMitigationSteps": string[] (concrete pre-application steps, 1-5 items),
  "section8_recommendations": array of up to the client's enrolled cegServicesEnrolled plus any CEG service that would help, each item: { "service": "tradelines"|"credit_repair"|"income_coaching"|"business_formation", "rank": number, "aiApplicability": string, "estimatedTimeToImpactDays": number },
  "section10_aiPhoneScript": string (a 4-sentence phone script for a first-time application call, personalized),
  "section11_aiTimingRationale": string (1-3 sentences on best timing/sequencing, referencing threeDayRuleNotes or doubleDipRules if present),
  "section13_aiClosingNote": string (1-2 encouraging, specific sentences)
}

Return ONLY that JSON object. No markdown fences, no other text.`;

  return { systemPrompt: SYSTEM_PROMPT_PLAYBOOK, userPrompt };
}

export interface ReconsiderationPromptInputs {
  client: ClientProfile;
  lender: Omit<Lender, "products">;
  denialReason: string;
}

export function buildReconsiderationPrompt(
  inputs: ReconsiderationPromptInputs,
): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { client, lender, denialReason } = inputs;

  const dataBlock = {
    CLIENT_DATA: serializeClientForPrompt(client),
    CURATED_LENDER_DATA: {
      displayName: lender.displayName,
      reconsiderationPhone: lender.reconsiderationPhone,
      reconsiderationHours: lender.reconsiderationHours,
      reconsiderationTips: lender.reconsiderationTips,
      commonDenialReasons: lender.commonDenialReasons,
    },
    DENIAL_REASON_STATED_BY_LENDER: denialReason,
  };

  const userPrompt = `=== DATA (read-only) ===
${JSON.stringify(dataBlock, null, 2)}

=== INSTRUCTIONS ===
Write a 4-sentence phone script this client can read when calling ${lender.displayName}'s reconsideration line about the stated denial reason: "${denialReason}".
Use a real compensating factor from CLIENT_DATA (income, tenure, utilization, on-time history, existing relationship, etc). Return ONLY: { "script": "..." }`;

  return { systemPrompt: SYSTEM_PROMPT_RECONSIDERATION, userPrompt };
}
