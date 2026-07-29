# AI Weekly CEO Briefing — Prompt Template

Used by `ai-weekly-briefing.ts`. This file is loaded at runtime (not hard-coded
in the function) so Julian's team can tune tone/structure without redeploying
code — just edit this file and redeploy `functions` (static require, bundled
at build time; see loader note at the bottom).

The system swaps between **OpenAI GPT-4o** and **Anthropic Claude** based on
the `AI_PROVIDER` env var. Both providers receive the *same* prompt below —
only the SDK call differs (see `ai-weekly-briefing.ts`).

---

## System Prompt (both providers)

```
You are the analytics chief of staff for CEG United, a financial-technology
company that helps small businesses access capital ("funding") and operates
"CEG Brain," a client-facing app for credit/fundability audits.

You write a 1-page CEO briefing every Monday morning summarizing the past 7
days of business performance across Revenue, Marketing, Brain (product),
Funding, Ops, Client Success, Broker channel, and Executive roll-ups.

Rules:
- Be blunt and specific. Cite actual numbers, not vague adjectives.
- Never invent numbers not present in the provided KPI data.
- If a KPI is missing or an adapter failed this week, say so plainly instead
  of guessing.
- Anomalies must name a plausible, data-grounded suspected cause — not just
  "this changed." Look for correlated moves across KPIs (e.g. CPL spiked the
  same week ad spend was cut, or approval rate dropped the same week a new
  lender criteria took effect) as your first hypothesis.
- Recommended actions must be concrete and assignable to a department
  (e.g. "Marketing: shift $2K/week from Meta to Google based on 40% lower
  blended CPL this week" — not "improve marketing").
- Keep the ENTIRE output to roughly one printed page (500-700 words).
- Output valid Markdown with EXACTLY these five ## sections, in this order:
  TL;DR, Wins, Losses, Anomalies, Recommended Actions, Deep Dives.
```

---

## User Prompt Template

```
Business: CEG United
Week: {{weekId}} ({{rangeStart}} to {{rangeEnd}})

This week's aggregated KPI snapshots (7 daily snapshots merged, showing
week-over-week deltas vs. the prior 7-day period):

{{kpiTableMarkdown}}

Adapter health this week:
{{adapterHealthSummary}}

Targets/benchmarks for reference:
{{targetBenchmarksMarkdown}}

Write the briefing now, following the system prompt rules exactly. Use the
following section structure:

## TL;DR
(exactly 3 bullets, one sentence each)

## Wins
(bullet list — what improved vs. last week, with the specific delta)

## Losses
(bullet list — what worsened vs. last week, with the specific delta)

## Anomalies
(bullet list — statistical outliers, each with a suspected cause in
parentheses)

## Recommended Actions
(3-5 numbered, concrete, department-tagged next steps)

## Deep Dives
(bullet list of KPI ids worth a closer look next week, with a one-line
reason each)
```

---

## Example Input (abridged)

```
Business: CEG United
Week: 2026-W30 (2026-07-20 to 2026-07-26)

This week's aggregated KPI snapshots:
| KPI | This Week | Last Week | Δ |
|---|---|---|---|
| closeRate | 22% | 27% | -5pp |
| totalLeads | 184 | 171 | +7.6% |
| cplMeta | $142 | $98 | +44.9% |
| adSpendMeta | $6,100 | $9,300 | -34.4% |
| approvalRate | 58% | 64% | -6pp |
| avgApprovalAmount | $71,200 | $68,500 | +3.9% |
| tasksOverdue | 19 | 8 | +137.5% |
| auditShowRate | 76% | 81% | -5pp |
| mrr | $184,300 | $179,900 | +2.4% |

Adapter health this week: All 7 adapters healthy, 100% snapshot coverage
(7/7 days).

Targets: Close Rate 20-35%, Approval Rate 60%+, Avg funding per client
$30K-$100K+, Revenue per lead $5K-$6K, LTV:CAC 3:1+.
```

## Example Output

```markdown
## TL;DR
- MRR grew 2.4% week-over-week to $184.3K, but close rate slipped to 22%
  (still in target range, trending toward the floor).
- Meta CPL jumped 45% after ad spend was cut 34% — the channel got less
  efficient, not more, when we pulled back budget.
- Approval rate dropped below the 60% target to 58%, the first miss in
  several weeks, while overdue Ops tasks more than doubled.

## Wins
- MRR: $179,900 → $184,300 (+2.4%), continuing positive growth trend.
- Total leads: 171 → 184 (+7.6%) despite lower Meta spend, suggesting Google
  and/or organic picked up slack.
- Avg approval amount: $68,500 → $71,200 (+3.9%), still comfortably inside
  the $30K-$100K target band.

## Losses
- Close rate: 27% → 22% (-5pp), dropping toward the bottom of the 20-35%
  target range.
- Approval rate: 64% → 58% (-6pp), now BELOW the 60% target for the first
  time this month.
- Audit show rate: 81% → 76% (-5pp).
- Tasks overdue: 8 → 19 (+137.5%), a sharp ops backlog spike.

## Anomalies
- Meta CPL rose 45% in the same week Meta spend was cut 34% (suspected
  cause: reduced budget likely dropped the account out of an efficient
  bidding cohort/audience, a common Meta auction-learning-phase reset).
- Tasks overdue more than doubled in one week with no corresponding change
  in completed-on-time rate reported (suspected cause: a backlog of
  newly-created tasks, not a sudden drop in team output — check task
  creation volume next week).
- Approval rate and close rate both fell in the same week (suspected cause:
  worth checking whether a specific lender tightened criteria, since both
  funnel stages softened simultaneously).

## Recommended Actions
1. Marketing: Restore Meta budget toward the prior $9K/week level, or pause
   spend changes for 1 week to let the algorithm re-stabilize before judging
   CPL.
2. Funding: Pull the list of this week's declined approvals and check for a
   concentration on one lender/product — confirm whether criteria changed.
3. Ops: Audit the 19 overdue tasks by creation date — if most are <7 days
   old, this is a volume spike, not a slowdown; reassign or add capacity to
   the affected owner(s).
4. Sales: Review the qualifiedLeads → closedDeals funnel for this week's
   184 leads to see where the close-rate drop is concentrated (top-of-funnel
   quality vs. late-stage negotiation).
5. Success: Investigate the 5pp audit show-rate dip — confirm reminder SMS/
   email automations fired on schedule this week.

## Deep Dives
- approvalRate — first sub-60% week in the recent trend; needs root cause
  before next Monday.
- tasksOverdue — confirm whether this is a one-week blip or the start of a
  capacity problem.
- cplMeta — re-check after budget is restored to confirm the auction-reset
  hypothesis.
```

---

## Loader Note (for the dev wiring this up)

`ai-weekly-briefing.ts` reads this file at build time via:

```ts
import { readFileSync } from "fs";
import { join } from "path";

const PROMPT_TEMPLATE = readFileSync(
  join(__dirname, "ai-briefing-prompt.md"),
  "utf-8"
);
```

Make sure your `functions/tsconfig.json` / deploy step includes this `.md`
file in the deployed bundle (Firebase Functions deploys the whole `functions/`
directory by default, so no extra config is needed unless you've added a
`.gcloudignore` that excludes `*.md`).
