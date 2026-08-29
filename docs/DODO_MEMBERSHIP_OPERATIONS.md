# Dodo Membership Operations Runbook

The architecture and state model are defined in [`dodo-membership-lifecycle-plan.md`](../plans/dodo-membership-lifecycle-plan.md). This runbook covers production configuration and rollout.

## Dodo dashboard configuration

1. Confirm the Starter, Pro, and Executive product IDs are monthly recurring products.
2. Enable Recovery payment retries with a 13-day retry window.
3. Configure the verified webhook URL as `/api/payments/dodo`.
4. Subscribe the endpoint to `payment.succeeded` and all subscription lifecycle events: `subscription.active`, `subscription.renewed`, `subscription.on_hold`, `subscription.plan_changed`, `subscription.cancelled`, `subscription.failed`, and `subscription.expired`. These events synchronize both memberships and subscription-based addons.
5. Enable Customer Portal payment-method updates, cancellation, invoices, and the desired plan-change options.

## Application configuration

Set `DODO_RETRY_WINDOW_DAYS=13` in the Next.js/App Hosting environment. It must remain equal to the Dodo Recovery retry window. Keep the existing Dodo API key, webhook key, product IDs, return URL, and public application URL configured.

The app creates normal recurring memberships in [`createMembershipCheckoutConfig()`](../service/dodo/index.ts:239) and recurring Credit Repair Addons in [`createAddonCheckoutConfig()`](../service/dodo/index.ts:281). Both checkout flows reuse the client’s existing Dodo customer when available. A verified subscription lifecycle webhook—not the checkout return page or `payment.succeeded` event—controls paid access.

## Firebase scheduled function configuration

Configure the deployed Functions environment using [`env.membership.example`](../functions/env.membership.example):

- `FIREBASE_DB_NAME`: `ceg-united-db-staging` or `ceg-united-db-production`.
- `APP_URL`: public origin used for Membership Settings email links.
- `MEMBERSHIP_DUNNING_ENFORCEMENT`: initially `false`.

Deploy [`processMembershipDunning`](../functions/src/membershipDunning.ts:47) and the Firestore indexes before enabling enforcement. The function runs hourly but queues an email only when `nextReminderAt` is due, so reminders remain at least 48 hours apart.

## Safe rollout procedure

1. Deploy the app/webhook changes, indexes, and scheduled function with enforcement disabled.
2. Call the admin-only reconciliation endpoint with `{ "apply": false }`: `POST /api/admin/dodo/memberships/reconcile`.
3. Review the report in `dodo-membership-reconciliations/{runId}` and investigate all `provider_lookup_failed` records.
4. Call the endpoint with `{ "apply": true }` only after the inventory is approved. Recurring records are synchronized; on-demand and unmapped records are marked legacy and are not automatically revoked or charged.
5. Validate test-mode lifecycle transitions and recovery emails.
6. Set `MEMBERSHIP_DUNNING_ENFORCEMENT=true` only after observe-only logs and legacy classifications are approved.

## Expected lifecycle behavior

- `active` or `renewed`: the affected membership or addon receives paid entitlement; reminder state is cleared.
- `on_hold`: the affected membership or addon receives grace entitlement for 13 days; the first reminder is sent at the next hourly run and subsequent reminders every 48 hours.
- recovered `active`: paid entitlement restored and reminders stopped.
- terminal `failed`, `expired`, or immediate cancellation: only the affected subscription loses access and receives one idempotent access-ended email. A membership becomes effectively Free; an addon becomes inactive.
- cancellation at period end: access remains paid through the provider period boundary.
- missed terminal event: the scheduler enforces Free access at `retryAccessUntil` only when enforcement is enabled.

## Customer support workflow

Direct clients to `/settings/membership`. The page displays separate cards for the CEG Brain membership and each subscription addon. All cards open a fresh portal session through [`GET`](../app/api/user/[userId]/dodo/customer-portal/route.ts:13), where subscriptions belonging to the shared Dodo customer can be managed together. Never request card numbers or CVC by email, chat, logs, or internal forms.

## Monitoring and rollback

Monitor failed webhook documents, reconciliation summaries, scheduled-function errors, grace memberships beyond their deadline, and Trigger Email delivery failures for `MEMBERSHIP_PAYMENT_RETRY` and `MEMBERSHIP_ACCESS_ENDED`.

Rollback scheduler enforcement by setting `MEMBERSHIP_DUNNING_ENFORCEMENT=false`. This stops scheduler-driven downgrades without disabling webhook synchronization, billing management, or payment recovery.
