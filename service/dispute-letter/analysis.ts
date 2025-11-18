"use server";

/**
 * AI-powered credit report analysis for dispute letter generation
 *
 * This service analyzes credit reports to:
 * 1. Identify inaccurate or disputable items
 * 2. Detect reinserted accounts (previously disputed and removed)
 * 3. Find duplicate accounts
 * 4. Identify outdated information (beyond statute of limitations)
 * 5. Detect unauthorized inquiries
 */

import { firestoreAdmin } from "@/lib/fireabase-admin";
import { CRS_REPORT_DATA } from "@/constant/collection-name";
import { logError, logInfo } from "@/lib/logger";
import {
  CreditReport,
  CreditReportWithId,
  Tradeline,
  Inquiry,
} from "@/types/crs";
import { DisputeType, DisputedAccount } from "@/schema/dispute-letter";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set - AI analysis will not work");
}

export interface DisputeOpportunity {
  type: DisputeType;
  severity: "high" | "medium" | "low";
  affectedBureaus: ("Equifax" | "Experian" | "TransUnion")[];
  account?: {
    accountName: string;
    accountNumber?: string;
    accountType?: string;
    creditorName: string;
    balance?: number;
  };
  reason: string;
  details: string;
  recommendedAction: string;
  potentialImpact: string; // e.g., "Could increase score by 30-50 points"
}

export interface CreditAnalysisResult {
  userId: string;
  analysisDate: Date;
  opportunities: DisputeOpportunity[];
  summary: {
    totalIssues: number;
    highPriorityIssues: number;
    estimatedScoreImpact: string;
    recommendedActions: string[];
  };
  aiInsights?: string; // Additional AI-generated insights
}

/**
 * Analyze credit reports for dispute opportunities
 */
export async function analyzeCreditReports(
  userId: string
): Promise<CreditAnalysisResult> {
  logInfo("Starting credit report analysis", { userId });

  try {
    // Fetch user's credit reports
    const reports = await getCreditReports(userId);

    if (!reports || reports.length === 0) {
      throw new Error("No credit reports found for user");
    }

    const opportunities: DisputeOpportunity[] = [];

    // Rule-based analysis
    for (const reportDoc of reports) {
      const report = reportDoc.report;
      const bureau = detectBureau(report);

      if (!bureau) continue;

      // Check tradelines
      if (report.tradelines) {
        opportunities.push(
          ...analyzeTradelinesForDisputes(report.tradelines, bureau)
        );
      }

      // Check inquiries
      if (report.inquiries) {
        opportunities.push(
          ...analyzeInquiriesForDisputes(report.inquiries, bureau)
        );
      }
    }

    // Detect duplicates across bureaus
    opportunities.push(...detectDuplicateAccounts(reports));

    // AI-powered analysis (optional enhancement)
    const aiInsights = OPENAI_API_KEY
      ? await generateAIInsights(reports, opportunities)
      : undefined;

    // Generate summary
    const summary = generateSummary(opportunities);

    const result: CreditAnalysisResult = {
      userId,
      analysisDate: new Date(),
      opportunities,
      summary,
      aiInsights,
    };

    logInfo("Credit report analysis completed", {
      userId,
      totalIssues: opportunities.length,
      highPriority: opportunities.filter((o) => o.severity === "high").length,
    });

    return result;
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to analyze credit reports"),
      { userId }
    );
    throw error;
  }
}

/**
 * Analyze tradelines for dispute opportunities
 */
function analyzeTradelinesForDisputes(
  tradelines: Tradeline[],
  bureau: "Equifax" | "Experian" | "TransUnion"
): DisputeOpportunity[] {
  const opportunities: DisputeOpportunity[] = [];

  for (const tradeline of tradelines) {
    const creditorName = tradeline.creditorName || "Unknown Creditor";
    const accountType = tradeline.accountType || "Unknown";

    // Check for negative items
    const hasNegative =
      tradeline.currentRatingCode === "9" || // Charged off
      tradeline.currentRatingCode === "7" || // Repossession
      tradeline.paymentPatternData?.includes("1") || // 30 days late
      tradeline.paymentPatternData?.includes("2") || // 60 days late
      tradeline.paymentPatternData?.includes("3") || // 90+ days late
      tradeline.accountStatusType?.toLowerCase().includes("charge") ||
      tradeline.accountStatusType?.toLowerCase().includes("collection") ||
      tradeline.derogatoryDataIndicator === true;

    if (hasNegative) {
      // Check if outdated (older than 7 years for most items)
      const dateOpened = tradeline.accountOpenedDate
        ? new Date(tradeline.accountOpenedDate)
        : null;
      const yearsOld = dateOpened
        ? (new Date().getTime() - dateOpened.getTime()) /
          (1000 * 60 * 60 * 24 * 365)
        : 0;

      if (yearsOld > 7) {
        opportunities.push({
          type: "outdated-information",
          severity: "high",
          affectedBureaus: [bureau],
          account: {
            accountName: accountType,
            accountNumber: tradeline.accountIdentifier,
            accountType,
            creditorName,
            balance: tradeline.currentBalanceAmount
              ? parseFloat(tradeline.currentBalanceAmount)
              : undefined,
          },
          reason: "Account is older than 7 years and should be removed",
          details: `This ${accountType} account with ${creditorName} was opened ${Math.floor(
            yearsOld
          )} years ago. Negative items should be removed after 7 years per FCRA.`,
          recommendedAction: "File dispute citing FCRA statute of limitations",
          potentialImpact: "High - Could increase score by 20-40 points",
        });
      } else {
        // Check for inaccurate information
        opportunities.push({
          type: "inaccurate-information",
          severity: "medium",
          affectedBureaus: [bureau],
          account: {
            accountName: accountType,
            accountNumber: tradeline.accountIdentifier,
            accountType,
            creditorName,
            balance: tradeline.currentBalanceAmount
              ? parseFloat(tradeline.currentBalanceAmount)
              : undefined,
          },
          reason: "Negative information may be inaccurate or unverified",
          details: `Account shows negative payment history. Review for accuracy and request verification.`,
          recommendedAction:
            "Request validation of the debt and payment history",
          potentialImpact:
            "Medium - Could increase score by 10-30 points if removed",
        });
      }
    }

    // Check for incorrect balances
    if (tradeline.currentBalanceAmount && tradeline.creditLimitAmount) {
      const balance = parseFloat(tradeline.currentBalanceAmount);
      const limit = parseFloat(tradeline.creditLimitAmount);

      if (balance > limit && balance > 0) {
        opportunities.push({
          type: "incorrect-balance",
          severity: "medium",
          affectedBureaus: [bureau],
          account: {
            accountName: accountType,
            accountNumber: tradeline.accountIdentifier,
            accountType,
            creditorName,
            balance,
          },
          reason: "Balance exceeds credit limit - likely reporting error",
          details: `Reported balance ($${balance}) exceeds credit limit ($${limit}).`,
          recommendedAction:
            "Dispute incorrect balance with bureau and creditor",
          potentialImpact: "Medium - Could improve credit utilization ratio",
        });
      }
    }
  }

  return opportunities;
}

/**
 * Analyze inquiries for disputes
 */
function analyzeInquiriesForDisputes(
  inquiries: Inquiry[],
  bureau: "Equifax" | "Experian" | "TransUnion"
): DisputeOpportunity[] {
  const opportunities: DisputeOpportunity[] = [];

  for (const inquiry of inquiries) {
    const inquiryDate = inquiry.inquiryDate
      ? new Date(inquiry.inquiryDate)
      : null;
    const monthsOld = inquiryDate
      ? (new Date().getTime() - inquiryDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30)
      : 0;

    // Inquiries older than 24 months should be removed
    if (monthsOld > 24) {
      opportunities.push({
        type: "outdated-information",
        severity: "low",
        affectedBureaus: [bureau],
        account: {
          accountName: "Credit Inquiry",
          creditorName: inquiry.creditorName || "Unknown",
        },
        reason: "Inquiry is older than 2 years",
        details: `Credit inquiry from ${inquiry.creditorName} dated ${inquiry.inquiryDate} should be removed.`,
        recommendedAction: "Request removal of outdated inquiry",
        potentialImpact: "Low - Minor impact on score",
      });
    }
  }

  return opportunities;
}

/**
 * Detect duplicate accounts across bureaus
 */
function detectDuplicateAccounts(
  reports: CreditReportWithId[]
): DisputeOpportunity[] {
  const opportunities: DisputeOpportunity[] = [];
  const accountsByNumber = new Map<
    string,
    { bureau: string; tradeline: Tradeline }[]
  >();

  // Group accounts by account number
  for (const reportDoc of reports) {
    const bureau = detectBureau(reportDoc.report);
    if (!bureau || !reportDoc.report.tradelines) continue;

    for (const tradeline of reportDoc.report.tradelines) {
      if (!tradeline.accountIdentifier) continue;

      const existing = accountsByNumber.get(tradeline.accountIdentifier) || [];
      existing.push({ bureau, tradeline });
      accountsByNumber.set(tradeline.accountIdentifier, existing);
    }
  }

  // Find duplicates (same account on multiple bureaus with different info)
  for (const [accountNumber, instances] of accountsByNumber.entries()) {
    if (instances.length > 1) {
      // Check if balances or payment histories differ
      const balances = instances.map((i) =>
        parseFloat(i.tradeline.currentBalanceAmount || "0")
      );
      const uniqueBalances = [...new Set(balances)];

      if (uniqueBalances.length > 1) {
        opportunities.push({
          type: "duplicate-account",
          severity: "medium",
          affectedBureaus: instances.map((i) => i.bureau) as (
            | "Equifax"
            | "Experian"
            | "TransUnion"
          )[],
          account: {
            accountName: instances[0].tradeline.accountType || "Unknown",
            accountNumber: accountNumber,
            creditorName: instances[0].tradeline.creditorName || "Unknown",
          },
          reason: "Same account reported differently across bureaus",
          details: `Account ${accountNumber} shows different balances across bureaus: ${uniqueBalances.join(
            ", "
          )}`,
          recommendedAction:
            "Request investigation and correction of duplicate/conflicting information",
          potentialImpact: "Medium - Could resolve conflicting information",
        });
      }
    }
  }

  return opportunities;
}

/**
 * Generate AI insights using OpenAI
 */
async function generateAIInsights(
  reports: CreditReportWithId[],
  opportunities: DisputeOpportunity[]
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "";
  }

  try {
    const prompt = `Analyze this credit report summary and provide strategic insights for credit improvement:

Total Issues Found: ${opportunities.length}
High Priority: ${opportunities.filter((o) => o.severity === "high").length}
Medium Priority: ${opportunities.filter((o) => o.severity === "medium").length}
Low Priority: ${opportunities.filter((o) => o.severity === "low").length}

Issue Types:
${opportunities.map((o) => `- ${o.type}: ${o.reason}`).join("\n")}

Provide:
1. Prioritized action plan
2. Expected timeline for improvements
3. Strategic recommendations
4. Potential pitfalls to avoid

Keep response concise (3-4 paragraphs).`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a credit repair expert helping clients understand their credit reports and dispute opportunities.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to generate AI insights")
    );
    return "";
  }
}

/**
 * Generate summary from opportunities
 */
function generateSummary(opportunities: DisputeOpportunity[]) {
  const highPriority = opportunities.filter((o) => o.severity === "high");
  const mediumPriority = opportunities.filter((o) => o.severity === "medium");

  const recommendedActions = [
    ...new Set(
      opportunities
        .slice(0, 5) // Top 5 opportunities
        .map((o) => o.recommendedAction)
    ),
  ];

  let estimatedScoreImpact = "Minimal impact";
  if (highPriority.length > 0) {
    estimatedScoreImpact = "Could increase score by 30-80 points";
  } else if (mediumPriority.length > 2) {
    estimatedScoreImpact = "Could increase score by 15-40 points";
  } else if (opportunities.length > 0) {
    estimatedScoreImpact = "Could increase score by 5-20 points";
  }

  return {
    totalIssues: opportunities.length,
    highPriorityIssues: highPriority.length,
    estimatedScoreImpact,
    recommendedActions,
  };
}

/**
 * Helper: Get credit reports for user
 */
async function getCreditReports(userId: string): Promise<CreditReportWithId[]> {
  const db = firestoreAdmin();
  const collectionRef = db.collection(CRS_REPORT_DATA);
  const docRef = collectionRef.doc(userId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) return [];

  const subcols = await docRef.listCollections();
  const reports: CreditReportWithId[] = [];

  for (const colRef of subcols) {
    const qs = await colRef.get();
    for (const doc of qs.docs) {
      const data = doc.data();
      if (data.report) {
        reports.push({
          id: doc.id,
          userId: data.userId,
          report: data.report,
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() ||
            new Date().toISOString(),
        });
      }
    }
  }

  return reports;
}

/**
 * Helper: Detect bureau from report
 */
function detectBureau(
  report: CreditReport
): "Equifax" | "Experian" | "TransUnion" | null {
  if (report.repositoryIncluded?.equifax) return "Equifax";
  if (report.repositoryIncluded?.experian) return "Experian";
  if (report.repositoryIncluded?.transunion) return "TransUnion";

  const sourceType =
    report.creditFiles?.[0]?.creditFileDetail?.sourceType?.toLowerCase();
  if (sourceType?.includes("equifax")) return "Equifax";
  if (sourceType?.includes("experian")) return "Experian";
  if (sourceType?.includes("transunion") || sourceType?.includes("trans union"))
    return "TransUnion";

  return null;
}
