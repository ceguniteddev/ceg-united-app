# CEG United LLC - AI Coding Agent Instructions

## Project Overview

CEG United LLC is a Next.js 16 (App Router) financial services platform for funding applications, credit reporting, business management, and educational materials. The app serves three user roles: **Admin**, **Client**, and **Broker**, with distinct UI layouts and permissions.

## Architecture & Key Concepts

### Route Groups (Critical Pattern)

The app uses Next.js route groups to define role-based layouts:

- `app/(admin)/` - Admin dashboard with `SidebarAdmin` (see `app/(admin)/layout.tsx`)
- `app/(client)/` - Client portal with `Sidebar` and `UserBanners` (see `app/(client)/layout.tsx`)
- `app/(public)/` - Public-facing pages (login, registration)
- `app/(settings)/` - Settings pages with `SidebarSettings`

**Routing Rule**: Pages must be created within the appropriate route group to inherit the correct layout and permissions.

### Dual Firebase Architecture

The app maintains **two separate Firebase SDK instances**:

1. **Client-side** (`lib/firebase.ts`): For client-side operations using `initializeFirestore`, `getAuth`, `getStorage`
2. **Server-side** (`lib/fireabase-admin.ts`): For API routes using Firebase Admin SDK with custom database IDs

**Environment switching**: `NEXT_PUBLIC_ENVIRONMENT` controls Firebase config selection (production vs development).
**Custom database**: Set via `FIREBASE_DB_NAME` environment variable (e.g., `ceg-united-db-staging`).

### Authentication Flow

1. Client-side Firebase Auth (`authFirebase`) handles login
2. ID token sent to server to create session cookie via `createSession()` (see `lib/session.ts`)
3. Session cookie stored as `auth_token` (constant: `FIREBASE_TOKEN_NAME`)
4. API routes protected by `withAuth()` middleware (see `lib/api-validation.ts`)
5. Auth context (`provider/AuthContext.tsx`) manages user state, role, and `isOnboarded` status

**Auth verification hierarchy**: Bearer token → x-id-token header → ADMIN_ACCESS_KEY → session cookie

### Data Layer Pattern

**Service → Hook → Component** architecture:

- **Services** (`service/`): Firestore operations, returns typed data (e.g., `getUserById()`)
- **Hooks** (`hooks/`): React Query wrappers with cache keys from `constant/react-query-keys.ts`
- **Components**: Use hooks for data fetching, never call services directly

Example: `hooks/user.ts` → `useGetUser()` → queries `GET_USER` key → calls `service/user.ts::getUser()`

### Collection Naming Convention

All Firestore collection names are constants in `constant/collection-name.ts`. **Never hardcode collection names**.

Examples:

- `USER_COLLECTION` = "user"
- `USER_FUNDING_APPLICATION` = "user-funding-application"
- `COURSE` = "course", `USER_COURSE_ENROLLMENT` = "user-course-enrollment"

### API Route Structure

- All API routes use App Router format: `app/api/[resource]/route.ts`
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Protect with `withAuth()` wrapper: `export const GET = withAuth(async (req, context) => {...})`
- Use helper functions from `app/api/helpers.ts`: `badRequest()`, `unauthorized()`, `internalServerError()`

### Schema & Validation

- Zod schemas in `schema/` for all data models
- Export both schema and inferred type: `export const userSchema = z.object({...}); export type User = z.infer<typeof userSchema>;`
- Enums always defined as Zod enums: `export const ROLESEnum = z.enum(["Admin", "Client", "Broker"])`

## Development Commands

```bash
# Development with Turbopack
npm run dev

# Build for production (also uses Turbopack)
npm run build

# Start production server
npm start

# Linting
npm run lint

# Post-install copies TinyMCE assets to public/
npm run postinstall  # Auto-runs after npm install
```

**Note**: The project uses `--turbopack` flag for both dev and build. Postinstall script copies TinyMCE from node_modules to public folder (see `postinstall.mjs`).

## Key Integrations

### Plaid (Banking)

- Client SDK: `react-plaid-link` for bank linking UI
- Server SDK: `plaid` package for API calls
- Services: `service/plaid/` for link tokens, accounts, transactions
- Webhook endpoint: `app/api/plaid/webhook/route.ts` for account updates

### Mux (Video)

- Video player: `@mux/mux-player-react` component (`components/MuxVideoPlayer.tsx`)
- Upload: `@mux/mux-uploader-react` for course attachments
- Server: `lib/mux.ts` for Mux API operations
- Video data stored in `MUX_DATA` collection

### Firebase Storage

- Admin storage: `storageAdmin()` from `lib/fireabase-admin.ts`
- Client storage: `storage` from `lib/firebase.ts`
- Document uploads use signed URLs
- Files organized by user ID: `users/{userId}/documents/{filename}`

### reCAPTCHA Enterprise

- Implementation: `components/RecaptchaGate.tsx` loads reCAPTCHA script
- Validation: `lib/captcha/captcha.ts` for `createEnterpriseAssessment()`
- Used for: Login, registration, password reset
- Site key: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` environment variable

### TinyMCE Editor

- Rich text editor for course content and notes
- Assets copied to `public/tinymce/` via postinstall script
- Wrapper: `components/Editor.tsx` with `@tinymce/tinymce-react`

## Component Patterns

### shadcn/ui Components

- Base UI components in `components/ui/`
- Extended components in `components/ui/shadcn-io/` (banner, choicebox, dropzone, image-zoom)
- Custom composite components combine shadcn primitives (e.g., `ResponsiveDialog` switches Dialog/Drawer based on screen size)

### Role-Based Rendering

Use `useAuth()` hook to access user role and permissions:

```tsx
const { user, role, isAdmin, isOnboarded, loading } = useAuth();
```

Admin-only components should use `withAdminGuard()` HOC from `components/wrapper.tsx`.

### Form Patterns

- React Hook Form + Zod resolver for validation
- Custom form field: `CustomFormField` component with Field type enum
- Number formatting: `react-number-format` for currency/phone inputs

### Data Tables

- `@tanstack/react-table` for complex tables
- `SortableHeader` component for sortable columns
- `Pagination` component for multi-page tables

## Environment Variables

**Required for Firebase Admin**:

- `FIREBASE_PRIVATE_KEY_BASE64` (production) OR individual keys (development):
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
- `FIREBASE_DB_NAME` - Custom database ID
- `FIREBASE_STORAGE_NAME` - Storage bucket name

**Required for features**:

- `ENCRYPTION_KEY` - AES-256 key for `lib/encryption.ts` encrypt/decrypt functions
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` - reCAPTCHA site key
- `RECAPTCHA_SECRET_KEY` - reCAPTCHA server key
- `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` - Plaid integration
- `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` - Mux video platform

## Common Pitfalls

1. **Don't mix Firebase instances**: Use `db` (client) in components, `firestoreAdmin()` in API routes/server actions
2. **Path aliases**: Always use `@/` for imports (configured in `tsconfig.json` paths)
3. **Server actions**: Mark with `"use server"` directive (see `lib/session.ts` examples)
4. **Query invalidation**: Use constants from `react-query-keys.ts` for cache invalidation
5. **Route protection**: API routes need `withAuth()`, pages use `useAuth()` with redirect logic
6. **Type safety**: Leverage Zod schemas for both validation and TypeScript types
7. **Global types**: Use `types/index.d.ts` for global type declarations (e.g., `DropdownOption`, `AdminStatistics`)

## Documentation

Internal docs in `docs/` explain specific features:

- `ADMIN_COURSE_ENROLLMENT_UI.md` - Course enrollment system
- `ENROLLMENT_QUICK_START.md` - Quick start guide
- `USER_LEARNING_MATERIALS_IMPLEMENTATION.md` - Learning materials feature

## Quick Reference

- **Add new API route**: Create in `app/api/`, export `GET/POST/PUT/DELETE`, wrap with `withAuth()`
- **Add new page**: Place in appropriate route group `(admin)`, `(client)`, or `(public)`
- **Add new data fetch**: Create service function → wrap in React Query hook → use in component
- **Add new Firestore collection**: Define constant in `collection-name.ts` first
- **Add new schema**: Create in `schema/`, export Zod schema + inferred type
- **Deploy Firestore rules**: `firebase deploy --only firestore:ceg-united-db-production --project ceg-united-llc-prod`

## Code Style

- ESLint configured with Next.js defaults (see `eslint.config.mjs`)
- Disabled rules: `@typescript-eslint/no-explicit-any`, `no-unused-vars`, `no-unused-expressions`
- Tailwind CSS for styling with custom animations (`tw-animate-css`)
- Use `cn()` utility from `lib/utils.ts` for conditional classes
