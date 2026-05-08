# Email Ingestion & Automated Funding Pipeline Architecture

This document outlines the architecture and workflow for an autonomous funding application pipeline. It is designed around your existing technology stack (Google Workspace, n8n, Firebase Functions, Gemini AI, and Next.js) and addresses key challenges regarding spam, AI accuracy, and missing data.

## 1. Technology Stack Overview

- **Email Provider:** Google Workspace (IMAP via n8n)
- **Orchestration:** n8n (Self-hosted)
- **Classification & Parsing:** Firebase Functions (`classifyDocument.ts`) + Google Gemini AI / Google Document AI
- **Core Backend:** Next.js API (`app/api/register/route.ts`) + Firestore

---

## 2. Solving Core Challenges

### Challenge 1: Email Spam & Unwanted Triggers

Exposing a public email address (`funding@ceg...`) inevitably attracts marketing spam, which triggers automated workflows, wastes API credits, and pollutes the database.

**Solutions:**

- **The "Broker Whitelist" (Recommended):** In n8n, immediately query the database to verify if the `Sender Email` belongs to a registered Broker or Client. If the sender is unknown, terminate the workflow or trigger an automated reply with a registration link.
- **Attachment Gate:** Ensure n8n strictly filters out emails without attachments (`Has Attachments? == True`).
- **Google Workspace Rules:** Configure Gmail rules to aggressively filter known spam domains before they reach the inbox n8n monitors.

### Challenge 2: Google Document AI vs. Gemini AI

Currently, the pipeline uses `gemini-1.5-flash-lite` for document classification and extraction.

- **Gemini AI (The Generalist):** Excellent at flexible classification, reasoning, and extracting simple fields (like a Driver's License or basic tax form). However, it struggles with dense, multi-page tabular data (like extracting line-item transactions from a 50-page bank statement) and is prone to hallucination if the document is blurry.
- **Google Document AI (The Specialist):** Purpose-built for financial documents. It utilizes pre-trained models specifically for Bank Statements, Invoices, and W-2s, ensuring flawless tabular extraction without hallucination.

**The Hybrid Solution:**
Use **both**. Retain `classifyDocument.ts` (Gemini) as the **Router**. Ask Gemini to classify the document type based on the first page.

- If classified as a `"DRIVERS_LICENSE"` or `"EIN_LETTER"`, let Gemini extract the data.
- If classified as `"BANK_STATEMENTS"`, n8n dynamically routes the file to the Google Document AI _Bank Statement Parser_ for deep, accurate financial extraction.

### Challenge 3: Handling Missing Data

Brokers frequently submit incomplete applications. If the Next.js API requires a strict schema (e.g., `businessName`, `ssn`) and the AI cannot find it in the provided documents, the registration fails.

**Solutions:**

- **Draft Mode + Magic Links (Lowest Friction):** Modify the `/api/register` endpoint to accept partial payloads. Save the application in Firestore with a status of `INCOMPLETE`. n8n then automatically replies to the broker with a secure "Magic Link." This link opens the Next.js frontend, pre-fills the successfully extracted data, and highlights the missing fields in red for manual entry.
- **AI Autonomous Replies:** If the API returns a `400 Bad Request` specifying missing fields, n8n passes the error to Gemini. Gemini drafts a contextual, polite email to the broker requesting the specific missing documents, keeping the conversation inside the original email thread.

---

## 3. The Master n8n Workflow

Below is the step-by-step blueprint for the orchestrated n8n workflow:

1.  **Trigger (IMAP):** n8n listens to the Google Workspace inbox for new emails.
2.  **Spam Gate (Filter):** n8n checks if attachments exist AND if the sender email is whitelisted in the database.
3.  **Classification (Gemini):** Attachments are passed to the Firebase Function (`classifyDocument.ts`). Gemini returns the `document_id` (e.g., `BANK_STATEMENT`).
4.  **Deep Extraction (Conditional):**
    - If simple document -> Use Gemini's extracted JSON.
    - If financial document -> Route to Google Document AI for precise extraction.
5.  **Registration Attempt:** n8n sends the aggregated JSON data payload to `app/api/register/route.ts`.
6.  **Decision & Communication Branch:**
    - **Success (200 OK):** n8n uses the SMTP node to email the broker: _"Application received successfully. It is now in underwriting."_
    - **Failure (400 Bad Request):** n8n triggers the Missing Data protocol (sending a Magic Link or an AI-drafted reply requesting the missing files).

---

## 4. Trade-offs & Implementation Strategy

- **Autonomous Emails vs. Human Control:** Allowing the AI to autonomously email brokers asking for missing documents is highly efficient but carries a risk. If the AI incorrectly parses a document and asks for a file the broker already sent, it will cause frustration.
- **Recommendation:** Start with the **Draft Mode + Magic Links** approach. It keeps humans in control of filling in the blanks and provides a seamless UI experience. Once the classification models prove highly reliable in production, incrementally introduce the AI autonomous email replies.
