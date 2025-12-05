# Credit Dispute Letter Types

This document describes the five types of credit dispute letters available in the CEG United platform.

## Letter Types

### 1. Credit Report Disputes (`letterFeatureEnabled`)

**Purpose:** General credit dispute letters for inaccuracies, identity theft, duplicate accounts, and other common credit report errors.

**Key Features:**

- AI-powered dispute letter generation
- Certified mail delivery via Letterstream
- Tracks delivery and bureau responses
- Handles reinsertion disputes

**Schema Field:** `letterFeatureEnabled: boolean`

### 2. Late Payment Removal (`latePaymentRemovalEnabled`)

**Purpose:** Specialized letters citing USC 1666b billing error provisions to dispute and remove late payment marks.

**Key Features:**

- Cites USC 1666b Fair Credit Billing Act
- Targets billing errors and late payment disputes
- Legal framework for payment disputes

**Schema Field:** `latePaymentRemovalEnabled: boolean`

**Reference:** Based on "How to Remove Late Payments Using USC 1666b" guide

### 3. Unauthorized Inquiry Removal (`unauthorizedInquiryRemovalEnabled`)

**Purpose:** Letters specifically designed to challenge hard inquiries that were not authorized by the consumer.

**Key Features:**

- Disputes unauthorized credit pulls
- FCRA violation citations
- Identity theft protection

**Schema Field:** `unauthorizedInquiryRemovalEnabled: boolean`

**Reference:** Based on "Unauthorized Inquiry Removal Guide"

### 4. Verified Account Re-Dispute (`verifiedAccountDisputeEnabled`)

**Purpose:** Strategic follow-up letters when bureaus verify disputed accounts.

**Key Features:**

- Escalation tactics for verified disputes
- CFPB complaint procedures
- Method of verification requests
- Enhanced documentation requirements

**Schema Field:** `verifiedAccountDisputeEnabled: boolean`

**Reference:** Based on "What to Do If Accounts Come Back Verified" guide

### 5. No Response Follow-Up (`noResponseFollowUpEnabled`)

**Purpose:** Enforcement letters when credit bureaus fail to respond within the 30-day legal timeframe.

**Key Features:**

- FCRA violation citations (15 USC § 1681i)
- 30-day statutory deadline enforcement
- Damages documentation
- Attorney general notification threats

**Schema Field:** `noResponseFollowUpEnabled: boolean`

**Reference:** Based on "What to Do If They Never Respond" guide

## Admin Control

Admins can enable/disable each letter type individually per user via:

**UI Location:** `Admin > Clients > [User Profile] > Letters Tab`

**Component:** `AdminLetterFeatureManagement.tsx`

**API Endpoint:** `PUT /api/user/[userId]/letter-feature`

**Payload:**

```json
{
  "enabled": true,
  "featureKey": "latePaymentRemovalEnabled"
}
```

## Database Schema

All letter feature flags are stored in the `user` collection:

```typescript
{
  letterFeatureEnabled: boolean,              // General disputes
  latePaymentRemovalEnabled: boolean,         // USC 1666b letters
  unauthorizedInquiryRemovalEnabled: boolean, // Inquiry disputes
  verifiedAccountDisputeEnabled: boolean,     // Re-dispute letters
  noResponseFollowUpEnabled: boolean          // Follow-up enforcement
}
```

## Workflow

1. **Admin enables** specific letter types for a user
2. **User navigates** to dispute letter section (to be built)
3. **User selects** letter type based on their situation
4. **System generates** letter using appropriate template and legal citations
5. **Admin reviews** letter before approval
6. **Letterstream sends** via certified mail
7. **System tracks** delivery and 30-day response timeline

## Implementation Status

### ✅ Completed

- Schema fields for all 5 letter types
- Admin toggle UI with individual controls
- API endpoint supporting all letter types
- Service layer updates for multi-field toggles
- React Query hooks for toggling
- Visual indicators (icons, colors, descriptions)

### 🔄 In Progress

- Letter template implementations
- PDF guide integration

### 🔲 Pending

- Client-facing letter generation UI
- Letter type-specific templates
- Tracking UI with filtering by letter type
- Letter history by type
- Analytics per letter type

## Legal Framework

### USC 1666b (Late Payments)

- Fair Credit Billing Act provisions
- Billing error dispute rights
- 60-day notification window

### FCRA (15 USC § 1681)

- Section 1681i: Dispute procedures
- Section 1681e(b): Reasonable investigation
- 30-day response requirement
- Maximum accuracy requirements

### CFPB Complaint Escalation

- Method of verification requests
- Enhanced documentation requirements
- Regulatory oversight threats
