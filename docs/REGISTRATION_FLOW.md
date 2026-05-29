# Registration Flow Architecture

## Overview

The CEG United application employs a robust, multi-step registration and funding application process tailored for clients. The flow is designed to maximize completion rates while securing complex financial data through Google reCAPTCHA Enterprise, AI-driven OCR document scanning, Zod-based validation, and persistent state management.

The central entry point is the client registration page located at `app/(public)/register/page.tsx`.

## Architecture & State Management

### Components

The registration process revolves around the `<MultiStepRegistrationForm>` component (`components/registration/MultiStepRegistrationForm.tsx`), which orchestrates two primary stages:

1. **Step 1: Personal Information** (`Step1PersonalInfo.tsx`)
2. **Step 2: Funding Application** (`Step2FundingInfo.tsx` leading to `FundingApplicationFields.tsx`)

### State Management (`useRegistrationStore`)

To prevent data loss and increase conversion rates, the flow implements an **Auto-Save Draft** feature.

- Using `Zustand` with `persist` middleware, form progress is cached in `localStorage`.
- `MultiStepRegistrationForm.tsx` uses a `useEffect` with a 1-second debounce to automatically sync dirty fields into the store.
- If a user abandons the application or accidentally refreshes the page, their partially filled data is automatically restored upon return.
- Users can explicitly clear their draft data using the "Reset" (Trash) button, which purges `localStorage`.

## Process Flow

### 1. Invitation & Initialization

- The registration page checks for `invitationToken` and `invitationType` in the URL parameters.
- If it's a broker invitation (`type="client"`), it validates the token against `/api/auth/validate-invitation`.
- Upon successful validation, the user's email is pre-filled and locked (`isEmailReadOnly = true`).

### 2. Step 1: Personal Information

- **Fields:** First Name, Middle Name, Last Name, Birthdate, Gender, SSN, and Password.
- **Validation:** Uses `react-hook-form` tied to `clientApplicationSchema`. Validates password strength dynamically, enforces SSN formatting, and ensures age/date prerequisites.
- **Action:** Clicking "Next" triggers a full Step 1 validation. If successful, progress updates to 50%, the view advances to Step 2, and the data is synced to the store.

### 3. Step 2: Funding Application

- **Fields:** Funding Type (Personal, Business, Community), Address Information, Employment Status, Financials, Business Information, and Required Documents (e.g., Bank Statements, ID).
- **Validation:** Relies on `applyFundingSchema`, incorporating heavy conditional logic. For example:
  - If `fundingType` includes "Business", it enforces rules requiring business name, EIN, and business address.
  - If `fundingType` includes "Community", it forces fields like `reasonForJoiningCommunity`.
- **Dynamic Context:** Address fields dynamically show or hide based on context, and required document rules change based on the selected funding product.

### 4. OCR Autofill Mechanism (Friction Reduction)

To reduce manual data entry, the system features an AI-driven Optical Character Recognition (OCR) integration via Gemini AI.

- **Workflow:** Users can upload their Driver's License or EIN Letter early in Step 2.
- **Processing:** The document is sent to `app/api/ocr/route.ts` via an OCR upload component.
- **Result:** The Google Document AI / Gemini API extracts structural data (Name, Address, EIN, ID Number) and passes it back to the frontend to automatically populate matching form fields in `react-hook-form`.

### 5. Final Submission & Backend Processing

- **Action:** Clicking "Apply" conducts a final sweep of `applyFundingSchema` validations. If there are errors, they are aggregated into a clickable toast notification that focuses on the problematic field.
- **Submission:** Submits both `step1Data` and `step2Data` to `POST /api/register`.
- **Security Check:** Creates a Google reCAPTCHA Enterprise assessment token to verify human origin.
- **Broker Context:** If an `invitationToken` was present, the backend (`verifyClientInvitationToken`) correlates the registration to the inviting Broker.
- **User Creation:** Registers the user in Firebase Auth and populates Firestore collections (`user` and `funding-application`).
- **Cleanup:** On success, local state is purged (`clearRegistration`), the invitation token is consumed, and the user is redirected.

## Data Validation Layer (Zod)

The registration schemas employ complex, interdependent rules.

- **`client-application.ts`:** Handles baseline auth requirements, strictly ensuring the client provides a password (not required for admin-initiated creation).
- **`apply-funding.ts`:** A massive schema featuring refined logic. It uses Zod's `superRefine` to conditionally enforce validations across varying fields:
  - Validates historical tax filing (requires at least one valid entry if `personalTaxesStatus === "yes"`).
  - Checks if specific funding products (like "Business Income Based Funding") require Bank Statements and Driver's License uploads before proceeding.

## Future Enhancements

(Refer to `REGISTRATION_CONVERSION_OPTIMIZATION.md`)

- Single Sign-On (SSO) integration.
- AI-driven follow-ups for abandoned or incomplete draft states.
- Enhanced real-time inline validation feedback before form submission.
