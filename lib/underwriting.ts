// ============================================
// CEG Brain — Income-Based Funding — Underwriting Engine
// ============================================
// Pure, testable functions. No React, no Firebase imports.
// Plug in real bank data + bureau data and call calculateMaxFunding(input).

import type {
  RiskGrade,
  UnderwritingInput,
  UnderwritingResult,
} from "../types/income-funding-types";

/**
 * Grade a deal A / B / C / D based on cash-flow + credit health.
 *
 *  A: deposits>$30k AND avgBal>$10k AND nsfCount<=2 AND negativeDays<=2 AND credit>=680
 *  B: deposits>$15k AND nsfCount<=5 AND credit>=620
 *  C: deposits>$5k AND credit>=550
 *  D: everything else
 */
export function gradeRisk(input: UnderwritingInput): RiskGrade {
  const {
    monthlyDeposits,
    averageDailyBalance,
    negativeDays,
    nsfCount,
    creditScore,
  } = input;

  if (
    monthlyDeposits > 30000 &&
    averageDailyBalance > 10000 &&
    nsfCount <= 2 &&
    negativeDays <= 2 &&
    creditScore >= 680
  ) {
    return "A";
  }

  if (monthlyDeposits > 15000 && nsfCount <= 5 && creditScore >= 620) {
    return "B";
  }

  if (monthlyDeposits > 5000 && creditScore >= 550) {
    return "C";
  }

  return "D";
}

/**
 * Tier multipliers + rationale text.
 *  A: 5 × 75% × monthlyDeposits  → "Excellent" tier
 *  B: 5 × 50% × monthlyDeposits  → "Good"      tier
 *  C: 5 × 25% × monthlyDeposits  → "Fair"      tier
 *  D: 3 × 100% × monthlyDeposits → "Subprime"  tier (3-month coverage cap)
 */
export function calculateMaxFunding(
  input: UnderwritingInput,
): UnderwritingResult {
  const grade = gradeRisk(input);
  const { monthlyDeposits } = input;

  let baseMultiple: number;
  let percentage: number;
  let rationale: string;

  switch (grade) {
    case "A":
      baseMultiple = 5;
      percentage = 0.75;
      rationale =
        "Tier A — Excellent cash flow, healthy reserves, strong credit. Eligible for 5× deposits at 75% advance rate.";
      break;
    case "B":
      baseMultiple = 5;
      percentage = 0.5;
      rationale =
        "Tier B — Solid revenue with some risk markers. Eligible for 5× deposits at 50% advance rate.";
      break;
    case "C":
      baseMultiple = 5;
      percentage = 0.25;
      rationale =
        "Tier C — Fair cash flow or borderline credit. Eligible for 5× deposits at 25% advance rate.";
      break;
    case "D":
    default:
      baseMultiple = 3;
      percentage = 1;
      rationale =
        "Tier D — Subprime profile. Capped at 3× monthly deposits, subject to lender review.";
      break;
  }

  const multiplier = baseMultiple * percentage;
  const maxFundingAmount = Math.round(monthlyDeposits * multiplier);

  return {
    grade,
    maxFundingAmount,
    multiplier,
    baseMultiple,
    percentage,
    rationale,
  };
}

/**
 * Helper: format a USD amount with no decimals + commas.
 */
export function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/**
 * Helper: factor rate from funding + payback.
 */
export function factorRateOf(funding: number, payback: number): number {
  if (!funding) return 0;
  return Math.round((payback / funding) * 100) / 100;
}
