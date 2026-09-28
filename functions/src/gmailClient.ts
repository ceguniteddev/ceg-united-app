import * as logger from "firebase-functions/logger";
import type { gmail_v1 } from "googleapis";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

/**
 * Initializes an authenticated Gmail client using Domain-Wide Delegation
 * to impersonate contact@cegunited.com (or any target workspace user).
 * Uses dynamic import to prevent loading the heavy googleapis library during initialization.
 */
export async function getGmailClient(
  secretKeyJson: string,
  targetEmail = "contact@cegunited.com",
): Promise<gmail_v1.Gmail> {
  try {
    const creds: ServiceAccountKey = JSON.parse(secretKeyJson);
    const { google } = await import("googleapis");

    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
      ],
      subject: targetEmail,
    });

    return google.gmail({ version: "v1", auth });
  } catch (error) {
    logger.error("Failed to initialize Gmail client", error);
    throw error;
  }
}
