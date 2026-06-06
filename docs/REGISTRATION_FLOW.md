# Registration Flow Architecture

## Overview

The CEG United application employs a robust, multi-step registration and funding application process tailored for clients. The flow is designed to maximize completion rates while securing complex financial data through Google reCAPTCHA Enterprise, AI-driven OCR document scanning, Zod-based validation, and persistent state management.

The central entry point is the client registration page located at `app/(public)/register/page.tsx`.

## Architecture & State Management

### Components

The registration process revolves around the `<PublicRegistrationForm>` component (`components/new-registration/PublicRegistrationForm.tsx`), which orchestrates three primary stages:

1. **Step 1: Auth** (`Step1Auth.tsx`) - Personal & Authentication Details
2. **Step 2: Business Details** (`Step2BusinessDetails.tsx`) - Funding and Employment Information
3. **Step 3: Document Upload** (`Step3FundingDocuments.tsx`) - Required Document Attachments

### State Management (`useNewRegistrationStore`)

To prevent data loss and increase conversion rates, the flow implements an **Auto-Save Draft** feature.

- Using `Zustand` with `persist` middleware, form progress is cached in `localStorage` under `new-registration-storage`.
- The store partially persists the data: Step 1 (`authData`) and Step 2 (`businessDetailsData`) are saved, while Step 3 (`documentUploadData`) is excluded from persistence to handle sensitive file uploads cleanly.
- `PublicRegistrationForm.tsx` automatically syncs dirty fields into the store via `watch` from `react-hook-form`.
- If a user abandons the application or accidentally refreshes the page, their partially filled data is automatically restored upon return.
- A `leadId` is created via `/api/leads` during Step 1 submission, which allows subsequent steps to update the existing lead rather than creating a new one.

## Process Flow

### 1. Step 1: Auth (Personal Information)

- **Fields:** First Name, Middle Name, Last Name, SSN, Phone Number, Email, Password, Terms & Privacy Consents. (Also supports Address fields typically populated by OCR).
- **Validation:** Uses `react-hook-form` tied to `authSchema` in `schema/new-registration.ts`. Enforces SSN formatting, valid 10-digit phone number, password strength, and mandatory consent.
- **Action:** Clicking "Next" triggers a full Step 1 validation. If successful:
  - If a `leadId` does not exist, it creates a new lead via `POST /api/leads`.
  - If a `leadId` exists, it updates the lead via `PUT /api/leads`.
  - The view advances to Step 2, and the data is synced to the store.

### 2. Step 2: Business Details

- **Fields:** Funding Amount, Funding Type (Personal, Business, Both), and conditional fields.
- **Validation:** Relies on `businessDetailsSchema`, incorporating conditional logic:
  - If `fundingType` is Personal or Both: requires Estimated Credit Score (Personal) and Employment Type.
  - If `fundingType` is Business or Both: requires Business Name, EIN, Time in Business, and Business Industry. (Also requires Estimated Business Credit Score if Business).
- **Action:** Clicking "Next" triggers validation, saves progress to `/api/leads`, and advances to Step 3.

### 3. Step 3: Document Upload

- **Fields:** Driver's License, Business Bank Statements, Personal Paystubs, Personal Bank Statements.
- **Validation:** Relies on `documentUploadSchema`, which changes required documents based on selections in Step 2:
  - **Driver's License:** Always required.
  - **Personal Funding (W2):** Requires Paystubs.
  - **Personal Funding (Self-employed):** Requires Personal Bank Statements.
  - **Business Funding:** Requires Business Bank Statements.
- **Action:** Clicking "Review Application" validates the documents and opens a confirmation modal showing a summary of all entered information.

### 4. OCR Autofill Mechanism (Friction Reduction)

To reduce manual data entry, the system features an AI-driven Optical Character Recognition (OCR) integration via Gemini AI.

- **Workflow:** Users can upload their Driver's License or EIN Letter.
- **Processing:** The document is sent to `app/api/ocr/route.ts` via an OCR upload component.
- **Result:** The Google Document AI / Gemini API extracts structural data (Name, Address, EIN, ID Number) and passes it back to the frontend to automatically populate matching form fields in `react-hook-form`.

### 5. Final Submission & Backend Processing

- **Action:** In the review modal, clicking "Confirm & Join!" executes the final submission.
- **Submission:** Aggregates `authData`, `businessDetailsData`, and `documentUploadData` from the store and forms, and submits to `POST /api/register` along with the `leadId`.
- **Backend Processing:**
  - Registers the user.
  - Creates the funding application and document records.
- **Cleanup:** On success, local state is purged (`resetRegistration`), the user is shown a success message, and redirected to the home page or a confirmation page.

## Data Validation Layer (Zod)

The registration schemas employ complex, interdependent rules located in `schema/new-registration.ts`:

- **`authSchema`:** Handles baseline auth requirements, strictly ensuring terms/privacy consent and valid SSN/phone formats.
- **`businessDetailsSchema`:** Uses Zod's `superRefine` to conditionally enforce validations across varying fields based on `fundingType` (Personal vs Business).
- **`documentUploadSchema`:** Uses `superRefine` to enforce specific document uploads depending on `fundingType` and `employmentType`.

## Future Enhancements

(Refer to `REGISTRATION_CONVERSION_OPTIMIZATION.md`)

- Single Sign-On (SSO) integration.
- AI-driven follow-ups for abandoned or incomplete draft states.
- Enhanced real-time inline validation feedback before form submission.
