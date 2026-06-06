# Email Ingestion & Automated Funding Pipeline Architecture

This document outlines the architecture and workflow for the autonomous funding application pipeline. It is designed around Google Workspace (Gmail), n8n, Firebase/Cloud Functions, Gemini AI, and Next.js. The pipeline addresses key challenges regarding spam prevention, safe attachment handling, and intelligent data extraction.

## 1. Technology Stack Overview

- **Email Provider:** Google Workspace (Gmail Trigger via n8n)
- **Orchestration:** n8n (Self-hosted)
- **Classification & Parsing:** Cloud Function (`classifydocument`) + Google Document AI / Gemini
- **Data Validation & AI Agent:** LangChain within n8n + Google Gemini 2.5 Pro
- **Core Backend:** Next.js API (`app/api/register/route.ts` & `/api/funding-application/submission`)

---

## 2. Solving Core Challenges

### Challenge 1: Email Spam & Unwanted Triggers

Exposing a public email address (`funding@cegunited.com`) inevitably attracts marketing spam and malicious attachments, which trigger automated workflows, waste API credits, and pose security risks.

**Solutions Implemented:**

- **Broker/Client Verification:** In n8n, the workflow immediately queries the database (`/api/user?role=Broker&email=...`) to verify if the sender is a known entity.
- **Strict Attachment Gating:** The n8n workflow executes a custom JavaScript filter that acts as a secure gate:
  - **MIME Type Whitelist:** Only allows `application/pdf`, `image/jpeg`, `image/png`, `image/heic`, and `image/heif`.
  - **Dangerous Extension Block:** Explicitly drops files with double extensions or dangerous types (e.g., `.exe`, `.zip`, `.js`, `.bat`, `.cmd`, `.vbs`, `.msi`) from n8n's memory immediately.

### Challenge 2: Handling Incomplete Applications & Missing Data

Brokers and clients frequently submit incomplete applications via email. If the backend requires a strict schema (e.g., `businessName`, `ssn`, specific bank statement months) and the AI cannot find it, the registration fails.

**Solutions Implemented:**

- **AI-Driven Data Validation Sub-Workflow:** Instead of blindly failing at the API level, the pipeline aggregates the entire email thread and all classified documents, and passes them to a LangChain `AI Agent` powered by **Gemini 2.5 Pro**.
- **Structured Output Parsing:** The AI Agent is constrained by a `Structured Output Parser` that forces it to return a strict JSON payload matching the Next.js API schema (e.g., `inferred_funding_type`, `credit_score`, `employment_type`).
- **Autonomous Replies:** If the AI determines the application is incomplete (`is_complete: false`), it autonomously drafts a polite, contextual HTML email specifying exactly what is missing (e.g., "Missing April 2026 Bank Statement") and replies directly in the same email thread.

---

## 3. The Master n8n Workflow Architecture

The architecture is split into a Main Intake Workflow and a Data Validation Sub-workflow.

### Part A: Intake Form Workflow (Main)

1.  **Trigger (Gmail):** n8n listens to the `funding@cegunited.com` inbox for new emails.
2.  **Spam & Security Gate:**
    - Ignores internal Google emails.
    - Determines if the sender is a Broker.
    - Soft checks MIME types and permanently drops dangerous attachments.
3.  **Classification (Cloud Function):** Safe attachments are POSTed to the classification endpoint (`classifydocument-...a.run.app`).
4.  **Record Keeping:** The classification results are recorded in the Next.js backend under the specific email `threadId`.
5.  **Sub-Workflow Execution:** Triggers the Data Validation workflow (passing `emailMessageId` and `threadId`).
6.  **Decision & Action:**
    - **If Incomplete:** n8n replies to the sender with the AI-generated `suggested_email_reply`, asking for missing items.
    - **If Complete:** n8n maps the extracted JSON into `step1Data` and `step2Data` and submits a `POST` request to `/api/register`. It then replies to the sender with a success message and a temporary password.

### Part B: Data Validation Workflow (Sub-Workflow)

1.  **Context Aggregation:** Fetches the specific email message, the entire email thread history, and the Document Classification Records associated with the `threadId`.
2.  **AI Agent Execution:** Passes the aggregated context to the LangChain AI Agent (Gemini 2.5 Pro).
3.  **Underwriting Analysis:** The AI acts as an Underwriting Assistant, deducing the `FundingType` (Business, Personal, Both) and checking for strict prerequisites (e.g., exactly 4 consecutive recent months of bank statements, proper EIN verification).
4.  **Structured JSON Output:** The output parser ensures the result perfectly aligns with the `authSchema` and `businessDetailsSchema` required by the Next.js backend, determining the final `is_complete` boolean flag.

---

## 4. Trade-offs & Implementation Strategy

- **Autonomous Emails vs. Human Control:** Allowing the AI to autonomously email clients asking for missing documents is highly efficient but carries a risk. If the AI incorrectly parses a document and asks for a file the client already sent, it may cause frustration.
- **Mitigation:** The AI is strictly instructed to evaluate documents passively and adhere to clear rules (e.g., the 4-month recency/gap rule for bank statements). Using Gemini 2.5 Pro combined with Structured Output Parsers significantly reduces hallucinations and ensures consistent formatting.
