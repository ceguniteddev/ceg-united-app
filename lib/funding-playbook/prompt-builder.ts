import type { ClientProfile, Lender } from "@/types/funding-playbook";

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
