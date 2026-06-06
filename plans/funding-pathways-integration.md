# Integration Plan for Funding Pathways

## Objective
Integrate the `FundingPathways` component into the existing Income-Based Funding flow. Specifically, it should appear after the user clicks "Continue to Submit Your File" in the `PreApprovalView`, while keeping the deal status as `"prequalified"`. The status should only progress to `"collecting-documents"` (or the appropriate next step) after the user selects a pathway and clicks "Continue to Offers".

## Previous Flow (Before Changes)
1. Status is `"prequalified"`.
2. `app/(client)/client/income-funding/page.tsx` renders `PreApprovalView`.
3. User clicks "Continue to Submit Your File" in `PreApprovalView`.
4. `onContinue` handler fires, immediately changing status to `"collecting-documents"`.

## New Flow (Implemented)
1. Status is `"prequalified"`.
2. `app/(client)/client/income-funding/page.tsx` checks a local state `showPathways`.
3. If `!showPathways`, it renders `PreApprovalView`.
4. User clicks "Continue to Submit Your File" in `PreApprovalView`.
5. The `onContinue` handler updates the local state `showPathways` to `true`. **(Status remains "prequalified" because FundingPathways is considered part of the PreApproval phase)**.
6. The page now renders the `FundingPathways` component.
7. The user selects a pathway and clicks "Continue to Offers".
8. The `FundingPathways` component triggers its `onContinue` handler, which then changes the status to `"collecting-documents"`.
9. If the user clicks "Back" in `FundingPathways`, `showPathways` is set back to `false`, returning them to the `PreApprovalView`.

## Implementation Steps

### 1. Relocate the Component
- Move `keys/FundingPathways.tsx` to `components/income-funding/FundingPathways.tsx` to keep it organized with the rest of the funding components.
- Import it directly into `app/(client)/client/income-funding/page.tsx` using `import FundingPathways from "@/components/income-funding/FundingPathways";`.

### 2. Update `app/(client)/client/income-funding/page.tsx`
- Import `FundingPathways`.
- Add a new local state: `const [showPathways, setShowPathways] = useState(false);`
- Update the `renderView` switch statement for `"prequalified"`:

```tsx
case "prequalified":
  if (showPathways) {
    return (
      <FundingPathways
        clientFirstName={/* extract first name from user session if available */}
        onContinue={(selectedPathway) => {
          // Persist the selected pathway if needed here
          console.log("Selected Pathway:", selectedPathway);
          setStatus("collecting-documents");
        }}
        onBack={() => setShowPathways(false)}
      />
    );
  }
  
  return (
    <PreApprovalView
      deal={deal}
      realDeal={realDeal}
      onContinue={() => setShowPathways(true)}
    />
  );
```

### 3. Verify `PreApprovalView.tsx` Behavior
- The `PreApprovalView` already receives `onContinue` and calls it when the main button is clicked. No major structural changes are needed inside this component, as the state management happens in the parent (`page.tsx`).

## Next Steps
Please review this plan. If you approve, switch to **Code** mode and provide instructions to implement these changes.