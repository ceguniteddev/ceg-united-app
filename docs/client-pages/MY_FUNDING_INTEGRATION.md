# Integrating My Funding View into Income Funding Pathways

## Overview

This document outlines how the application handles the transition from the document collection phase to displaying approved offers for different funding pathways. Specifically, it details how the `income-funding` page integrates the `my-funding` page's offer list for non-income-based pathways.

## The Goal

When a user applies for a secondary funding pathway (e.g., `credit_card_stacking`, `business_loc`, `personal_loan`, `personal_credit_card`) and their deal reaches the `"offers-ready"` status, the application should display the comprehensive list of bank products from the `my-funding` view, rather than the standard `OffersView` which is primarily designed for the initial `income_based` pathway.

## Implementation Details

### 1. Component Composition

Instead of redirecting the user to a completely different URL (which could break their navigation flow or back-button history), the `app/(client)/client/income-funding/page.tsx` directly imports and renders the `FundingBankProducts` component from the `my-funding` directory.

```tsx
import { FundingBankProducts } from "../my-funding/_funding/ApplyFundingList";
```

### 2. Conditional Rendering Logic

Inside the main `IncomeFunding` component, the `renderView()` function handles the dynamic rendering based on the `deal.status`.

When `deal.status === "offers-ready"`, the system checks the `selectedPathwayId`:

- **Income Based (`income_based`)**: Renders the standard `<OffersView />`.
- **Other Pathways**: Renders the embedded `<FundingBankProducts />`.

```tsx
case "offers-ready":
  if (selectedPathwayId !== "income_based") {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Available Offers</h2>
          <p className="text-sm text-gray-500">Review and select from your approved funding products.</p>
        </div>
        <section className="flex w-full flex-col gap-6">
          <FundingBankProducts selectedReference={selectedReference} />
        </section>
      </div>
    );
  }
  return (
    <OffersView deal={deal} onSelect={selectOffer} onSkip={skipOffer} />
  );
```

### 3. State Management Continuity

The `income-funding` page already maintains a `selectedReference` state (to filter applications by date/reference number). This state is seamlessly passed down to the `FundingBankProducts` component:

```tsx
<FundingBankProducts selectedReference={selectedReference} />
```

This ensures that the embedded offers list automatically filters to show only the offers relevant to the specific application the user is currently viewing, maintaining perfect context parity with the rest of the page.

## User Flow Summary

1. User completes Pre-Approval.
2. User selects a pathway like `credit_card_stacking`.
3. User uploads any requested documents and clicks Submit.
4. User sees the `"Under Review"` screen (`SubmittedView.tsx`).
5. Admin updates the deal to include an offer (status becomes `"Pre-Approved"` globally, which triggers `"offers-ready"` locally).
6. The `income-funding` page updates. Because `selectedPathwayId !== "income_based"`, it renders the `FundingBankProducts` component, allowing the user to view and interact with their new credit-based offers directly within the same page context.
