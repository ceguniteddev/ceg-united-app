# Plaid API

**Base Path:** `/api/plaid`

## Overview

The Plaid API endpoints handle bank account linking, financial data aggregation, asset reporting, document management, and webhook processing for the CEG United platform. These endpoints integrate with the [Plaid SDK](https://plaid.com/docs/) to provide banking, income verification, and asset report capabilities for clients.

**Target Role:** Client (bank linking & data), System (webhooks)

## Endpoints

### GET `/api/plaid`

Retrieves complete financial data for a user across all linked Plaid items. Returns aggregated account balances, transactions, identity, liabilities, income, and investment data.

**Auth:** Required (`withAuth`)

**Query Parameters:**

| Parameter | Type     | Required | Description                 |
| --------- | -------- | -------- | --------------------------- |
| `userId`  | `string` | Yes      | The ID of the user to query |

**Response (200):**

```json
[
  {
    "institutionName": "Chase",
    "item": {
      /* Plaid Item object */
    },
    "balance": [
      /* AccountBase[] */
    ],
    "transaction": [
      /* Transaction[] */
    ],
    "identity": [
      /* AccountBase[] from identity */
    ],
    "liabilities": {
      /* Liabilities object */
    },
    "bank_income": [
      /* BankIncome[] */
    ],
    "payroll_income": [
      /* PayrollItem[] */
    ],
    "investmentHoldings": [
      /* Holding[] */
    ],
    "investmentTransactions": [
      /* InvestmentTransaction[] */
    ]
  }
]
```

Returns `null` if no linked bank accounts exist.

**Service:** `getPlaidCompleteData()` from `service/plaid/data.ts`

---

### POST `/api/plaid/webhook`

Receives webhook events from Plaid for item status changes and asset report completions. This endpoint is **not** auth-protected — it is called directly by Plaid's servers.

**Auth:** None (Plaid system callback)

**Request Body:**

Discriminated union based on `webhook_type`:

**ITEM webhook:**

```json
{
  "webhook_type": "ITEM",
  "webhook_code": "PENDING_DISCONNECT" | "NEW_ACCOUNTS_AVAILABLE" | "LOGIN_REPAIRED",
  "item_id": "abc123",
  "environment": "production",
  "error": "",
  "reason": ""
}
```

**ASSETS webhook:**

```json
{
  "webhook_type": "ASSETS",
  "webhook_code": "PRODUCT_READY",
  "asset_report_id": "abc123",
  "environment": "production",
  "report_type": "FULL"
}
```

**Response (200):**

```json
"ok"
```

**Webhook Processing Logic:**

| `webhook_type` | `webhook_code`           | Action                                                                                                            |
| -------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `ITEM`         | `PENDING_DISCONNECT`     | Records to `USER_LINK_UPDATE_MODE` collection — triggers re-link banner for client                                |
| `ITEM`         | `NEW_ACCOUNTS_AVAILABLE` | Records to `NEW_ACCOUNTS_AVAILABLE` collection — notifies client of new accounts                                  |
| `ITEM`         | `LOGIN_REPAIRED`         | Removes item from `USER_LINK_UPDATE_MODE` — clears re-link banner                                                 |
| `ASSETS`       | `PRODUCT_READY`          | Fetches full asset report + PDF via `getAssetReport()` and `getAssetReportPDF()`, stores in Firestore and Storage |

**Services:**

- `recordWebhookData()` from `service/webhook.ts` — stores raw webhook in `WEBHOOK_DATA_COLLECTION`
- `recordWebhookData()` from `service/plaid/item.ts` — handles ITEM webhooks
- `recordWebhookData()` from `service/plaid/asset.ts` — handles ASSETS webhooks

---

### GET `/api/plaid/[userId]/document/asset`

Lists all PDF documents in a user's top-level storage folder. Returns signed URLs for downloading.

**Auth:** Required (`withAuth`)

**Path Parameters:**

| Parameter | Type     | Required | Description |
| --------- | -------- | -------- | ----------- |
| `userId`  | `string` | Yes      | User ID     |

**Response (200):**

```json
{
  "items": [
    {
      "name": "asset-report.pdf",
      "path": "documents/userId123/asset-report.pdf",
      "size": 125432,
      "updatedAt": "2025-12-01T00:00:00Z",
      "contentType": "application/pdf",
      "url": "https://storage.googleapis.com/..."
    }
  ]
}
```

Returns `{ "items": [] }` if no PDFs are found.

**Notes:**

- Only returns PDF files (filtered by MIME type)
- Signed URLs expire after **5 minutes**
- Only lists files at the top level of `documents/{userId}/` (not subfolders)

---

### GET `/api/plaid/[userId]/document/[referenceNumber]`

Lists all PDF documents in a user's reference-number-scoped storage folder. Returns signed URLs for downloading.

**Auth:** Required (`withAuth`)

**Path Parameters:**

| Parameter         | Type     | Required | Description                          |
| ----------------- | -------- | -------- | ------------------------------------ |
| `userId`          | `string` | Yes      | User ID                              |
| `referenceNumber` | `string` | Yes      | Funding application reference number |

**Response (200):**

```json
{
  "items": [
    {
      "name": "bank-statement.pdf",
      "path": "documents/userId123/REF001/1717200000-bank-statement.pdf",
      "size": 89234,
      "updatedAt": "2025-12-01T00:00:00Z",
      "contentType": "application/pdf",
      "url": "https://storage.googleapis.com/..."
    }
  ]
}
```

**Notes:**

- Lists all PDFs under `documents/{userId}/` (all subfolders)
- Signed URLs expire after **5 minutes**

---

### POST `/api/plaid/[userId]/document/[referenceNumber]`

Uploads a PDF document to a user's reference-number-scoped storage folder.

**Auth:** Required (`withAuth`)

**Path Parameters:**

| Parameter         | Type     | Required | Description                          |
| ----------------- | -------- | -------- | ------------------------------------ |
| `userId`          | `string` | Yes      | User ID                              |
| `referenceNumber` | `string` | Yes      | Funding application reference number |

**Request Body:** `multipart/form-data`

| Field  | Type   | Required | Description        |
| ------ | ------ | -------- | ------------------ |
| `file` | `File` | Yes      | The file to upload |

**Response (201):**

```json
{
  "name": "bank-statement.pdf",
  "path": "documents/userId123/REF001/1717200000-bank-statement.pdf",
  "size": 89234,
  "updatedAt": "2025-12-01T00:00:00Z",
  "contentType": "application/pdf",
  "url": "https://storage.googleapis.com/..."
}
```

**Notes:**

- Files stored at `documents/{userId}/{referenceNumber}/{timestamp}-{filename}`
- Signed URL in response expires after **5 minutes**

## Error Responses

| Status | Description               | Returned By                            |
| ------ | ------------------------- | -------------------------------------- |
| 400    | Missing or invalid params | All endpoints with required parameters |
| 401    | Unauthorized              | All `withAuth` endpoints               |
| 500    | Internal server error     | All endpoints on unexpected failures   |

## Data Flow

### Bank Linking Flow

1. Client component calls `useGetLinkToken()` hook → `getPlaidLinkToken()` service
2. Link token returned → opens Plaid Link UI via `react-plaid-link`
3. User selects bank → Plaid returns `public_token`
4. Client calls `exchangeAccessToken()` → exchanges for `access_token` via Plaid API
5. Access token encrypted and stored in `PLAID_TOKEN_COLLECTION`
6. Asset report created automatically for ITEM token types

### Asset Report Flow

1. `createAssetReport()` called during token exchange → requests report from Plaid
2. Request recorded in `PLAID_CREATE_ASSET_REPORT` collection
3. Plaid sends webhook to `POST /api/plaid/webhook` when report ready
4. Webhook handler fetches full report → stores in `PLAID_ASSET_REPORT_DATA`
5. PDF version saved to Firebase Storage at `documents/{userId}/asset-report-{itemId}.pdf`

### Complete Data Aggregation Flow

1. `GET /api/plaid?userId=...` called
2. Service fetches all access tokens for user from `PLAID_TOKEN_COLLECTION`
3. For each token, parallel Plaid API calls: balances, transactions, identity, liabilities, income, investments
4. Results aggregated into `PlaidCompleteRow[]` and cached in `PLAID_USER_COMPLETE_DATA`

## Firestore Collections

| Constant                         | Collection Name                    | Purpose                               |
| -------------------------------- | ---------------------------------- | ------------------------------------- |
| `PLAID_TOKEN_COLLECTION`         | `plaid-token`                      | Encrypted access tokens per user/item |
| `USER_TOKEN_COLLECTION`          | `plaid-user-token`                 | Encrypted Plaid user tokens (income)  |
| `PLAID_USER_COMPLETE_DATA`       | `plaid-user-complete-data`         | Cached aggregated financial data      |
| `PLAID_CREATE_ASSET_REPORT`      | `plaid-asset-create-report`        | Asset report request records          |
| `PLAID_ASSET_REPORT_DATA`        | `plaid-asset-report-data`          | Completed asset report data           |
| `PLAID_ITEM_WEBHOOK_COLLECTION`  | `plaid-item-webhook-data`          | Item webhook event log                |
| `PLAID_ASSET_WEBHOOK_COLLECTION` | `plaid-asset-webhook-data`         | Asset webhook event log               |
| `WEBHOOK_DATA_COLLECTION`        | `webhook-data`                     | Raw webhook data (all types)          |
| `USER_LINK_UPDATE_MODE`          | `user-link-update-mode`            | Items needing re-authentication       |
| `NEW_ACCOUNTS_AVAILABLE`         | `user-link-new-accounts-available` | Items with new accounts to link       |

All constants defined in `constant/collection-name.ts`.

## Types

Defined in `types/plaid.d.ts`:

| Type                          | Description                                                                 |
| ----------------------------- | --------------------------------------------------------------------------- |
| `PlaidLinkTokenCreateRequest` | Input for link token creation                                               |
| `PlaidAccessToken`            | Stored access token record (encrypted)                                      |
| `TokenType`                   | `"ITEM"` \| `"INCOME_VERIFICATION_BANK"` \| `"INCOME_VERIFICATION_PAYROLL"` |
| `PlaidWebhookData`            | Discriminated union of ITEM and ASSETS webhook payloads                     |
| `PlaidItemWebhookData`        | ITEM webhook payload shape                                                  |
| `PlaidAssetWebhookData`       | ASSETS webhook payload shape                                                |
| `PlaidAssetReportRequest`     | Asset report request record                                                 |

`PlaidCompleteRow` is defined in `service/plaid/data.ts`.

## Related

- Service: `service/plaid/index.ts`, `service/plaid/data.ts`, `service/plaid/item.ts`, `service/plaid/asset.ts`
- Webhook service: `service/webhook.ts`
- Hooks: `hooks/plaid/index.ts`, `hooks/plaid/asset.ts`, `hooks/plaid/item.ts`
- Types: `types/plaid.d.ts`
- Constants: `constant/collection-name.ts`
- Client page: [My Accounts](../client-pages/MY_ACCOUNTS.md)
- Components: `components/PlaidLink.tsx`, `components/PlaidLinkIncomeBank.tsx`, `components/PlaidLinkIncomePayroll.tsx`

## Environment Variables

| Variable                        | Required | Description                                              |
| ------------------------------- | -------- | -------------------------------------------------------- |
| `PLAID_CLIENT_ID`               | Yes      | Plaid API client ID                                      |
| `PLAID_SECRET`                  | Yes      | Plaid API secret key                                     |
| `PLAID_ENV`                     | Yes      | Plaid environment (`sandbox`, `production`)              |
| `PLAID_COUNTRY_CODES`           | No       | Comma-separated country codes (default: `US`)            |
| `PLAID_PRODUCTS`                | No       | Comma-separated Plaid products (default: `transactions`) |
| `OPTIONAL_PLAID_PRODUCTS`       | No       | Optional Plaid products                                  |
| `REQUIRED_IF_SUPPORTED`         | No       | Required-if-supported Plaid products                     |
| `ADDITIONAL_CONSENTED_PRODUCTS` | No       | Additional consented Plaid products                      |
| `PLAID_REDIRECT_URI`            | No       | OAuth redirect URI for Plaid Link                        |
