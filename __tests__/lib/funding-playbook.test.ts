import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: vi.fn(),
  authenticationAdmin: vi.fn(),
  initFirebase: vi.fn(),
}));

import {
  GeneratePlaybookRequestSchema,
  NearestBranchesRequestSchema,
  ReconsiderationScriptRequestSchema,
  SavePlaybookFeedbackRequestSchema,
  AIPlaybookReasoningOutputSchema,
  validateApprovalRangeWithinBand,
} from "@/lib/funding-playbook/schemas";

describe("Funding Playbook Schemas & Validation", () => {
  it("validates GeneratePlaybookRequestSchema correctly", () => {
    const valid = {
      clientId: "client_123",
      lenderId: "chase",
      productId: "ink-business-preferred",
    };
    expect(GeneratePlaybookRequestSchema.safeParse(valid).success).toBe(true);

    const invalid = { clientId: "" };
    expect(GeneratePlaybookRequestSchema.safeParse(invalid).success).toBe(
      false,
    );
  });

  it("validates NearestBranchesRequestSchema correctly", () => {
    const valid = {
      zip: "32601",
      lenderId: "chase",
      radiusMiles: 25,
    };
    expect(NearestBranchesRequestSchema.safeParse(valid).success).toBe(true);

    const invalidZip = { zip: "123", lenderId: "chase" };
    expect(NearestBranchesRequestSchema.safeParse(invalidZip).success).toBe(
      false,
    );
  });

  it("validates ReconsiderationScriptRequestSchema correctly", () => {
    const valid = {
      clientId: "client_123",
      lenderId: "chase",
      denialReason: "too many recent inquiries",
    };
    expect(ReconsiderationScriptRequestSchema.safeParse(valid).success).toBe(
      true,
    );
  });

  it("validates SavePlaybookFeedbackRequestSchema correctly", () => {
    const valid = {
      playbookId: "client_123_chase_ink-business-preferred",
      clientId: "client_123",
      rating: 5,
      notes: "Worked great!",
    };
    expect(SavePlaybookFeedbackRequestSchema.safeParse(valid).success).toBe(
      true,
    );
  });

  it("enforces approval range band clamping logic (±30%)", () => {
    const documentedBand: [number, number] = [10000, 50000];

    // Valid range within band [7000, 65000]
    expect(
      validateApprovalRangeWithinBand([12000, 45000], documentedBand),
    ).toBe(true);

    // Invalid range below lower bound (< 7000)
    expect(validateApprovalRangeWithinBand([5000, 45000], documentedBand)).toBe(
      false,
    );

    // Invalid range above upper bound (> 65000)
    expect(
      validateApprovalRangeWithinBand([12000, 70000], documentedBand),
    ).toBe(false);
  });

  it("validates AIPlaybookReasoningOutputSchema with Section 4 enriched fields", () => {
    const validOutput = {
      section1_aiPersonalizedNote: "Note",
      section1_recommendedChannel: "online",
      section1_recommendedHeadline: "Headline",
      section1_reasoning: "Reasoning",
      section1_keyTakeaways: ["Takeaway 1"],
      section1_otherChannels: [],
      section1_decisionSpeedNote: "Speed note",
      section2_whyThisMatters: "Why it matters",
      section3_ourRead: "Our read",
      section4_aiPersonalizedRange: [18000, 32000],
      section4_confidenceLevel: "high",
      section4_confidencePct: 82,
      section4_aiReasoning: "Based on 742 FICO...",
      section4_estimateNote: "Product starting limit $5,000...",
      section4_topDrivers: [
        {
          label: "742 FICO (Experian)",
          detail: "Very Good tier",
          weightPct: 38,
          impact: "positive",
        },
        {
          label: "5-year relationship",
          detail: "Strong",
          weightPct: 31,
          impact: "positive",
        },
        {
          label: "Thin credit file",
          detail: "Caps the high end",
          weightPct: 19,
          impact: "negative",
        },
      ],
      section5_aiRecommendedStatedIncome: 145000,
      section5_aiReasoning: "Reasoning",
      section6_aiStructuringMath: "Math",
      section6_aiRecommendation: "Recommendation",
      section7_aiClientSpecificRisks: ["Risk 1"],
      section7_aiMitigationSteps: ["Step 1"],
      section8_recommendations: [],
      section10_aiPhoneScript: "Script",
      section11_aiTimingRationale: "Rationale",
      section13_aiClosingNote: "Closing",
    };

    expect(AIPlaybookReasoningOutputSchema.safeParse(validOutput).success).toBe(
      true,
    );
  });
});
