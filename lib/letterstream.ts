"use server";

/**
 * Letterstream API Integration
 *
 * Letterstream allows sending physical letters via their API.
 * Documentation: https://www.letterstream.com/docs
 *
 * Features:
 * - Send letters with HTML content
 * - Track delivery status
 * - Get delivery confirmations
 * - Support for certified mail, return receipt, etc.
 */

import { logError, logInfo } from "./logger";

const LETTERSTREAM_API_URL = "https://api.letterstream.com/v1";
const LETTERSTREAM_API_KEY = process.env.LETTERSTREAM_API_KEY;

if (!LETTERSTREAM_API_KEY) {
  console.warn("LETTERSTREAM_API_KEY is not set in environment variables");
}

export interface LetterAddress {
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string; // Default: "US"
}

export interface LetterOptions {
  // Content
  html?: string; // HTML content
  pdf?: string; // Base64 encoded PDF

  // Addresses
  to: LetterAddress;
  from: LetterAddress;

  // Mail options
  color?: boolean; // Color printing (default: false)
  double_sided?: boolean; // Double-sided printing (default: true)
  certified?: boolean; // Certified mail (default: false)
  return_receipt?: boolean; // Return receipt (default: false)

  // Metadata
  description?: string; // Internal description
  metadata?: Record<string, string>; // Custom metadata

  // Webhook
  webhook_url?: string; // Webhook for delivery updates
}

export interface LetterResponse {
  id: string;
  object: "letter";
  status:
    | "created"
    | "queued"
    | "in_production"
    | "sent"
    | "delivered"
    | "failed";
  to: LetterAddress;
  from: LetterAddress;
  color: boolean;
  double_sided: boolean;
  certified: boolean;
  return_receipt: boolean;
  description?: string;
  metadata?: Record<string, string>;
  expected_delivery_date: string; // ISO date
  tracking_number?: string;
  tracking_events?: LetterTrackingEvent[];
  created_at: string; // ISO datetime
  sent_at?: string; // ISO datetime
  price: number; // In cents
  url: string; // URL to view letter
}

export interface LetterTrackingEvent {
  timestamp: string; // ISO datetime
  status: string;
  details?: string;
  location?: string;
}

export interface LetterListResponse {
  object: "list";
  data: LetterResponse[];
  has_more: boolean;
  count: number;
}

/**
 * Send a letter via Letterstream
 */
export async function sendLetter(
  options: LetterOptions
): Promise<LetterResponse> {
  if (!LETTERSTREAM_API_KEY) {
    throw new Error("LETTERSTREAM_API_KEY is not configured");
  }

  logInfo("Sending letter via Letterstream", {
    to: options.to.name,
    from: options.from.name,
    certified: options.certified,
  });

  try {
    const response = await fetch(`${LETTERSTREAM_API_URL}/letters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LETTERSTREAM_API_KEY}`,
      },
      body: JSON.stringify({
        ...options,
        country: options.to.country || "US",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      const err = new Error(
        `Letterstream API error: ${error.message || response.statusText}`
      );
      logError(err, error);
      throw err;
    }

    const result: LetterResponse = await response.json();
    logInfo("Letter sent successfully", {
      letterId: result.id,
      expectedDelivery: result.expected_delivery_date,
      trackingNumber: result.tracking_number,
    });

    return result;
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error("Failed to send letter")
    );
    throw error;
  }
}

/**
 * Get letter details by ID
 */
export async function getLetter(letterId: string): Promise<LetterResponse> {
  if (!LETTERSTREAM_API_KEY) {
    throw new Error("LETTERSTREAM_API_KEY is not configured");
  }

  try {
    const response = await fetch(
      `${LETTERSTREAM_API_URL}/letters/${letterId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${LETTERSTREAM_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Letterstream API error: ${error.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error("Failed to get letter"),
      { letterId }
    );
    throw error;
  }
}

/**
 * List letters with optional filters
 */
export async function listLetters(params?: {
  limit?: number;
  starting_after?: string;
  ending_before?: string;
  status?: string;
}): Promise<LetterListResponse> {
  if (!LETTERSTREAM_API_KEY) {
    throw new Error("LETTERSTREAM_API_KEY is not configured");
  }

  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.starting_after)
    queryParams.append("starting_after", params.starting_after);
  if (params?.ending_before)
    queryParams.append("ending_before", params.ending_before);
  if (params?.status) queryParams.append("status", params.status);

  try {
    const response = await fetch(
      `${LETTERSTREAM_API_URL}/letters?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${LETTERSTREAM_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Letterstream API error: ${error.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error("Failed to list letters")
    );
    throw error;
  }
}

/**
 * Cancel a letter (only if not yet sent)
 */
export async function cancelLetter(letterId: string): Promise<LetterResponse> {
  if (!LETTERSTREAM_API_KEY) {
    throw new Error("LETTERSTREAM_API_KEY is not configured");
  }

  logInfo("Cancelling letter", { letterId });

  try {
    const response = await fetch(
      `${LETTERSTREAM_API_URL}/letters/${letterId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LETTERSTREAM_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Letterstream API error: ${error.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error("Failed to cancel letter"),
      { letterId }
    );
    throw error;
  }
}

/**
 * Helper: Convert HTML content to letter format
 * Formats HTML content for optimal printing
 */
export async function formatLetterHTML(
  content: string,
  options?: {
    includeDate?: boolean;
    includeSignature?: boolean;
    signatureName?: string;
  }
): Promise<string> {
  const date =
    options?.includeDate !== false
      ? `<p style="margin-bottom: 20px;">${new Date().toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )}</p>`
      : "";

  const signature =
    options?.includeSignature !== false && options?.signatureName
      ? `
      <br><br>
      <p>Sincerely,</p>
      <br><br>
      <p>${options.signatureName}</p>
    `
      : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #000;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.5in;
        }
        p {
          margin-bottom: 12pt;
        }
        h1, h2, h3 {
          margin-top: 20pt;
          margin-bottom: 12pt;
        }
        ul, ol {
          margin-bottom: 12pt;
        }
      </style>
    </head>
    <body>
      ${date}
      ${content}
      ${signature}
    </body>
    </html>
  `;
}

/**
 * Get standard credit bureau addresses
 */
function getCreditBureauAddress(
  bureau: "Equifax" | "Experian" | "TransUnion"
): LetterAddress {
  const addresses: Record<string, LetterAddress> = {
    Equifax: {
      name: "Equifax Information Services LLC",
      address_line1: "P.O. Box 740256",
      city: "Atlanta",
      state: "GA",
      postal_code: "30374",
    },
    Experian: {
      name: "Experian",
      address_line1: "P.O. Box 4500",
      city: "Allen",
      state: "TX",
      postal_code: "75013",
    },
    TransUnion: {
      name: "TransUnion LLC",
      address_line1: "P.O. Box 2000",
      city: "Chester",
      state: "PA",
      postal_code: "19016",
    },
  };

  return addresses[bureau];
}

/**
 * Get CFPB address
 */
function getCFPBAddress(): LetterAddress {
  return {
    name: "Consumer Financial Protection Bureau",
    address_line1: "P.O. Box 4503",
    city: "Iowa City",
    state: "IA",
    postal_code: "52244",
  };
}
