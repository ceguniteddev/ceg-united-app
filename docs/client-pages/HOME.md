# Home Dashboard

**Route:** `/client/home`

## Overview

Your Home dashboard acts as your "Financial Intelligence Center," providing a real-time overview of your funding readiness, financial profile, credit scores, and recent account activity.

## What You'll See

### Main Content (Left Panel)

- **Funding Metrics:** High-level summary of your Total Requested, Total Approved, and Total Funded amounts.
- **Credit Scores:** Current scores directly imported from major bureaus (Experian, TransUnion, Equifax).
- **My Businesses:** Quick-access cards displaying your connected business entities.
- **Financial Snapshot:** Insights drawn from your linked bank accounts, including Last Month's Deposits, Average Monthly Balance, and Average Monthly Income.

### Insights & Actions (Right Panel)

- **Fundability Score:** A visual ring chart metric showing your overall funding readiness score and its current status.
- **Next Steps Panel:** A dynamic checklist outlining the recommended actions required to improve your financial profile or complete your setup.
- **Application Status:** A donut chart visualizing the proportion of your funding applications by status (e.g., Pending, Approved).

### Credit Analysis

If your credit report contains flags, an **Issues Card** will appear highlighting:

- Analysis Notes
- Negative Items
- Derogatory Marks

## Visual Features

- **Charts:** Donut chart for Application Statuses, progress ring for Fundability Score.
- **Metric Cards:** Clean overview panels with skeleton loaders for smooth data fetching.
- **Status Indicators:** Color-coded badges representing various states of applications and credit health.
- **Celebration Modals:** Animated confetti pop-ups with a "Congratulations!" message triggered when significant milestones (like completing a funding audit) are reached.

## Quick Actions

From this page, you can:

- **Follow Next Steps** - Click through your personalized `NextStepsPanel` checklist.
- **View Audit Report** - Quickly navigate to `/client/my-funding` via milestone alerts.
- **Explore Businesses** - Access detailed reports for your registered businesses.

## Related

- [My Funding](MY_FUNDING.md)
- [My Credit](MY_CREDIT.md)
- Component: `components/ClientDashboard.tsx`
- Page Wrapper: `app/(client)/client/home/page.tsx`
- Data Hooks: `hooks/statistics.ts` -> `useGetClientStatistics()`
- Sub-components: Found in `components/dashboard/` (e.g., `MetricCards`, `FundabilityScoreCard`, `ApplicationStatusChart`)
