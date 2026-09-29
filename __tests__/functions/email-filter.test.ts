/// <reference types="vitest/globals" />

import {
  evaluateEmailLeadCandidate,
  isBlockedSender,
  isAutomatedEmailHeaders,
  isAutomatedSubject,
  hasIgnoredLabels,
} from "@/functions/src/emailFilter";

describe("Email Filter & Lead Detection", () => {
  const TARGET_MAILBOX = "contact@cegunited.com";

  describe("isBlockedSender", () => {
    it("identifies no-reply and automated addresses as blocked", () => {
      expect(isBlockedSender("no-reply@asana.com")).toBe(true);
      expect(isBlockedSender("noreply@mail.asana.com")).toBe(true);
      expect(isBlockedSender("notifications@github.com")).toBe(true);
      expect(isBlockedSender("donotreply@stripe.com")).toBe(true);
      expect(isBlockedSender("mailer-daemon@googlemail.com")).toBe(true);
      expect(isBlockedSender("bounce-123@hubspotmail.com")).toBe(true);
      expect(isBlockedSender("alerts@slack.com")).toBe(true);
    });

    it("identifies blocked service domains even with non-standard prefix", () => {
      expect(isBlockedSender("team@asana.com")).toBe(true);
      expect(isBlockedSender("messages-noreply@linkedin.com")).toBe(true);
      expect(isBlockedSender("updates@trello.com")).toBe(true);
      expect(isBlockedSender("info@docusign.net")).toBe(true);
    });

    it("allows genuine prospect and client email addresses", () => {
      expect(isBlockedSender("john.doe@gmail.com")).toBe(false);
      expect(isBlockedSender("sarah@abccorp.com")).toBe(false);
      expect(isBlockedSender("client.inquiry@yahoo.com")).toBe(false);
      expect(isBlockedSender("broker@independentfunding.net")).toBe(false);
    });
  });

  describe("isAutomatedEmailHeaders", () => {
    it("detects Auto-Submitted header", () => {
      expect(
        isAutomatedEmailHeaders({ "auto-submitted": "auto-generated" }),
      ).toBe(true);
      expect(
        isAutomatedEmailHeaders({ "auto-submitted": "auto-replied" }),
      ).toBe(true);
      expect(isAutomatedEmailHeaders({ "auto-submitted": "no" })).toBe(false);
    });

    it("detects Precedence bulk / list / auto_reply headers", () => {
      expect(isAutomatedEmailHeaders({ precedence: "bulk" })).toBe(true);
      expect(isAutomatedEmailHeaders({ precedence: "list" })).toBe(true);
      expect(isAutomatedEmailHeaders({ precedence: "junk" })).toBe(true);
      expect(isAutomatedEmailHeaders({ precedence: "auto_reply" })).toBe(true);
    });

    it("detects List-Unsubscribe or mailing list headers", () => {
      expect(
        isAutomatedEmailHeaders({
          "list-unsubscribe": "<https://example.com/unsub>",
        }),
      ).toBe(true);
      expect(
        isAutomatedEmailHeaders({
          "list-id": "12345.list.example.com",
        }),
      ).toBe(true);
    });

    it("detects auto-response suppression and spam flags", () => {
      expect(
        isAutomatedEmailHeaders({
          "x-auto-response-suppress": "All",
        }),
      ).toBe(true);
      expect(
        isAutomatedEmailHeaders({
          "x-spam-flag": "YES",
        }),
      ).toBe(true);
    });

    it("passes regular email headers", () => {
      expect(
        isAutomatedEmailHeaders({
          from: "alice@example.com",
          to: "contact@cegunited.com",
          subject: "Funding inquiry for my LLC",
        }),
      ).toBe(false);
    });
  });

  describe("isAutomatedSubject", () => {
    it("detects automated bounces and out of office subjects", () => {
      expect(isAutomatedSubject("Automatic reply: Out of office")).toBe(true);
      expect(isAutomatedSubject("Auto-Reply: Vacation notice")).toBe(true);
      expect(isAutomatedSubject("Out of Office: Dr. Smith")).toBe(true);
      expect(isAutomatedSubject("Undeliverable: Funding Application")).toBe(
        true,
      );
      expect(isAutomatedSubject("Delivery Status Notification (Failure)")).toBe(
        true,
      );
      expect(
        isAutomatedSubject("Mail delivery failed: returning message to sender"),
      ).toBe(true);
    });

    it("passes normal subject lines", () => {
      expect(
        isAutomatedSubject("Question regarding business line of credit"),
      ).toBe(false);
      expect(
        isAutomatedSubject("Documents attached for CEG United application"),
      ).toBe(false);
      expect(isAutomatedSubject("Urgent funding question")).toBe(false);
    });
  });

  describe("hasIgnoredLabels", () => {
    it("detects Gmail spam, trash, promotions, updates labels", () => {
      expect(hasIgnoredLabels(["INBOX", "SPAM"])).toBe(true);
      expect(hasIgnoredLabels(["CATEGORY_PROMOTIONS", "UNREAD"])).toBe(true);
      expect(hasIgnoredLabels(["CATEGORY_UPDATES"])).toBe(true);
      expect(hasIgnoredLabels(["CATEGORY_SOCIAL"])).toBe(true);
      expect(hasIgnoredLabels(["TRASH"])).toBe(true);
    });

    it("passes standard inbox labels", () => {
      expect(hasIgnoredLabels(["INBOX", "UNREAD", "IMPORTANT"])).toBe(false);
    });
  });

  describe("evaluateEmailLeadCandidate", () => {
    it("drops self-loop emails sent to own mailbox", () => {
      const result = evaluateEmailLeadCandidate({
        senderEmail: "contact@cegunited.com",
        subject: "Test email",
        headers: {},
        labelIds: ["INBOX"],
        targetMailbox: TARGET_MAILBOX,
      });

      expect(result.shouldProcess).toBe(false);
      expect(result.reason).toContain("Self-loop");
    });

    it("blocks no-reply@asana.com automated notification", () => {
      const result = evaluateEmailLeadCandidate({
        senderEmail: "no-reply@asana.com",
        subject: "New task assigned: Review Q3 metrics",
        headers: {
          "auto-submitted": "auto-generated",
        },
        labelIds: ["INBOX"],
        targetMailbox: TARGET_MAILBOX,
      });

      expect(result.shouldProcess).toBe(false);
      expect(result.isBlockedSender).toBe(true);
    });

    it("blocks newsletters with List-Unsubscribe headers", () => {
      const result = evaluateEmailLeadCandidate({
        senderEmail: "marketing@randomfinancenewsletter.com",
        subject: "Top 10 business tips for this week",
        headers: {
          "list-unsubscribe": "<https://newsletter.com/optout>",
        },
        labelIds: ["INBOX"],
        targetMailbox: TARGET_MAILBOX,
      });

      expect(result.shouldProcess).toBe(false);
      expect(result.isAutomated).toBe(true);
    });

    it("approves legitimate customer lead email", () => {
      const result = evaluateEmailLeadCandidate({
        senderEmail: "michael.scott@dundermifflin.com",
        subject: "Need funding for paper company expansion",
        headers: {
          from: "Michael Scott <michael.scott@dundermifflin.com>",
          to: TARGET_MAILBOX,
        },
        labelIds: ["INBOX", "UNREAD"],
        targetMailbox: TARGET_MAILBOX,
      });

      expect(result.shouldProcess).toBe(true);
      expect(result.isAutomated).toBe(false);
      expect(result.isBlockedSender).toBe(false);
    });
  });
});
