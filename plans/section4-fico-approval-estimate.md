# Section 4 — FICO-Driven Approval Estimate + UI Redesign

## Goal

1. Make the AI derive `section4_aiPersonalizedRange` explicitly from the client's **FICO score** (sourced from `crs-report-data` or `user-leads`), by surfacing a resolved primary FICO in the prompt and instructing the model to reason from it.
2. Redesign the Section 4 UI to match **image #1** ("Estimated Approval Amount"): confidence %, range slider with min/midpoint/tail, richer reasoning, an estimate note, and a "Top 3 inputs driving this estimate" panel.
3. Let the AI compute the numbers/weights — we only provide data + structure.

## Current Behavior (baseline)

- FICO resolution already exists in [`getClient()`](lib/funding-playbook/firestore-helpers.ts:164):
  - Reads bureau scores from `crs-report-data/{userId}/{experian|equifax|transunion}`.
  - Falls back to `user-leads` (`ficoCreditScore`, `creditScore`, `personalCreditScore`, `businessCreditScore`) then user-level `ficoCreditScore`.
  - Populates `client.creditReports[].score` and `client.creditScores`.
- Prompt [`buildPlaybookPrompt()`](lib/funding-playbook/prompt-builder.ts:81) passes `creditReports` but never highlights a single primary FICO nor ties the range to it.
- Range is clamped to +/-30% of documented band via [`validateApprovalRangeWithinBand()`](lib/funding-playbook/schemas.ts:91); on AI failure it collapses to the documented range with `low` confidence — the degraded state of image #2.
- UI [`ApprovalSection`](components/funding-playbook/Sections5to8.tsx:169) renders only range + lender-documented range + FICO-requirement mini panel.

## Target AI Output Contract (new Section 4 fields)

Add to `AIPlaybookReasoningOutputSchema`, `AIPlaybookReasoningOutput`, and `Section4_ApprovalEstimate`:

- `section4_confidencePct: number` (0-100) — numeric confidence to render the bar (e.g. 82%).
- `section4_estimateNote: string` — the blue note box text (min limit + where the band clusters + long-tail condition).
- `section4_topDrivers: Array<{ label: string; detail: string; weightPct: number; impact: "positive" | "negative" | "neutral" }>` — 3 items; each maps to a ranked row with a weighted bar. `impact` controls green vs red bar.

Existing kept: `section4_aiPersonalizedRange`, `section4_confidenceLevel`, `section4_aiReasoning`.

## Data Surfacing for the Prompt

In [`prompt-builder.ts`](lib/funding-playbook/prompt-builder.ts:24), enrich `serializeClientForPrompt` (needs the lender's `primaryBureau`) with a resolved FICO:

- `primaryFicoScore` — score for `lender.primaryBureau` from `creditReports`, falling back to any available bureau score / `creditScores`.
- `primaryFicoBureau` — which bureau the score came from.
- `ficoSource` — `"crs-report-data"` vs `"user-leads"` vs `"fallback"` for transparency.
- Keep passing full `creditReports` so the AI can compare bureaus.

## Prompt Instruction Changes

In the INSTRUCTIONS block of [`buildPlaybookPrompt()`](lib/funding-playbook/prompt-builder.ts:96):

- For `section4_aiPersonalizedRange`: instruct the model to anchor the range on the client's `primaryFicoScore` tier (Poor/Fair/Good/Very Good/Exceptional), then adjust for relationship depth, income/revenue, DTI, utilization, inquiries, and business-file age — while still staying inside the documented band expanded by at most +/-30%.
- Add `section4_confidencePct`: an integer 0-100 consistent with `section4_confidenceLevel`.
- Add `section4_estimateNote`: 1-2 sentences on the product's minimum limit, where the band clusters for this profile, and the long-tail condition.
- Add `section4_topDrivers`: exactly 3 objects, weights should sum to roughly 100, ordered most-influential first; cite the real FICO number/tier in driver #1; mark negatives (thin file, high utilization) with `impact: "negative"`.

## Route Wiring

In [`route.ts`](app/api/funding-playbook/generate/route.ts:1):

- `buildPlaybook` section4 mapping: pass through `confidencePct`, `estimateNote`, `topDrivers`.
- `buildFallbackAIOutput`: provide safe defaults — `confidencePct: 40`, a generic `estimateNote`, and a `topDrivers` array derived from FICO/relationship/denialReasons so the new UI never breaks in degraded mode.
- The +/-30% clamp stays; when clamped, also floor `confidencePct` to a low value (e.g. 30).

## UI Redesign — ApprovalSection (image #1)

Rewrite [`ApprovalSection`](components/funding-playbook/Sections5to8.tsx:169):

- Header title -> "Estimated Approval Amount"; subtitle references lender + product (e.g. "What {lender} is likely to extend on {product}").
- Aside chip -> "{Confidence} confidence" driven by `confidenceLevel`.
- Left column:
  - Dark gradient card: "ESTIMATED APPROVAL RANGE", big `lo – hi`, plus a horizontal track showing `min` (documented low), `midpoint` (computed = round((lo+hi)/2)), and `tail` (documented high). The filled segment spans lo->hi within the documented min->tail scale.
  - Confidence bar using `confidencePct` (reuse/extend [`ConfidenceBar`](components/funding-playbook/ProgressRing.tsx:110) to accept an explicit pct) + `aiReasoning` text beneath.
  - Blue note box rendering `estimateNote` (Layers/stack icon like the mock).
- Right column: "TOP 3 INPUTS DRIVING THIS ESTIMATE" — map `topDrivers` to numbered rows: rank, bold `label`, `weightPct` on the right, colored `detail` sublabel (green for positive, red for negative), and a weighted progress bar tinted by `impact`.
- **DECISION:** Fold `minFICORequired`/`clientMeetsMinFICO` into the estimate note area or a small footer strip beneath the range card (e.g. "Minimum FICO {n} - you meet it" / "below minimum"), matching image #1's cleaner layout. Remove the standalone "FICO Requirement" right-column panel.

## Backward Compatibility

- New fields are additive. Cached playbooks lacking them should be treated as stale for Section 4:
  - Either extend the cache-invalidation guard in [`getCachedPlaybook()`](lib/funding-playbook/firestore-helpers.ts:483) to also require `section4_approvalEstimate.topDrivers`, forcing regeneration.
  - And/or make the UI defensively default missing `topDrivers`/`confidencePct`/`estimateNote`.

## Test Impact

- Update `__tests__/lib/funding-playbook.test.ts` for the new schema fields and `validateApprovalRangeWithinBand` interactions.
- Add coverage for `buildFallbackAIOutput` producing valid `topDrivers`/`confidencePct`.

## Files To Change

- [`lib/funding-playbook/prompt-builder.ts`](lib/funding-playbook/prompt-builder.ts) — surface FICO, expand instructions.
- [`lib/funding-playbook/schemas.ts`](lib/funding-playbook/schemas.ts) — new Zod fields.
- [`types/funding-playbook.ts`](types/funding-playbook.ts) — new TS fields.
- [`app/api/funding-playbook/generate/route.ts`](app/api/funding-playbook/generate/route.ts) — mapping + fallback.
- [`components/funding-playbook/Sections5to8.tsx`](components/funding-playbook/Sections5to8.tsx) — UI redesign.
- [`components/funding-playbook/ProgressRing.tsx`](components/funding-playbook/ProgressRing.tsx) — optional ConfidenceBar pct param.
- [`lib/funding-playbook/firestore-helpers.ts`](lib/funding-playbook/firestore-helpers.ts) — optional cache-guard update.
- Tests as above.
