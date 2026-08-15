# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CEG United LLC — a Next.js 16 (App Router) financial services platform for business funding applications, tri-bureau credit reporting/repair, business management, and paid educational materials. Three user roles: **Admin**, **Client**, **Broker** (`RolesEnum` in `schema/users.ts`).

## Commands

```bash
npm run dev                 # dev server (Turbopack)
npm run build               # production build (Turbopack) — the main way to catch type errors
npm run lint                # eslint --fix
npm test                    # vitest run (all tests)
npm run test:watch
npm run test:coverage       # what CI runs (.github/workflows/test.yml)

npx vitest run __tests__/api/user/notes.test.ts        # single test file
npx vitest run -t "should return 400 when userId is missing"   # single test by name
```

Ops commands (from `README.md` / `firebase.json`):

```bash
# Deploy Firestore rules + indexes (two separate databases)
firebase deploy --only firestore:ceg-united-db-production --project ceg-united-llc-prod
firebase deploy --only firestore:ceg-united-db-staging   --project cegunitedllc

firebase firestore:indexes --database=ceg-united-db-staging >> firestore.indexes.json
gcloud storage buckets update gs://ceg-united-llc-prod.firebasestorage.app --cors-file=cors.json

npx tsx decrypt.ts --data "xxx" --iv "xxx"              # decrypt an encrypted field
ngrok http --domain=raccoon-robust-likely.ngrok-free.app 3000   # allowed dev origin in next.config.ts
```

`postinstall.mjs` copies TinyMCE assets from `node_modules` into `public/` — runs automatically on `npm install`.

## Architecture

### Route groups define role, layout, and permissions

`app/(admin)/`, `app/(broker)/`, `app/(client)/`, `app/(public)/`, `app/(settings)/`. A page's route group determines its sidebar/nav layout **and** how `proxy.ts` guards it. Putting a page in the wrong group silently gives it the wrong access rules.

### `proxy.ts` is the middleware (Next.js 16 rename)

There is no `middleware.ts` — Next 16 renamed it, and the exported function is `proxy()`. This is the **first** of two auth layers and does the heavy lifting:

- Verifies the `auth_token` session cookie, loads the user, and resolves the role.
- Role-fences both pages and API routes (`isAdminRoute`/`isBrokerRoute`/`isClientRoute`).
- Clients are default-deny on `/api/*`: only their own `/api/user/{uid}/...` and `/api/crs/{uid}/...` plus the explicit `CLIENT_ALLOWED_API_PREFIXES` list. **Adding a new client-facing API route requires adding its prefix here**, or clients get a 403.
- Enforces paywalls/entitlements before the page renders — active membership for `/client/my-analysis`, `/client/my-credit`, `/client/credit-repair`, `/client/income-funding/apply`; plus a `system-config` feature flag and the `credit_module_pro` addon for credit repair.
- `PUBLIC_ROUTES` + `isPublic()` is the allowlist for unauthenticated access.

The second layer is `withAuth()` from `lib/api-validation.ts`, which wraps every API handler. Its `authenticateRequest()` accepts, in order: `Authorization: Bearer`, `x-id-token`, `ADMIN_ACCESS_KEY` header (for system-to-system callers like n8n/webhooks), then the session cookie. Non-cookie callers bypass proxy role checks entirely and rely on `withAuth` alone.

### Dual Firebase SDKs, dual databases

- Client SDK: `lib/firebase.ts` — use in components.
- Admin SDK: `lib/fireabase-admin.ts` (note the typo in the filename, it's intentional/load-bearing) — `firestoreAdmin()`, `authenticationAdmin()`, `storageAdmin()`. Use in API routes and server actions.
- The Firestore instance is pinned to a **named database** via `FIREBASE_DB_NAME` (`ceg-united-db-staging` / `ceg-united-db-production`), not the `(default)` database. `ignoreUndefinedProperties: true` is set globally.
- Credentials come from `FIREBASE_PRIVATE_KEY_BASE64` (deployed) or individual `FIREBASE_*` vars (local).

Session cookies are minted server-side in `lib/session.ts` (`createSession`, 6-hour expiry) from a client-side Firebase ID token.

### Data flow: service → hook → component

- **`service/`** — `"use server"` modules holding all Firestore/Storage access and third-party API calls. These are Next.js server actions, so they are called **two ways**: imported directly into client hooks, or invoked inside API route handlers. Both patterns are live in `hooks/user.ts`; match whatever the neighbouring code does.
- **`hooks/`** — TanStack Query wrappers. Query keys come from `constant/react-query-keys.ts`; `toast` (sonner) feedback lives here, not in components.
- **Components** never touch Firestore directly.

### Naming constants are mandatory

- Firestore collections: `constant/collection-name.ts`. Never hardcode a collection string.
- React Query keys: `constant/react-query-keys.ts`. Use these for `invalidateQueries` too.

### Schemas

`schema/` holds Zod schemas; each file exports both the schema and its inferred type. Enums are Zod enums. `types/` holds hand-written types not derived from Zod (`funding-playbook.ts`, `crs.ts`, `banking.d.ts`, and global declarations in `index.d.ts`).

### API routes

`app/api/**/route.ts` exporting `GET`/`POST`/`PUT`/`DELETE`, each wrapped in `withAuth()`. Responses use the helpers in `app/api/helpers.ts` — `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `internalServerError()`, `handleApiError()`, plus `ensureJsonContentType()` and `getMessage(zodError)` for flattening Zod errors into user-readable strings. Throw `AppError` (`error/AppError.ts`) with a status code and let `handleApiError` translate it.

### Cloud Functions

`functions/` is a **separate npm package** with its own `package.json`/`node_modules` (document classification, Lob address verification + mail + webhooks, wallet). Deployed via `firebase deploy --only functions`; `npm install` at the repo root does not cover it.

## Domain concepts worth knowing

- **Multiple funding pathways** — one client can have several concurrent applications (income-based, credit card stacking, business LOC, personal loan). A global `status` plus a per-pathway `appliedPathways[]` array keeps them from clobbering each other; `hooks/useIncomeFundingState.ts` is the local state machine. See `docs/MULTIPLE_FUNDING_PATHWAYS.md`.
- **Credit repair wallet** — prepaid balance (Whop top-ups) so mailing a dispute letter is a single click without per-letter card fees. See `docs/CREDIT_REPAIR_WALLET.md`.
- **Funding Playbook** — AI-generated funding strategy (`lib/funding-playbook/`, `app/api/funding-playbook/`, `types/funding-playbook.ts`) using `@google/genai`, with its own prompt builder, AI router, rate limiter, and lender seed data.
- **Entitlements** are three separate things: role, membership status (`service/membership.ts`, cached — see `docs/MEMBERSHIP_CACHING.md`), and per-feature addons (`service/addons.ts`). Plus global kill switches in `service/system-config.ts`.

`docs/` contains feature-level design docs (registration flows, RBAC audit, letter types, email ingestion, logging, paywall plan). Read the relevant one before changing a subsystem — several describe deliberate state-machine decisions that aren't obvious from the code.

## Testing

Vitest + jsdom, ~123 test files under `__tests__/` mirroring source layout (`api/`, `hooks/`, `components/`, `lib/`, `service/`). `__tests__/setup.ts` stubs the Firebase/encryption env vars.

The standard API-route test pattern is to `vi.mock("@/lib/api-validation")` with `withAuth: (handler) => handler` (bypassing auth), `vi.mock` the service module, then import the route handler and call it with `{ params: Promise.resolve({...}) }` — params are async in Next 16.

Coverage is collected from `lib/`, `schema/`, `service/`, `hooks/` only.

## Deployment

Firebase App Hosting on Cloud Run. `apphosting.yaml` (production), `apphosting.staging.yaml`, `apphosting.registration.yaml` define env vars and secrets per backend. `next.config.ts` sets `output: "standalone"`, externalizes `@sparticuz/chromium`/`puppeteer-core` for PDF generation, and defines a strict CSP — **adding a third-party script, iframe, or API host requires updating the CSP directives there**, or it will be blocked in production only.

## Conventions

- Path alias `@/` for all imports (`tsconfig.json`, mirrored in `vitest.config.ts`).
- `cn()` from `lib/utils.ts` for conditional classes; Tailwind v4 + shadcn/Radix (`components/ui/`).
- `@typescript-eslint/no-explicit-any` is off and `any` is used liberally in existing code.
- Structured logging via `logInfo`/`logError` from `lib/logger.ts` (Google Cloud Logging); see `docs/LOGGER.md`.
- Encrypted PII fields use `lib/encryption.ts` with `ENCRYPTION_KEY` (AES-256).

## Also see

`.github/copilot-instructions.md` is a long-standing agent instruction file with additional detail on the design system (blue/gray financial palette, chart colors) and mobile-first responsive rules that apply to all new UI. Note it is partly stale: it documents a Plaid integration that no longer exists in this codebase.
