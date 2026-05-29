# Paywall Implementation Plan

This document outlines the step-by-step plan to implement the CEG Brain Paywall system based on the provided requirements, along with a log of all modifications made to date.

## Overview

The CEG Brain platform is transitioning to a freemium/paywall model. Users register for free to receive preliminary analysis, but must purchase a membership to unlock real credit pulls, advanced underwriting, and access to specific lenders.

## Pricing & Tiers

- **Tier 1 (Starter):** $297/month (Includes 1 funding category, 6 lenders)
- **Tier 2 (Pro):** $397/month (Includes 2 funding categories, 12 lenders)
- **Tier 3 (Executive):** $697/month (Includes ALL funding categories, 12 lenders per category)
- **Credit Module Pro (Add-on):** $197/month
- **Early Refresh Fee:** $99 per refresh
- **One-Time Unlocks:** $999 each (Personal Unlimited, Business Unlimited, SBA/Commercial Unlimited)

---

## Step-by-Step Implementation & Changelog

### Step 1: Manage Global Fee Settings (Completed)

- [x] Updated `service/fee-settings.ts` schema to include all new paywall-related fees (`tierStarterPrice`, `tierProPrice`, `tierExecutivePrice`, `creditModuleProAddonPrice`, `earlyRefreshFee`, `personalUnlimitedUnlockFee`, `businessUnlimitedUnlockFee`, `sbaUnlimitedUnlockFee`).
- [x] Updated `app/(admin)/admin/fee-settings/page.tsx` to add UI fields for managing these fees from the admin dashboard.
- [x] Set initial default values to match the pricing documentation to ensure smooth fallback before database initialization.

### Step 2: Paywall UI & Database Integration (Completed)

- [x] Created `updatePathwayStatus` in `service/apply-funding.ts` to allow specific pathway statuses to be updated without modifying the global application status.
- [x] Built the dynamic `PricingPlans` UI Component (`components/pricing-plans/PricingPlans.tsx`) to display the three tiers and the Credit Module Pro Add-on, loading live prices directly from the fee settings.
- [x] Replaced direct routing on the "Unlock to Apply" button in `components/funding/funding-list.tsx` for non-premium users with a responsive dialog that displays the `PricingPlans` component.
- [x] Added `activateUserMembership` and `getUserMembership` inside `service/membership.ts` to handle database creation of a new `user/{userId}/membership` subcollection and update the global `user.isPremiumClient` flag.

### Step 3: Payment Provider Integration via Whop (Completed)

- [x] Updated `service/whop/index.ts` by adding `createMembershipCheckoutConfig`.
- [x] Environment variable mapping: Configured to pull specific product IDs (`WHOP_PRICING_PLAN_STARTER_ID`, `WHOP_PRICING_PLAN_PRO_ID`, `WHOP_PRICING_PLAN_EXECUTIVE_ID`, `WHOP_CREDIT_MODULE_PRO_ID`).
- [x] Created a `one_time` Whop checkout session config dynamically priced via cents to accurately map the user to the correct recurring billing interval.
- [x] Created `MembershipCheckoutView.tsx` to gracefully embed the secure Whop checkout iframe directly within the application via a slide-out `Sheet`.
- [x] Connected the `handleComplete` success callback to invoke `activateUserMembership`, finalizing the transaction.

### Step 4: Settings & Membership Management (Completed)

- [x] Added a `Membership` navigation link to `constant/common.ts` for both Client and Admin sidebar configurations.
- [x] Created `app/(settings)/settings/membership/page.tsx` to display the user's active membership details (Plan Name, Amount, Status, and Date Started).
- [x] Implemented a visually polished `CancelMembershipButton` using `shadcn`'s `AlertDialog` component to prompt users for confirmation before deactivating their membership.

### Step 5: Enforcement Logic (Pending)

- [ ] Implement logic to restrict access to real credit pulls and advanced underwriting if `isPremiumClient` is false or the membership `status` is inactive.
- [ ] Enforce lender visibility limits (e.g., show only 6 lenders for Starter, 12 for Pro).
- [ ] Enforce category restrictions based on the user's selected categories during signup.
- [ ] Restrict access to the Dispute Module unless the user has the `credit_module_pro` flag or add-on.
- [ ] Implement the 30-day refresh lock, bypassing only if an Early Refresh fee is paid.

### Step 6: Early Credit & Funding Refresh Logic (Pending)

- [ ] Implement UI for users to voluntarily purchase an "Early Refresh".
- [ ] Connect Early Refresh to payment gateway.
- [ ] Wire successful Early Refresh payment to bypass the lock and pull fresh reports.
