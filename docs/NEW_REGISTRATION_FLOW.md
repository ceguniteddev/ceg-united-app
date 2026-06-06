# New Registration Flow Implementation Plan

## Overview

This document outlines the TODOs and architecture for the new registration process. The new flow will streamline user onboarding by integrating Google Sign-In and adopting a step-by-step approach tailored to the user's funding needs.

## TODOs

### 1. Authentication Setup

- [ ] Enable and configure Google Sign-In in Firebase Authentication (already enabled, need UI integration).
- [ ] Create basic Email/Password signup form with the following fields:
  - Your Name
  - Phone Number
  - Email
  - Password

### 2. Form State Management & Schema

- [ ] Create `useNewRegistrationStore` (Zustand) for persisting form state across multiple steps.
- [ ] Define new Zod schemas (`new-registration-schema.ts`):
  - `authSchema` for basic user info.
  - `businessDetailsSchema` for business metrics.
  - `fundingPageSchema` for funding type and business name.
  - `documentUploadSchema` for conditional document requirements.

### 3. Step 1: Welcome Message

- [ ] Create a `Step1Welcome` component displaying a success message after initial signup/login.
- [ ] Include a "Continue to Application" button to transition to the next step.

### 4. Step 2: Business Details

- [ ] Create `Step2BusinessDetails` component with the following fields:
  - **Monthly Deposit:** Slider from $10k to $1M+.
  - **Time in Business:** Dropdown (1-6M, 6-12M, 1-2yrs, 2yrs+).
  - **Credit Score:** Slider from 400 to 900.

### 5. Step 3: Funding Page

- [ ] Create `Step3Funding` component with a dropdown for "Type of funding you are looking for":
  - Business Income Based Funding
  - Business Credit Based Funding
  - Personal
- [ ] Implement conditional logic:
  - If "Business Income Based Funding" or "Business Credit Based Funding" is selected, dynamically show an additional field for **Business Name**.

### 6. Step 4: Document Upload Page

- [ ] Create `Step4DocumentUpload` component with dynamic conditional rendering based on the selected funding type from Step 3.
- [ ] **For Business Funding:**
  - [ ] Upload Driver's License.
  - [ ] Upload 4 months of Bank Statements.
  - [ ] EIN (File upload OR text input).
  - [ ] SSN (text input).
  - [ ] Personal Address Search (exact match integration, e.g., Google Places API).
  - [ ] Authorization Waiver Checkbox.
- [ ] **For Personal Funding:**
  - [ ] Add sub-selection: "W2 Employed" vs "Self Employed".
  - [ ] If W2 Employed:
    - [ ] Upload Driver's License.
    - [ ] Upload last 2 recent paystubs.
    - [ ] SSN (text input).
    - [ ] Address Search.
  - [ ] If Self Employed:
    - [ ] Upload 3 months of Bank Statements.
    - [ ] Upload Driver's License.
    - [ ] SSN (text input).
    - [ ] Address Search.

### 7. API and Backend Integration

- [ ] Create or update backend endpoints (`/api/register-new`) to handle the new multi-step data submission.
- [ ] Integrate Firebase Auth to create users when using email/password or Google.
- [ ] Link document uploads to Google Cloud Storage (or Firebase Storage) and associate with the user profile.

### 8. UI/UX Refinements

- [ ] Rename or hide the old `app/(public)/register` directory.
- [ ] Create a new `app/(public)/register-new/page.tsx` (or whatever naming convention is chosen) to host the new registration flow.
- [ ] Create a new `NewMultiStepRegistrationForm` orchestrator component to handle navigation (Next/Back) between these steps.
- [ ] Create a modern progress indicator showing the user's current step.
- [ ] Add toast notifications for error handling and validation messages.
