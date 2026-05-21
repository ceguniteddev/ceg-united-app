# API Security Audit & Role-Based Access Control (RBAC) Remediation Plan

## 1. Executive Summary

During a security review, a critical vulnerability was identified in the API routing and authentication layer. While the frontend application correctly enforces role-based routing (preventing Clients from viewing Admin pages via `proxy.ts`), the backend API routes (`/api/*`) do not universally enforce these role checks.

Because of this, a user logged in with a `Client` role can extract their `auth_token` session cookie and manually execute requests against Admin-only API endpoints (e.g., via Postman, cURL, or custom scripts).

This document outlines the root cause of the vulnerability, categorizes the affected endpoints, and provides a clear, low-impact implementation plan to resolve the issue while maintaining compatibility with external integrations like `n8n`.

---

## 2. Root Cause Analysis

### A. Middleware Bypass (`proxy.ts`)

In the Next.js middleware (`proxy.ts`), role-based routing is strictly enforced for page routes (e.g., redirecting non-admins away from `/admin`). However, to allow API traffic and external tools (like webhooks or n8n) to function, API routes are explicitly allowed to bypass the role check if _any_ valid authentication token is present:

```typescript
// Inside proxy.ts
if (pathname.startsWith("/api/")) {
  if (xIdToken || adminAccessKey || token || authHeader || isPublic(pathname))
    return NextResponse.next(); // Allows ANY authenticated user to proceed
}
```

### B. Incomplete Validation in `withAuth`

API endpoints are wrapped in a higher-order function called `withAuth` (located in `lib/api-validation.ts`).

- `withAuth` successfully validates that the provided token (via `Cookie`, `Authorization` header, or `x-id-token`) is mathematically valid and not expired.
- **However, `withAuth` does not verify the user's role.**

Because the middleware allowed the request through, and `withAuth` only checks for token validity, a Client's token is considered "valid" when hitting an Admin endpoint.

---

## 3. How External Tools (Postman / n8n) Authenticate

The API is designed to accept authentication in several ways, which is highly flexible for tools like `n8n`. A valid token can be passed via:

1. **Cookie Header (Session Cookie):** `Cookie: auth_token=<firebase_session_cookie>` (This is what the Next.js frontend uses).
2. **Authorization Header (ID Token):** `Authorization: Bearer <firebase_id_token>`
3. **Custom Header (ID Token):** `x-id-token: <firebase_id_token>`
4. **Admin Access Key:** `ADMIN_ACCESS_KEY: <env_secret>` (Bypasses standard user auth for system-to-system calls).

_Note: Firebase ID Tokens expire in ~1 hour, while Firebase Session Cookies (used in the `auth_token` cookie) can last up to 14 days. When testing manually, you must pass the Session Cookie via the `Cookie` header, not as a Bearer token._

---

## 4. API Categorization & Affected Endpoints

To fix the vulnerability without breaking the system, APIs must be divided into two categories:

### Category 1: Strictly Admin APIs

These endpoints should **never** be accessed by a Client or Broker.

- **Path Pattern:** `/api/admin/*`
- **Examples:**
  - `GET /api/admin/banks`
  - `POST /api/admin/clients/add`
  - `GET /api/admin/income-funding`
  - `GET /api/admin/statistics`

### Category 2: Shared APIs (Client & Admin)

These endpoints are accessed by Clients (to view their own data inside `app/(client)/client/`) AND by Admins (to view a specific client's data inside `app/(admin)/admin/clients/[userId]`).

- **Examples:**
  - `GET/PUT /api/user/[id]` (User Profile)
  - `GET/POST /api/apply-funding` (Funding Applications)
  - `GET/PUT /api/business` (Business Information)
  - `GET/POST /api/documents` (Uploaded Documents)

---

## 5. Remediation Plan

The fix requires implementing RBAC at the API Route Handler level. This is a targeted change that will not disrupt `n8n` workflows or frontend components.

### Step 1: Create `withAdminAuth` Wrapper

In `lib/api-validation.ts`, a new wrapper will be created alongside `withAuth`. This wrapper will fetch the current user from the database and verify they hold an administrative role before allowing the handler to execute.

```typescript
import { getCurrentUser } from "@/service/user";
import { NextResponse, NextRequest } from "next/server";

export function withAdminAuth(handler: Handler): Handler {
  return async (req: NextRequest, context: any) => {
    // 1. Basic token validation
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;

    // 2. Role verification
    const currentUser = await getCurrentUser();
    const adminRoles = ["Admin", "Staff", "IT"];

    if (!currentUser || !adminRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    // 3. Execute API logic
    return handler(req, context);
  };
}
```

### Step 2: Secure Category 1 (Strictly Admin APIs)

Perform a codebase search for all files inside `app/api/admin/` and simply replace `withAuth` with `withAdminAuth`.

- **Change:** `export const GET = withAuth(async...`
- **To:** `export const GET = withAdminAuth(async...`

### Step 3: Secure Category 2 (Shared APIs)

For endpoints shared by both Admins and Clients, keep the standard `withAuth` wrapper. However, inject an "ownership" validation inside the handler logic to ensure Clients can only access their own data.

```typescript
// Inside a shared route like /api/user/[id]/route.ts
const currentUser = await getCurrentUser();
const requestedUserId = params.id; // From URL params

// If the user is NOT an admin, they can only access their own user ID
if (
  currentUser.role !== "Admin" &&
  currentUser.role !== "Staff" &&
  currentUser.uid !== requestedUserId
) {
  return NextResponse.json(
    { error: "Forbidden: Access denied" },
    { status: 403 },
  );
}
```

---

## 6. Post-Implementation Impact

- **Clients:** Will receive a `403 Forbidden` if they attempt to access `/api/admin/*` routes or modify data belonging to another `userId`.
- **Admins:** Will continue to have full access across the system.
- **External Integrations (n8n):** Will continue to function normally, provided the API requests are authenticated using an Admin user's token or the `ADMIN_ACCESS_KEY`.
