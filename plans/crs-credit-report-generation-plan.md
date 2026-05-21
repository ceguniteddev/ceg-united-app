# CRS Credit Report Generation Feature Implementation Plan

## Objective

Implement a "Generate Credit Report" feature on the `ClientCreditReport.tsx` component that integrates with the existing Fee Settings and Whop Payment flow. If the global fee setting for generating a credit report is greater than $0, the user will be routed through the Whop checkout process before the report is generated via the N8N webhook.

## Architecture & Flow

1. **User Interaction**:
   - The user clicks a **Generate Credit Report** button inside `ClientCreditReport.tsx`.
2. **Fee Check & Checkout Initialization**:
   - The client invokes a Server Action (e.g., `initiateCRSReportCheckout`) which fetches the current `creditReportFee` (or `businessCreditReportFee` if a business report) using the `fee-settings` service.
   - **If Fee > $0**: A Whop checkout configuration is created using `createWhopCheckoutConfig` (with a custom amount in cents). The server returns the `checkoutId` and `url`.
   - **If Fee = $0**: The `generateCRSReport` server action is invoked directly, skipping the payment flow, and returns a success status.
3. **Payment Flow**:
   - The user is redirected to the existing Next.js checkout page `app/(public)/checkout/[checkoutId]/page.tsx`.
   - The `WhopCheckoutView` handles the embed session.
   - Upon successful payment (`onComplete` callback triggered by the Whop SDK), the client captures the `planId` and `receiptId` and issues a `POST` request to a new internal API route `/api/user/[userId]/crs/purchase`.

4. **Post-Payment Action**:
   - The new API route validates the payload, optionally logs the purchase, and fires the `generateCRSReport` function (which communicates with N8N to pull the credit report data).
   - Once successfully generated/queued, the user is redirected back to the `/client/my-credit` dashboard where the new report data will load.

## Component Modifications

### 1. `schema/payments.ts`

- **Action**: Add new enums to `PaymentPlanEnum`.
- **Additions**:
  ```typescript
  ("CreditReportFee", "BusinessCreditReportFee");
  ```

### 2. `service/whop/index.ts`

- **Action**: Update `createWhopCheckoutConfig` to handle the new payment keys.
- **Logic**: Ensure that when `paymentKey` is `"CreditReportFee"` or `"BusinessCreditReportFee"`, the `customAmount` is properly passed to `planDetails.initial_price` (in cents).

### 3. `service/crs/index.ts` (Server Action)

- **Action**: Add an `initiateCRSReportCheckout` function.
- **Logic**:
  - Validates user (and optionally premium status).
  - Fetches the fee from `getFeeSettings()`.
  - Determines whether to call `createWhopCheckoutConfig` or execute `generateCRSReport` immediately.

### 4. `app/api/user/[userId]/crs/purchase/route.ts` (New Endpoint)

- **Action**: Create an API endpoint for post-purchase validation.
- **Logic**:
  - Receives `checkoutId`, `planId`, `receiptId`, and `reportType` (Personal or Business).
  - Calls `generateCRSReport` or `generateCRSReportBusiness` respectively.
  - Generates a timestamped `referenceNumber` if the user doesn't have an active funding application (since N8N may require it).

### 5. `components/funding/WhopCheckoutView.tsx`

- **Action**: Add logic to handle the new `PaymentPlan` keys.
- **Logic**: Inside `onComplete`, if `checkoutDetails.paymentKey` belongs to a CRS Report, send the `POST` request to the new purchase endpoint. Upon success, redirect to `/client/my-credit`.

### 6. `components/ClientCreditReport.tsx`

- **Action**: Add the UI trigger.
- **Logic**: Add a "Refresh / Generate Report" button (e.g., top right near the title). Add loading states while checking out. Call `initiateCRSReportCheckout` on click.

## Potential Edge Cases

- **Bypassing Premium Check**: Currently `generateCRSReport` throws an error if `!user.isPremiumClient`. If a non-premium user is allowed to pay for a report, this check will need to be bypassed for paid requests. (Implementation should clarify this rule).
- **Reference Number Requirement**: N8N expects a `referenceNumber`. If the user has no funding application yet, a unique string like `crs-req-{timestamp}` should be passed.
