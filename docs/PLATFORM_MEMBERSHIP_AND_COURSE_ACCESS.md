# Platform Membership and Course Access Policy

## Audience

This document is the shared product and operations reference for customer support, sales, administrators, and engineering. The implementation design and rollout checklist are maintained in [`platform-membership-course-entitlements-plan.md`](../plans/platform-membership-course-entitlements-plan.md).

## Customer offer

### Free account

Every newly registered Client starts with a Free account.

Free access includes:

- signing in and using the client home experience
- viewing available education products and owned courses
- income-based funding

Free access does not include paid audit, diagnostic/analysis, credit-report, dispute, or broader funding tools.

### CEG Brain Platform Access

CEG Brain Platform Access is one monthly recurring membership. Its initial price is **$499 per month**, but administrators may change the price for future checkouts through fee settings.

Platform Access provides the paid baseline:

- audit and diagnostic features
- analysis features
- credit-report features
- the approved baseline platform experience
- eligibility to use separately purchased course capability grants

There are no customer-facing Starter, Pro, or Executive membership plans for new sales.

### Education courses

Courses are separate, optional purchases. A Client may purchase Platform Access without first buying a course.

| Course                       | Initial price | Course content received | Additional tool access while Platform Access is active |
| ---------------------------- | ------------: | ----------------------- | ------------------------------------------------------ |
| Credit to Capital            |        $2,000 | Credit to Capital only  | Credit dispute module                                  |
| How to Raise Your First $50K |        $5,000 | First $50K only         | Former Starter tool set                                |
| How to Access Up to $150K    |       $15,000 | Up to $150K only        | Former Starter + Pro tool sets                         |
| How to Access $250K+         |       $25,000 | $250K+ only             | Former Starter + Pro + Executive tool sets             |

Higher course purchases accumulate tool permissions but do not include lower course content. For example, purchasing the $250K+ course provides the cumulative tool set but does not enroll the Client in the other three courses.

Credit dispute access is independent: it is granted by Credit to Capital and is not automatically included with Courses 2–4.

## Access examples

- A Free Client can use income-based funding and review course offers.
- A Client with Platform Access but no course can use paid baseline audit, analysis, and credit-report features, but not disputes or course-expanded funding tools.
- A Client with Platform Access and First $50K can use the former Starter funding tools and view the First $50K course.
- A Client with Platform Access and Up to $150K can use the former Starter and Pro tool sets, but cannot view Credit to Capital unless it was separately purchased.
- A Client who owns Credit to Capital and $250K+ receives dispute access plus the cumulative Starter, Pro, and Executive tool sets while Platform Access remains paid or in grace.
- If Platform Access expires, purchased course enrollments remain recorded and course content remains available, but paid platform tools and course-derived financial tools are suspended.

## Existing-member protection

Existing Starter, Pro, and Executive members are grandfathered operationally.

The migration must not change their:

- stored tier
- current price
- Dodo product or subscription
- customer or subscription identifiers
- billing dates
- paid, grace, cancellation, retry, failed, or expired lifecycle behavior

Their current permissions remain available only while their existing membership is paid or within its valid grace period. Existing lifecycle rules still remove access after terminal failure, expiration, immediate cancellation, or grace expiry.

The old tier names remain available internally only for compatibility and permission mapping. They must not appear in new customer sales or upgrade experiences.

## Onboarding policy

New Clients should receive a short, resumable onboarding experience:

1. Explain Free access and income-based funding.
2. Explain Platform Access and its current monthly fee.
3. Explain that courses provide education plus additional capability grants.
4. Direct the Client to the dashboard with a summary of current and locked access.

Onboarding is educational, not a forced checkout. Clients may skip it and return through a persistent access center. Legacy paid members should not be shown new-customer sales onboarding.

Free Clients should see a dismissible Platform Access banner. Locked features should explain the missing requirement and link to the relevant membership or course purchase instead of silently redirecting.

## Payment and activation rules

- Membership and course prices shown in the browser are informational; checkout amounts and products are resolved by the server.
- Platform Access is activated only from verified subscription lifecycle events.
- Course enrollment and automatic capability grants are activated only from verified successful Dodo or Lumino payment evidence.
- A checkout return page or browser success callback is never proof of entitlement.
- Duplicate provider events must not create duplicate enrollment or grants.
- A manual or free course enrollment does not automatically grant financial-tool permissions.

## Admin operations

### Pricing

Administrators may change the Platform Access price for future membership checkout sessions. Existing subscriptions are not repriced by changing this setting.

Legacy membership fee values remain visible only as compatibility/operational settings until a separate retirement project is approved.

### Course configuration

Each capability-bearing course must have:

- a stable course key
- a configured price/provider product
- one approved capability grant
- capability grants enabled only after payment integration has been tested

Do not infer grants from a course title, URL, display order, or price.

### Manual grants

Course assignment and capability authorization are separate actions. When an exception is approved, an administrator must use a dedicated grant/revoke action and provide a reason. The system records the admin identity and timestamps for audit.

The current admin interface is available at `/admin/course-capability-grants`.
Before enabling new sales, configure `DODO_PRODUCT_MEMBERSHIP_PLATFORM_ID` as a
monthly recurring Dodo product and verify all subscription lifecycle webhook
events in test mode.

## Support decision guide

1. **Can the Client sign in?** If no, resolve authentication separately from billing.
2. **Is Platform Access paid or in valid grace?** If no, only Free features and owned course content are available.
3. **Is the Client grandfathered?** If yes, resolve the unchanged legacy tier to its former permission set.
4. **Does the Client have verified course grants?** Merge all active grants; do not rely only on enrollment display.
5. **Is the requested feature globally enabled?** A global safety switch may still deny access.
6. **Is payment missing or ambiguous?** Do not grant automatically. Escalate for payment reconciliation or an explicit audited admin decision.

## Terminology

- **Platform Access** — the one variable-price monthly CEG Brain membership sold to new Clients.
- **Paid baseline** — audit, diagnostic/analysis, credit-report, and approved base platform capabilities.
- **Course enrollment** — permission to view one purchased course's educational content.
- **Capability grant** — verified evidence that a course purchase or explicit admin decision adds tools.
- **Legacy permission level** — internal Starter, Pro, or Executive compatibility mapping; not a customer-facing plan.
- **Grace** — temporary continued access during payment recovery according to the existing membership lifecycle.
