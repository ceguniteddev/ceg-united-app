import { z } from "zod";

export const CegServiceEnum = z.enum([
  "tradelines",
  "credit_repair",
  "income_coaching",
  "business_formation",
]);

export const ConfidenceLevelEnum = z.enum(["low", "medium", "high"]);

export const AIPlaybookReasoningOutputSchema = z.object({
  section1_aiPersonalizedNote: z.string().min(1).max(600),

  section4_aiPersonalizedRange: z
    .tuple([z.number().nonnegative(), z.number().nonnegative()])
    .refine(([lo, hi]) => lo <= hi, { message: "range min must be <= max" }),
  section4_confidenceLevel: ConfidenceLevelEnum,
  section4_aiReasoning: z.string().min(1).max(800),

  section5_aiRecommendedStatedIncome: z.number().nonnegative(),
  section5_aiReasoning: z.string().min(1).max(800),
  section5_regulationBNote: z.string().max(500).optional(),

  section6_aiStructuringMath: z.string().min(1).max(800),
  section6_aiRecommendation: z.string().min(1).max(500),

  section7_aiClientSpecificRisks: z.array(z.string().min(1)).min(1).max(8),
  section7_aiMitigationSteps: z.array(z.string().min(1)).min(1).max(8),

  section8_recommendations: z
    .array(
      z.object({
        service: CegServiceEnum,
        rank: z.number().int().min(1),
        aiApplicability: z.string().min(1).max(500),
        estimatedTimeToImpactDays: z.number().int().nonnegative().max(365),
      }),
    )
    .min(0)
    .max(4),

  section10_aiPhoneScript: z.string().min(1).max(1200),
  section11_aiTimingRationale: z.string().min(1).max(600),
  section13_aiClosingNote: z.string().min(1).max(400),
});

export type AIPlaybookReasoningOutputParsed = z.infer<
  typeof AIPlaybookReasoningOutputSchema
>;

export const AIReconsiderationScriptOutputSchema = z.object({
  script: z
    .string()
    .min(1)
    .max(1000)
    .refine(
      (s) => {
        const sentenceCount = (s.match(/[.!?]+(\s|$)/g) ?? []).length;
        return sentenceCount >= 3 && sentenceCount <= 6;
      },
      { message: "script must be approximately 4 sentences" },
    ),
});

export type AIReconsiderationScriptOutputParsed = z.infer<
  typeof AIReconsiderationScriptOutputSchema
>;

export function validateApprovalRangeWithinBand(
  aiRange: [number, number],
  documentedRange: [number, number],
): boolean {
  const [docLo, docHi] = documentedRange;
  const bandLo = docLo * 0.7;
  const bandHi = docHi * 1.3;
  const [aiLo, aiHi] = aiRange;
  return aiLo >= bandLo && aiHi <= bandHi;
}

export const GeneratePlaybookRequestSchema = z.object({
  clientId: z.string().min(1),
  lenderId: z.string().min(1),
  productId: z.string().min(1),
});

export const NearestBranchesRequestSchema = z.object({
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "zip must be a valid US ZIP code"),
  lenderId: z.string().min(1),
  radiusMiles: z.number().positive().max(100).optional().default(25),
});

export const ReconsiderationScriptRequestSchema = z.object({
  clientId: z.string().min(1),
  lenderId: z.string().min(1),
  denialReason: z.string().min(1).max(300),
});

export const SavePlaybookFeedbackRequestSchema = z.object({
  playbookId: z.string().min(1),
  clientId: z.string().min(1),
  rating: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  notes: z.string().max(2000).optional(),
  sectionRatings: z.record(z.string(), z.number().min(1).max(5)).optional(),
  outcomeReported: z
    .enum(["approved", "denied", "not_yet_applied", "unknown"])
    .optional(),
  approvedAmount: z.number().nonnegative().optional(),
});
