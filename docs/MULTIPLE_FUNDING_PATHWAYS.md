# Multiple Funding Pathways Application Flow

## Overview

The CEG United application supports allowing a single client (identified by a `referenceNumber` or `userId`) to apply for multiple funding products/pathways concurrently (e.g., `income_based`, `credit_card_stacking`, `business_loc`, `personal_loan`, `personal_credit_card`).

To support a seamless experience where a user can apply for a secondary pathway without overwriting or losing the progress of their first pathway (e.g. downgrading an already "Pre-Approved" application back to "Under Review"), the system implements a hybrid status tracking mechanism.

---

## Architecture & State Management

### 1. Database Schema (`schema/apply-funding.ts`)

The `ApplyFundingForm` schema includes an `appliedPathways` array of objects to track the status of each individual pathway the user has applied for.

```typescript
appliedPathways: z.array(
  z.object({
    pathwayId: z.string(),
    status: z.string(),
  }),
).optional();
```

### 2. Backend Submission (`service/apply-funding.ts`)

When a user submits their documents for underwriting (via `/api/user/[userId]/funding-application/[referenceNumber]/submit-underwriting`), the API receives the specific `pathwayId`.

The `updateApplicationStatus` function performs two tasks:

1. It updates the **global** `status` of the application to `"Sent to Brokerage"`.
2. It finds or creates the entry for the specific `pathwayId` inside the `appliedPathways` array and updates its specific status to `"Sent to Brokerage"`.

### 3. Local State Machine (`hooks/useIncomeFundingState.ts`)

The custom hook `useIncomeFundingState` manages the active view the user sees.

**Handling Re-Visits:**
When a user initially lands on the page, the hook initializes the `deal.status` to `"prequalified"`.
When the backend data loads, if the global `realDeal.status` is `"Sent to Brokerage"`, the hook checks the current local status.

- If the user is actively submitting (`"collecting-documents"` or `"under-review"`), it preserves their state so their progress isn't interrupted.
- If they just loaded the page (local status is `"prequalified"`), it intentionally **keeps** it as `"prequalified"`. This ensures the user is presented with the `PreApprovalView.tsx` screen, granting them the ability to click "Continue" and explore/apply for other pathways.

---

## Client User Interface

### 1. Visualizing Applied Pathways (`FundingPathways.tsx`)

When the user clicks "Continue to Submit Your File", they are presented with a list of available pathways.
The component checks the `realDeal?.appliedPathways` array. If the pathway's ID exists in the array, an **"Applied"** badge is displayed next to it, indicating to the user that they have already submitted this specific application.

### 2. Routing Logic for Applied Pathways (`app/(client)/client/income-funding/page.tsx`)

If the user clicks on a pathway they have **already applied for**, the application skips the document collection phase and intelligently routes them to their current status for that pathway.

**The Routing Fallback Tree:**

1. **Check Global & Pathway Statuses:** It reads both the global `realDeal.status` and the specific `pathwayStatus`.
2. **Offers Ready / Pre-Approved:** If the admin has added an offer (which sets the global status to `"Pre-Approved"` or `"Offer Accepted"`), OR if the specific pathway is `"Pre-Approved"`, the user is immediately routed to `"offers-ready"`.
3. **Completed:** If either status is `"Approved"`, the user is routed to `"complete"`.
4. **Under Review:** Otherwise, it falls back to `"under-review"` (SubmittedView).

This hybrid check is critical: If a user applies for `credit_card_stacking`, it will set the global status to `"Sent to Brokerage"`. Without this check, their previously approved `income_based` pathway would incorrectly display as "Under Review". Because we check if the pathway itself is approved or if the global status permits it, the user experience remains stable.

---

## Admin Coordinator Workflow

### `app/(admin)/admin/coordinator/page.tsx`

The admin dashboard operates on the **global** funding application level.

- **Adding an Offer:** When an admin adds a `DealOffer` to an application, the system automatically fires an API call to change the global status to `"Pre-Approved"`.
- **Notifying Client:** Clicking the "Notify" button explicitly sets the global status to `"Pre-Approved"` and fires an email to the client.

Because of the hybrid routing logic on the client side, as soon as the global status flips to `"Pre-Approved"`, the client will be able to access the `"offers-ready"` view for their applied pathways.

---

## Summary of the User Journey

1. Client completes Pre-Approval and is presented with pathways.
2. Client selects `income_based`, uploads documents, and clicks Submit.
3. Backend records `income_based` as "Sent to Brokerage" in `appliedPathways`. Global status becomes "Sent to Brokerage".
4. Client sees the "Under Review" screen.
5. Client leaves and returns later. The state resets to "prequalified", allowing them to see the Pre-Approval screen again.
6. Client clicks "Continue" and sees `income_based` marked as **Applied**.
7. Client selects `credit_card_stacking`, uploads documents, and clicks Submit.
8. Backend records `credit_card_stacking` as "Sent to Brokerage" in `appliedPathways`.
9. Admin adds an offer for `income_based` and hits Notify. Global status becomes "Pre-Approved".
10. Client logs in. Clicking `income_based` routes them straight to "Offers Ready" to view the offer. Clicking `credit_card_stacking` routes them to "Under Review" (unless it was also approved).
