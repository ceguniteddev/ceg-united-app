/**
 * Email Filtering & Lead Qualification Utilities
 * Filters automated mail, transactional notifications (e.g., Asana, Jira),
 * spam, promotional blasts, bounces, and system notifications.
 */

export interface EmailFilterEvaluation {
  shouldProcess: boolean;
  reason?: string;
  isAutomated: boolean;
  isBlockedSender: boolean;
  isIgnoredLabel: boolean;
}

/**
 * Gmail System labels to drop immediately (spam, trash, promotional, updates)
 */
export const IGNORED_GMAIL_LABELS = new Set<string>([
  "SPAM",
  "TRASH",
  "DRAFT",
  "CATEGORY_PROMOTIONS",
  "CATEGORY_SOCIAL",
  "CATEGORY_UPDATES",
]);

/**
 * Common regex patterns for automated, no-reply, and robot mailboxes
 */
export const SENDER_BLOCKLIST_PATTERNS: RegExp[] = [
  /^no-?reply@/i,
  /^donotreply@/i,
  /^do-not-reply@/i,
  /^mailer-daemon@/i,
  /^postmaster@/i,
  /^bounce[s\-+.]?/i,
  /^notifications?@/i,
  /^alerts?@/i,
  /^news(letter)?@/i,
  /^marketing@/i,
  /^promotions?@/i,
  /^billing@/i,
  /^invoicing?@/i,
  /^receipts?@/i,
  /^system@/i,
  /^security@/i,
  /^automated@/i,
  /^auto-confirm@/i,
  /^welcome@/i,
  /^updates?@/i,
  /^invitations?@/i,
  /^digest-noreply@/i,
];

/**
 * Known third-party automated service & transactional notification domains
 */
export const DOMAIN_BLOCKLIST = new Set<string>([
  "asana.com",
  "app.asana.com",
  "mail.asana.com",
  "github.com",
  "gitlab.com",
  "slack.com",
  "slack-messages.com",
  "trello.com",
  "atlassian.net",
  "jira.com",
  "notifications.google.com",
  "calendar-notification@google.com",
  "stripe.com",
  "hubspot.com",
  "hubspotlinks.com",
  "hubspotmail.com",
  "intercom-mail.com",
  "zendesk.com",
  "freshdesk.com",
  "mailchimp.com",
  "mcdlv.net",
  "sendgrid.net",
  "postmarkapp.com",
  "docusign.net",
  "docusign.com",
  "zoom.us",
  "figma.com",
  "notion.so",
  "linear.app",
  "clickup.com",
  "monday.com",
  "loom.com",
  "linkedin.com",
]);

/**
 * Subject patterns indicating automated bounces, out-of-office, or system error messages
 */
export const AUTOMATED_SUBJECT_PATTERNS: RegExp[] = [
  /^auto(matic)?[\s_-]*reply/i,
  /^out of office/i,
  /^undeliverable/i,
  /^delivery status notification/i,
  /^mail delivery failed/i,
  /^failure notice/i,
  /^returned mail/i,
];

/**
 * Checks if message has Gmail labels indicating spam, trash, promotions, or social
 */
export function hasIgnoredLabels(labelIds: string[] = []): boolean {
  return labelIds.some((labelId) =>
    IGNORED_GMAIL_LABELS.has(labelId.toUpperCase()),
  );
}

/**
 * Checks if the sender matches automated/no-reply patterns or known service domains
 */
export function isBlockedSender(senderEmail: string): boolean {
  const normalized = (senderEmail || "").trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return true;

  const domain = normalized.split("@")[1];
  if (domain && DOMAIN_BLOCKLIST.has(domain)) {
    return true;
  }

  return SENDER_BLOCKLIST_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Inspects standard RFC email headers for machine-generated / bulk email indicators
 */
export function isAutomatedEmailHeaders(
  headers: Record<string, string>,
): boolean {
  // RFC 3834: Auto-Submitted header (e.g. auto-generated, auto-replied)
  const autoSubmitted = (headers["auto-submitted"] || "").toLowerCase().trim();
  if (autoSubmitted && autoSubmitted !== "no") {
    return true;
  }

  // Precedence header: bulk, list, junk, auto_reply, batch
  const precedence = (headers["precedence"] || "").toLowerCase().trim();
  if (["bulk", "list", "junk", "auto_reply", "batch"].includes(precedence)) {
    return true;
  }

  // Newsletter & Bulk mailing list indicators
  if (
    headers["list-unsubscribe"] ||
    headers["list-id"] ||
    headers["list-help"] ||
    headers["list-post"]
  ) {
    return true;
  }

  // Auto response suppression & autoreply flags
  if (
    headers["x-auto-response-suppress"] ||
    headers["x-autoreply"] === "yes" ||
    headers["x-failed-recipients"] ||
    headers["x-cron-env"]
  ) {
    return true;
  }

  // Spam flags from upstream mail gateways
  const spamFlag = (headers["x-spam-flag"] || "").toLowerCase();
  const spamStatus = (headers["x-spam-status"] || "").toLowerCase();
  if (spamFlag === "yes" || spamStatus.startsWith("yes")) {
    return true;
  }

  return false;
}

/**
 * Checks if subject indicates an autoresponder or bounce notification
 */
export function isAutomatedSubject(subject: string): boolean {
  const cleanSubject = (subject || "").trim();
  return AUTOMATED_SUBJECT_PATTERNS.some((pattern) =>
    pattern.test(cleanSubject),
  );
}

/**
 * Evaluates an inbound Gmail message against all filters
 */
export function evaluateEmailLeadCandidate(params: {
  senderEmail: string;
  subject: string;
  headers: Record<string, string>;
  labelIds?: string[];
  targetMailbox: string;
}): EmailFilterEvaluation {
  const { senderEmail, subject, headers, labelIds, targetMailbox } = params;

  // 1. Self-loop / Outbound check
  if (senderEmail.toLowerCase() === targetMailbox.toLowerCase()) {
    return {
      shouldProcess: false,
      reason: "Self-loop (outbound or sent to own address)",
      isAutomated: false,
      isBlockedSender: false,
      isIgnoredLabel: false,
    };
  }

  // 2. Gmail System Labels
  if (hasIgnoredLabels(labelIds)) {
    return {
      shouldProcess: false,
      reason: `Ignored Gmail label detected: ${(labelIds || []).join(", ")}`,
      isAutomated: false,
      isBlockedSender: false,
      isIgnoredLabel: true,
    };
  }

  // 3. Sender blocklist & patterns (e.g. no-reply@asana.com)
  if (isBlockedSender(senderEmail)) {
    return {
      shouldProcess: false,
      reason: `Blocked sender pattern or domain: ${senderEmail}`,
      isAutomated: true,
      isBlockedSender: true,
      isIgnoredLabel: false,
    };
  }

  // 4. RFC Automated Headers
  if (isAutomatedEmailHeaders(headers)) {
    return {
      shouldProcess: false,
      reason:
        "Automated/Bulk machine header detected (Auto-Submitted/List-Unsubscribe/Precedence)",
      isAutomated: true,
      isBlockedSender: false,
      isIgnoredLabel: false,
    };
  }

  // 5. Automated Subject Patterns
  if (isAutomatedSubject(subject)) {
    return {
      shouldProcess: false,
      reason: `Automated subject line detected: "${subject}"`,
      isAutomated: true,
      isBlockedSender: false,
      isIgnoredLabel: false,
    };
  }

  return {
    shouldProcess: true,
    isAutomated: false,
    isBlockedSender: false,
    isIgnoredLabel: false,
  };
}
