# Credit Repair Wallet System

**Overview**

The Credit Repair Wallet System was introduced to support frictionless, 1-click physical mailing capabilities (via Lob) directly from the client dashboard. It solves two primary challenges:

1. **Microtransaction Overhead:** Avoids high fixed transaction fees from payment gateways (like Whop or Stripe) on small purchases (e.g., $1.95 for first-class mail, $7.00 for certified mail).
2. **Frictionless Experience:** Eliminates the need for users to enter credit card details for every single letter they send, vastly improving customer retention and lifetime value (LTV).

Users pre-fund their wallet (e.g., $10, $25, $50 increments) and those credits are spent seamlessly when generating disputes.

## Architecture

The wallet architecture bridges the Next.js App Router client, React Query hooks, secure Server Actions, and the Whop Payments infrastructure.

### 1. Frontend Wallet Page

**Location:** `app/(client)/client/wallet/page.tsx`

The main dashboard where users view their current balance, transaction history, and can add funds. It leverages shadcn/ui components for a clean financial interface.

### 2. React Query Hooks

**Location:** `hooks/wallet.ts`

Centralized hooks for managing wallet state:

- `useWalletQuery`: Fetches current wallet balance and transaction history.
- `useAddFundsMutation`: Triggers the Whop checkout generation for top-ups.
- `useSpendFundsMutation`: Securely debits the wallet for a specific service (e.g., `letter_mailing`).

### 3. Whop Checkout Generation

**Location:** `service/whop/index.ts`

The `createWalletCheckoutConfig` service programmatically generates a Whop checkout link for wallet top-ups. It passes the requested amount and embeds the `userId` in the checkout metadata to ensure the funds are routed correctly upon success.

### 4. Secure Webhook Handling

**Locations:**

- `app/api/payments/whop/route.ts` (Webhook receiver)
- `service/whop/index.ts` (`recordPaymentSucceeded` logic)

When Whop confirms a successful payment, the webhook handler:

1. Validates the Whop signature.
2. Intercepts payments matching `WHOP_WALLET_PRODUCT_ID`.
3. Triggers `recordPaymentSucceeded`, which writes an atomic Firestore transaction to:
   - Credit the user's `walletBalance`.
   - Log a `CREDIT` transaction in the `user-wallet-transactions` subcollection.
   - Prevent double-crediting using idempotency keys (tracking processed `paymentId`s).

### 5. Mailing Integration

**Locations:**

- `components/credit-repair/MailingOptionsStep.tsx`
- `components/credit-repair/MailFlowModal.tsx`

When a user initiates sending a physical letter:

1. **Pre-check (`MailingOptionsStep.tsx`):** Verifies if the wallet balance covers the selected mailing class. If insufficient, an inline top-up dialog is presented seamlessly.
2. **Secure Deduction (`MailFlowModal.tsx`):** Before making the external Lob API call, a secure debit transaction is executed. Only upon successful deduction is the letter dispatched.

## Configuration & Setup

The wallet system requires the following environment variables to be configured in both development (`.env.local`) and production:

| Environment Variable     | Description                                                                                                                                                        |
| :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WHOP_WALLET_PRODUCT_ID` | The specific Product/Item ID in Whop designated for wallet top-ups. The webhook listener uses this to differentiate wallet funds from standard plan subscriptions. |
| `WHOP_WEBHOOK_SECRET`    | Used to cryptographically verify incoming webhook payloads from Whop to ensure they are authentic.                                                                 |

## Best Practices & Security

The wallet system handles real currency equivalents and must be absolutely secure.

### Double-Credit Prevention (Idempotency)

Webhook deliveries can be duplicated due to network retries. The system prevents double-crediting by:

- Storing the Whop `paymentId` within the `user-wallet-transactions` document or verifying via queries.
- Running a `transaction.get()` inside `recordPaymentSucceeded` to verify the `paymentId` hasn't already been processed.
- Wrapping the balance update and transaction log creation in a single, atomic Firestore transaction.

### Transaction-Level Pre-Dispatch Validation

When spending funds, the backend validates the user's balance _during_ the transaction.

- If `walletBalance < cost`, the transaction aborts with an error.
- The letter is **never dispatched** to Lob unless the Firestore transaction successfully deducts the funds, preventing situations where the letter is sent but the charge fails.

## Related Code

- Schema: `schema/wallet.ts`
- Services: `service/wallet.ts`, `service/whop/index.ts`
