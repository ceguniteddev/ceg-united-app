"use server";

/**
 * Letter template service
 * Manages pre-defined dispute letter templates
 */

import { firestoreAdmin } from "@/lib/fireabase-admin";
import { LETTER_TEMPLATE } from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { logError, logInfo } from "@/lib/logger";
import { LetterTemplate, DisputeType } from "@/schema/dispute-letter";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Create a new letter template
 */
export async function createLetterTemplate(
  template: Omit<LetterTemplate, "id" | "createdAt" | "updatedAt">
): Promise<LetterTemplate> {
  logInfo("Creating letter template", { name: template.name });

  try {
    const db = firestoreAdmin();
    const collectionRef = db.collection(LETTER_TEMPLATE);

    const docRef = await collectionRef.add({
      ...template,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...normalizeAllDates(doc.data()),
    } as LetterTemplate;
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to create letter template")
    );
    throw error;
  }
}

/**
 * Get all letter templates
 */
export async function getLetterTemplates(params?: {
  disputeType?: DisputeType;
  isActive?: boolean;
}): Promise<LetterTemplate[]> {
  try {
    const db = firestoreAdmin();
    let query = db.collection(LETTER_TEMPLATE) as FirebaseFirestore.Query;

    if (params?.disputeType) {
      query = query.where("disputeType", "==", params.disputeType);
    }

    if (params?.isActive !== undefined) {
      query = query.where("isActive", "==", params.isActive);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...normalizeAllDates(doc.data()),
        } as LetterTemplate)
    );
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to get letter templates")
    );
    throw error;
  }
}

/**
 * Get a single letter template by ID
 */
export async function getLetterTemplate(
  id: string
): Promise<LetterTemplate | null> {
  try {
    const db = firestoreAdmin();
    const doc = await db.collection(LETTER_TEMPLATE).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...normalizeAllDates(doc.data()),
    } as LetterTemplate;
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to get letter template"),
      { id }
    );
    throw error;
  }
}

/**
 * Update a letter template
 */
export async function updateLetterTemplate(
  id: string,
  updates: Partial<Omit<LetterTemplate, "id" | "createdAt" | "updatedAt">>
): Promise<LetterTemplate> {
  logInfo("Updating letter template", { id });

  try {
    const db = firestoreAdmin();
    const docRef = db.collection(LETTER_TEMPLATE).doc(id);

    await docRef.update({
      ...updates,
      updatedAt: Timestamp.now(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...normalizeAllDates(doc.data()),
    } as LetterTemplate;
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to update letter template"),
      { id }
    );
    throw error;
  }
}

/**
 * Delete a letter template
 */
export async function deleteLetterTemplate(id: string): Promise<void> {
  logInfo("Deleting letter template", { id });

  try {
    const db = firestoreAdmin();
    await db.collection(LETTER_TEMPLATE).doc(id).delete();
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to delete letter template"),
      { id }
    );
    throw error;
  }
}

/**
 * Get default templates for seeding the database
 */
function getDefaultTemplates(): Omit<
  LetterTemplate,
  "id" | "createdAt" | "updatedAt"
>[] {
  return [
    {
      name: "Reinserted Account Dispute",
      description:
        "Template for disputing accounts that were previously removed and reinserted",
      disputeType: "reinserted-account",
      isActive: true,
      isDefault: true,
      aiPrompt: `Generate a formal dispute letter for a reinserted account. The letter should:
- Reference the FCRA requirement that items must be reverified before reinsertion
- Cite the consumer's right to notification before reinsertion
- Request immediate removal and documentation of verification
- Mention intention to file a CFPB complaint if not resolved`,
      templateContent: `[Date]

[Bureau Name]
[Bureau Address]

RE: Request to Remove Reinserted Account - [Account Number]

Dear Sir/Madam:

I am writing to dispute the reappearance of the following account on my credit report:

Creditor: [Creditor Name]
Account Number: [Account Number]
Type of Account: [Account Type]

This account was previously investigated and removed from my credit report. According to the Fair Credit Reporting Act (FCRA) Section 611(a)(5)(B), if an item is reinserted after removal, you must:

1. Notify me in writing within 5 business days
2. Provide the name, address, and phone number of the furnisher
3. Include a statement that I have the right to add a statement to my file disputing the accuracy

I did not receive proper notification of this reinsertion as required by law. Furthermore, under Section 623(a)(8)(D) of the FCRA, the information furnisher must certify that the disputed information was investigated and verified as accurate before reinsertion.

I request that you:
1. Immediately remove this account from my credit report
2. Provide documentation showing that proper verification was completed before reinsertion
3. Provide the notification that should have been sent regarding this reinsertion

If this matter is not resolved within 30 days, I will file a complaint with the Consumer Financial Protection Bureau and my state Attorney General.

Please send confirmation of the removal to the address below.

Sincerely,

[Your Name]
[Your Address]
[Your Phone Number]`,
      placeholders: [
        { key: "[Date]", description: "Current date", required: true },
        {
          key: "[Bureau Name]",
          description: "Credit bureau name",
          required: true,
        },
        {
          key: "[Bureau Address]",
          description: "Credit bureau address",
          required: true,
        },
        {
          key: "[Account Number]",
          description: "Account number",
          required: true,
        },
        {
          key: "[Creditor Name]",
          description: "Creditor name",
          required: true,
        },
        {
          key: "[Account Type]",
          description: "Type of account (e.g., credit card, loan)",
          required: true,
        },
        { key: "[Your Name]", description: "Your full name", required: true },
        {
          key: "[Your Address]",
          description: "Your mailing address",
          required: true,
        },
        {
          key: "[Your Phone Number]",
          description: "Your phone number",
          required: true,
        },
      ],
    },
    {
      name: "Inaccurate Information Dispute",
      description: "General template for disputing inaccurate information",
      disputeType: "inaccurate-information",
      isActive: true,
      isDefault: true,
      aiPrompt: `Generate a formal dispute letter for inaccurate credit information. The letter should:
- Clearly identify the inaccurate item
- Explain why it is inaccurate
- Request investigation and correction
- Cite FCRA rights`,
      templateContent: `[Date]

[Bureau Name]
[Bureau Address]

RE: Dispute of Inaccurate Information

Dear Sir/Madam:

I am writing to dispute inaccurate information on my credit report. Under the Fair Credit Reporting Act (FCRA), I have the right to dispute incomplete or inaccurate information.

The following information is inaccurate:

Creditor: [Creditor Name]
Account Number: [Account Number]
Inaccurate Information: [Description of Inaccuracy]

The correct information should be: [Correct Information]

This inaccuracy is affecting my credit score and ability to obtain credit. I request that you conduct a thorough investigation of this matter and correct this information immediately.

Under the FCRA, you have 30 days to investigate and respond to this dispute. Please provide me with:
1. Written confirmation of the investigation results
2. A corrected credit report if the information is found to be inaccurate
3. Notification to anyone who received my credit report in the past 6 months

I have enclosed copies of supporting documentation [list documents if any].

Sincerely,

[Your Name]
[Your Address]
[Your Phone Number]`,
      placeholders: [
        { key: "[Date]", description: "Current date", required: true },
        {
          key: "[Bureau Name]",
          description: "Credit bureau name",
          required: true,
        },
        {
          key: "[Bureau Address]",
          description: "Credit bureau address",
          required: true,
        },
        {
          key: "[Creditor Name]",
          description: "Creditor name",
          required: true,
        },
        {
          key: "[Account Number]",
          description: "Account number",
          required: true,
        },
        {
          key: "[Description of Inaccuracy]",
          description: "What is incorrect",
          required: true,
        },
        {
          key: "[Correct Information]",
          description: "What the correct information should be",
          required: true,
        },
        { key: "[Your Name]", description: "Your full name", required: true },
        {
          key: "[Your Address]",
          description: "Your mailing address",
          required: true,
        },
        {
          key: "[Your Phone Number]",
          description: "Your phone number",
          required: true,
        },
      ],
    },
    {
      name: "Outdated Information Removal",
      description:
        "Template for requesting removal of outdated negative information",
      disputeType: "outdated-information",
      isActive: true,
      isDefault: true,
      aiPrompt: `Generate a letter requesting removal of outdated information. Should cite:
- FCRA 7-year reporting limit for most negative items
- 10-year limit for bankruptcies
- Request immediate removal`,
      templateContent: `[Date]

[Bureau Name]
[Bureau Address]

RE: Request to Remove Outdated Information

Dear Sir/Madam:

I am writing to request the removal of the following outdated information from my credit report:

Creditor: [Creditor Name]
Account Number: [Account Number]
Date of Last Activity: [Date]

Under Section 605(a) of the Fair Credit Reporting Act, most negative information must be removed from credit reports after 7 years from the date of first delinquency. This account is now [Number] years old and should be removed immediately.

Continued reporting of this outdated information is a violation of the FCRA and is negatively impacting my credit score unfairly.

I request that you:
1. Immediately remove this outdated information from my credit report
2. Provide written confirmation of the removal
3. Notify me of your actions within 30 days as required by law

Thank you for your prompt attention to this matter.

Sincerely,

[Your Name]
[Your Address]
[Your Phone Number]`,
      placeholders: [
        { key: "[Date]", description: "Current date", required: true },
        {
          key: "[Bureau Name]",
          description: "Credit bureau name",
          required: true,
        },
        {
          key: "[Bureau Address]",
          description: "Credit bureau address",
          required: true,
        },
        {
          key: "[Creditor Name]",
          description: "Creditor name",
          required: true,
        },
        {
          key: "[Account Number]",
          description: "Account number",
          required: true,
        },
        { key: "[Date]", description: "Date of last activity", required: true },
        { key: "[Number]", description: "Number of years old", required: true },
        { key: "[Your Name]", description: "Your full name", required: true },
        {
          key: "[Your Address]",
          description: "Your mailing address",
          required: true,
        },
        {
          key: "[Your Phone Number]",
          description: "Your phone number",
          required: true,
        },
      ],
    },
    {
      name: "Unauthorized Inquiry Dispute",
      description: "Template for disputing unauthorized credit inquiries",
      disputeType: "unauthorized-inquiry",
      isActive: true,
      isDefault: true,
      aiPrompt: `Generate a letter disputing unauthorized inquiries. Should state:
- Did not authorize the inquiry
- Request removal and investigation
- Mention potential identity theft concerns`,
      templateContent: `[Date]

[Bureau Name]
[Bureau Address]

RE: Dispute of Unauthorized Credit Inquiry

Dear Sir/Madam:

I am writing to dispute the following unauthorized inquiry on my credit report:

Company: [Company Name]
Date of Inquiry: [Inquiry Date]

I did not authorize this credit inquiry. Under the Fair Credit Reporting Act, credit inquiries must be permissible and authorized. Unauthorized inquiries can indicate identity theft and must be removed immediately.

I request that you:
1. Remove this unauthorized inquiry from my credit report
2. Investigate how this inquiry was placed without my authorization
3. Provide documentation showing authorization for this inquiry, if claimed to exist
4. Confirm the removal in writing

If this inquiry was the result of identity theft, I am prepared to file a police report and an identity theft report with the Federal Trade Commission.

Please respond within 30 days as required by the FCRA.

Sincerely,

[Your Name]
[Your Address]
[Your Phone Number]`,
      placeholders: [
        { key: "[Date]", description: "Current date", required: true },
        {
          key: "[Bureau Name]",
          description: "Credit bureau name",
          required: true,
        },
        {
          key: "[Bureau Address]",
          description: "Credit bureau address",
          required: true,
        },
        {
          key: "[Company Name]",
          description: "Company that made the inquiry",
          required: true,
        },
        {
          key: "[Inquiry Date]",
          description: "Date of the inquiry",
          required: true,
        },
        { key: "[Your Name]", description: "Your full name", required: true },
        {
          key: "[Your Address]",
          description: "Your mailing address",
          required: true,
        },
        {
          key: "[Your Phone Number]",
          description: "Your phone number",
          required: true,
        },
      ],
    },
  ];
}

/**
 * Initialize default templates (run once during setup)
 */
export async function initializeDefaultTemplates(): Promise<void> {
  logInfo("Initializing default letter templates");

  try {
    const existingTemplates = await getLetterTemplates();

    if (existingTemplates.length > 0) {
      logInfo("Templates already exist, skipping initialization");
      return;
    }

    const defaultTemplates = getDefaultTemplates();

    for (const template of defaultTemplates) {
      await createLetterTemplate(template);
    }

    logInfo("Default templates initialized successfully", {
      count: defaultTemplates.length,
    });
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to initialize default templates")
    );
    throw error;
  }
}
