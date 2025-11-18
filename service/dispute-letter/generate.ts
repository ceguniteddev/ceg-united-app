"use server";

/**
 * AI Letter Generation Service
 * Generates personalized dispute letters using AI and templates
 */

import { logError, logInfo } from "@/lib/logger";
import {
  DisputeType,
  DisputedAccount,
  LetterRecipient,
} from "@/schema/dispute-letter";
import { getLetterTemplate } from "./template";
import { CreditReportWithId } from "@/types/crs";
import { DisputeOpportunity } from "./analysis";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface GenerateLetterParams {
  disputeType: DisputeType;
  opportunity: DisputeOpportunity;
  userInfo: {
    firstName: string;
    lastName: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
    };
    phoneNumber?: string;
  };
  templateId?: string;
  customInstructions?: string;
}

export interface GeneratedLetter {
  title: string;
  content: string;
  disputedAccounts: DisputedAccount[];
  recipients: LetterRecipient[];
  aiGenerated: boolean;
  aiPrompt?: string;
  templateId?: string;
}

/**
 * Generate a dispute letter using AI and templates
 */
export async function generateDisputeLetter(
  params: GenerateLetterParams
): Promise<GeneratedLetter> {
  logInfo("Generating dispute letter", {
    disputeType: params.disputeType,
    hasTemplate: !!params.templateId,
  });

  try {
    // Get template if specified, otherwise use default for dispute type
    let template = null;
    if (params.templateId) {
      template = await getLetterTemplate(params.templateId);
    } else {
      // Get default template for this dispute type
      const { getLetterTemplates } = await import("./template");
      const templates = await getLetterTemplates({
        disputeType: params.disputeType,
        isActive: true,
      });
      template = templates.find((t) => t.isDefault) || templates[0];
    }

    if (!template) {
      throw new Error(
        `No template found for dispute type: ${params.disputeType}`
      );
    }

    // Build disputed accounts from opportunity
    const disputedAccounts: DisputedAccount[] = [
      {
        accountName:
          params.opportunity.account?.accountName || "Unknown Account",
        accountNumber: params.opportunity.account?.accountNumber,
        accountType: params.opportunity.account?.accountType,
        creditorName:
          params.opportunity.account?.creditorName || "Unknown Creditor",
        balance: params.opportunity.account?.balance,
        disputeReason: params.opportunity.reason,
        additionalDetails: params.opportunity.details,
        affectedBureaus: params.opportunity.affectedBureaus,
        previouslyRemoved: params.disputeType === "reinserted-account",
      },
    ];

    // Build recipients (credit bureaus)
    const recipients: LetterRecipient[] =
      params.opportunity.affectedBureaus.map((bureau) => ({
        recipientType: "credit-bureau" as const,
        name: getBureauFullName(bureau),
        ...getBureauAddress(bureau),
        bureau,
        isDefault: true,
      }));

    // Generate letter content
    let content: string;
    let aiPrompt: string | undefined;
    let aiGenerated = false;

    if (OPENAI_API_KEY && template.aiPrompt) {
      // Use AI to generate personalized content
      const result = await generateAILetterContent(
        template,
        params,
        disputedAccounts[0]
      );
      content = result.content;
      aiPrompt = result.prompt;
      aiGenerated = true;
    } else {
      // Use template with placeholder substitution
      content = substituteTemplatePlaceholders(
        template.templateContent,
        params,
        disputedAccounts[0]
      );
      aiGenerated = false;
    }

    const title = `${params.disputeType
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())} - ${
      disputedAccounts[0].creditorName
    }`;

    logInfo("Dispute letter generated successfully", {
      disputeType: params.disputeType,
      aiGenerated,
      bureaus: params.opportunity.affectedBureaus,
    });

    return {
      title,
      content,
      disputedAccounts,
      recipients,
      aiGenerated,
      aiPrompt,
      templateId: template.id,
    };
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to generate dispute letter")
    );
    throw error;
  }
}

/**
 * Generate AI-powered letter content
 */
async function generateAILetterContent(
  template: any,
  params: GenerateLetterParams,
  account: DisputedAccount
): Promise<{ content: string; prompt: string }> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const fullName = `${params.userInfo.firstName} ${params.userInfo.lastName}`;
  const address = params.userInfo.address;
  const fullAddress = `${address.line1}${
    address.line2 ? ", " + address.line2 : ""
  }, ${address.city}, ${address.state} ${address.postalCode}`;

  const systemPrompt =
    template.aiPrompt || "Generate a formal credit dispute letter.";

  const userPrompt = `Generate a professional dispute letter with the following details:

Dispute Type: ${params.disputeType.replace(/-/g, " ")}
Sender: ${fullName}
Address: ${fullAddress}
Phone: ${params.userInfo.phoneNumber || "Not provided"}

Account Details:
- Creditor: ${account.creditorName}
- Account Number: ${account.accountNumber || "Not provided"}
- Account Type: ${account.accountType || "Unknown"}
- Dispute Reason: ${account.disputeReason}
- Additional Details: ${account.additionalDetails || "None"}
${account.balance ? `- Balance: $${account.balance}` : ""}

Affected Credit Bureaus: ${account.affectedBureaus.join(", ")}

${
  params.customInstructions
    ? `Additional Instructions: ${params.customInstructions}`
    : ""
}

Generate a formal letter that:
1. Is professional and follows FCRA guidelines
2. Clearly states the dispute
3. References relevant consumer rights
4. Requests specific actions
5. Includes appropriate legal citations
6. Uses proper letter formatting

Return ONLY the letter content (no subject line, no metadata, no placeholders like [Date] or [Signature]).`;

  try {
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
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    return {
      content,
      prompt: userPrompt,
    };
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to generate AI letter content")
    );
    throw error;
  }
}

/**
 * Substitute placeholders in template
 */
function substituteTemplatePlaceholders(
  templateContent: string,
  params: GenerateLetterParams,
  account: DisputedAccount
): string {
  const fullName = `${params.userInfo.firstName} ${params.userInfo.lastName}`;
  const address = params.userInfo.address;
  const fullAddress = `${address.line1}${
    address.line2 ? "\n" + address.line2 : ""
  }\n${address.city}, ${address.state} ${address.postalCode}`;

  // Get bureau name for first affected bureau
  const bureau = account.affectedBureaus[0];
  const bureauName = getBureauFullName(bureau);
  const bureauAddress = getBureauAddress(bureau);
  const bureauFullAddress = `${bureauAddress.addressLine1}\n${bureauAddress.city}, ${bureauAddress.state} ${bureauAddress.postalCode}`;

  const replacements: Record<string, string> = {
    "[Date]": new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    "[Bureau Name]": bureauName,
    "[Bureau Address]": bureauFullAddress,
    "[Your Name]": fullName,
    "[Your Address]": fullAddress,
    "[Your Phone Number]": params.userInfo.phoneNumber || "",
    "[Creditor Name]": account.creditorName,
    "[Account Number]": account.accountNumber || "Not Provided",
    "[Account Type]": account.accountType || "Unknown",
    "[Description of Inaccuracy]": account.disputeReason,
    "[Correct Information]": "Please remove this inaccurate information",
    "[Company Name]": account.creditorName,
    "[Inquiry Date]": new Date().toLocaleDateString(),
    "[Number]": "7",
  };

  let result = templateContent;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder, "g"), value);
  }

  return result;
}

/**
 * Get bureau full name
 */
function getBureauFullName(
  bureau: "Equifax" | "Experian" | "TransUnion"
): string {
  const names: Record<string, string> = {
    Equifax: "Equifax Information Services LLC",
    Experian: "Experian",
    TransUnion: "TransUnion LLC",
  };
  return names[bureau];
}

/**
 * Get bureau address
 */
function getBureauAddress(bureau: "Equifax" | "Experian" | "TransUnion") {
  const addresses: Record<
    string,
    {
      addressLine1: string;
      city: string;
      state: string;
      postalCode: string;
    }
  > = {
    Equifax: {
      addressLine1: "P.O. Box 740256",
      city: "Atlanta",
      state: "GA",
      postalCode: "30374",
    },
    Experian: {
      addressLine1: "P.O. Box 4500",
      city: "Allen",
      state: "TX",
      postalCode: "75013",
    },
    TransUnion: {
      addressLine1: "P.O. Box 2000",
      city: "Chester",
      state: "PA",
      postalCode: "19016",
    },
  };
  return addresses[bureau];
}
