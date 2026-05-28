# Paywall Implementation Plan

This document outlines the step-by-step plan to implement the CEG Brain Paywall system based on the provided requirements.

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

## Step-by-Step Implementation

### Step 1: Manage Global Fee Settings (Completed)

- [x] Update `service/fee-settings.ts` schema to include all new paywall-related fees (tier prices, early refresh, unlocks).
- [x] Update `app/(admin)/admin/fee-settings/page.tsx` to add UI fields for managing these fees from the admin dashboard.
- [x] Set initial default values to match the pricing documentation.

### Step 2: Database Schema Updates

- [ ] Update user schema to track subscription status (e.g., `subscriptionTier`, `subscriptionStatus`, `currentPeriodEnd`).
- [ ] Add fields for tracking purchased Add-ons (e.g., `hasCreditModulePro`).
- [ ] Add fields for tracking One-Time Unlocks (e.g., `hasPersonalUnlimited`, `hasBusinessUnlimited`).
- [ ] Add field for `lastRefreshDate` to enforce the 30-day refresh rule.

### Step 3: Payment Provider Integration

- [ ] Integrate payment provider (Stripe or Whop API).
- [ ] Create checkout sessions for each Membership Tier.
- [ ] Create checkout sessions for One-Time Unlocks and Early Refreshes.
- [ ] Handle Webhooks to update the user's database status upon successful payment, subscription cancellation, or renewal.

### Step 4: Paywall UI Components

- [ ] Create the Paywall Selection Screen (`components/PaywallPricing.tsx`).
- [ ] Display the 3 Tiers with their respective features and dynamic pricing loaded from `FeeSettings`.
- [ ] Create UI for purchasing Early Refreshes when users attempt to refresh before 30 days.
- [ ] Create UI inside the dashboard for users to purchase One-Time Unlocks.

### Step 5: Enforcement Logic (Middleware / API level)

- [ ] Restrict access to real credit pulls and advanced underwriting if `subscriptionStatus !== 'active'`.
- [ ] Enforce lender visibility limits (e.g., show only 6 lenders for Starter, 12 for Pro).
- [ ] Enforce category restrictions based on the user's selected categories during signup.
- [ ] Restrict access to the Dispute Module unless the user has the `hasCreditModulePro` flag.
- [ ] Implement the 30-day refresh lock, bypassing only if an Early Refresh fee is paid.

---

_This plan will be iteratively executed, with the Todo List tracking the current active step._
