import { z } from "zod";

export const bureaus = ["experian", "equifax", "transunion"] as const;
export const categories = [
  "au",
  "rent",
  "installment",
  "revolving",
  "bills",
  "cards",
] as const;

export type Bureau = (typeof bureaus)[number];
export type Category = (typeof categories)[number];

export const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const nonnegative = z.number().finite().nonnegative();
const timestamp = z.string().datetime();

export const accountSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(180),
  ownership: z.enum(["primary", "au"]),
  kind: z.enum(["revolving", "installment", "rent", "bill"]),
  status: z.enum(["open", "closed"]),
  positive: z.boolean(),
  balance: nonnegative.nullable(),
  limit: nonnegative.nullable(),
  originalPrincipal: nonnegative.nullable().default(null),
  openedAt: timestamp.nullable(),
  bureaus: z.array(z.enum(bureaus)).min(1),
  providerId: idSchema.nullable().default(null),
  // Trusted ingestion link to a specific enrollment
  enrollmentId: idSchema.optional(),
});

export const reportSchema = z
  .object({
    id: idSchema,
    pulledAt: timestamp,
    source: z.string().min(1).max(120),
    scores: z.array(
      z.object({
        bureau: z.enum(bureaus),
        model: z.string().min(1).max(80),
        value: z.number().int().min(0).max(900),
        pulledAt: timestamp.optional(),
        delta: z.number().int().optional(),
        prevScore: z.number().int().optional(),
      }),
    ),
    accounts: z.array(accountSchema).max(1000),
    negativeCount: z.number().int().nonnegative(),
    hardInquiries6m: z.number().int().nonnegative(),
  })
  .superRefine((r, c) => {
    if (new Set(r.accounts.map((a) => a.id)).size !== r.accounts.length)
      c.addIssue({
        code: "custom",
        message: "Duplicate canonical account IDs",
      });
    if (
      new Set(r.scores.map((s) => `${s.bureau}:${s.model}`)).size !==
      r.scores.length
    )
      c.addIssue({ code: "custom", message: "Duplicate bureau/model scores" });
  });

export type CreditReport = z.infer<typeof reportSchema>;
export type CreditAccount = z.infer<typeof accountSchema>;

export const providerSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(150),
  category: z.enum(categories),
  url: z
    .string()
    .url()
    .refine((s) => s.startsWith("https://"), "HTTPS required"),
  status: z.enum(["draft", "published", "retired"]),
  version: z.number().int().positive(),
  instructions: z.array(z.string().min(1).max(1500)).min(1).max(15),
  sourceUrl: z
    .string()
    .url()
    .refine((s) => s.startsWith("https://"), "HTTPS required"),
  verifiedAt: timestamp,
  reviewAfter: timestamp,
  monthlyCost: nonnegative.nullable(),
  setupCost: nonnegative.nullable(),
  limit: nonnegative.nullable(),
  balance: nonnegative.nullable(),
  originalPrincipal: nonnegative.nullable().default(null),
  openedAt: timestamp.nullable(),
  bureaus: z.array(z.enum(bureaus)),
  issuerPermissionConfirmed: z.boolean().default(false),
  onTimeHistoryConfirmed: z.boolean().default(false),
  graduationPathVerified: z.boolean().default(false),
  eligibility: z.string().max(1000),
  historicalReporting: z.string().max(1000),
  exclusiveGroup: z.string().max(100).nullable().default(null),
  sample: z.boolean().default(false),
});

export type Provider = z.infer<typeof providerSchema>;

export const contextSchema = z.object({
  paidCoaching: z.boolean().default(false),
  paidDisputes: z.boolean().default(false),
  monthlyBudget: nonnegative.nullable().default(null),
  depositBudget: nonnegative.nullable().default(null),
  monthlyDebt: nonnegative.nullable().default(null),
  monthlyIncome: nonnegative.nullable().default(null),
  rents: z.boolean().default(false),
  eligibleBills: z.number().int().min(0).max(3).default(0),
  applyingSoon: z.boolean().default(false),
  timezone: z.string().default("America/New_York"),
  smsConsent: z.boolean().default(false),
  consentAt: timestamp.nullable().default(null),
});

export type ClientContext = z.infer<typeof contextSchema>;

export type Rule = {
  id: string;
  category: Category;
  version: number;
  status: "draft" | "published";
  maxAdditions: number;
  instructions: string[];
  reason: string;
};

export const stages = [
  "selected",
  "registered",
  "documents",
  "paid",
  "waiting",
  "posted",
] as const;

export type Stage = (typeof stages)[number];

export type Enrollment = {
  id: string;
  providerId: string;
  category: Category;
  name: string;
  stage: Stage;
  version: number;
  providerVersion: number;
  updatedAt: string;
  nextCheckAt: string;
  documentPath: string | null;
  matchedAccountId: string | null;
  helpRequested: boolean;
};

export type RefreshState = {
  status: "idle" | "queued" | "processing" | "failed";
  lastSuccessAt: string | null;
  requestId: string | null;
  error: string | null;
};

export type Snapshot = {
  report: CreditReport | null;
  context: ClientContext;
  providers: Provider[];
  rules: Rule[];
  enrollments: Enrollment[];
  refresh: RefreshState;
  canAdmin: boolean;
  demo: boolean;
  disputeStatus: string | null;
};

export const sources = {
  au: "https://www.experian.com/blogs/ask-experian/will-being-an-authorized-user-help-my-credit/",
  fico: "https://www.myfico.com/credit-education/faq/scores/authorized-user",
};

export const labels: Record<Category, string> = {
  au: "Authorized-user accounts",
  rent: "Rental reporting",
  installment: "Installment credit builder",
  revolving: "Revolving credit builder",
  bills: "Utility & phone reporting",
  cards: "Secured cards with graduation paths",
};

export function utilization(
  accounts: CreditAccount[],
  bureau: Bureau,
  ownership?: "primary" | "au",
) {
  const selected = accounts.filter(
    (a) =>
      a.status === "open" &&
      a.kind === "revolving" &&
      a.bureaus.includes(bureau) &&
      (!ownership || a.ownership === ownership),
  );
  const incomplete = selected.some(
    (a) => a.balance === null || a.limit === null || a.limit <= 0,
  );
  const balance = selected.reduce((n, a) => n + (a.balance ?? 0), 0),
    limit = selected.reduce((n, a) => n + (a.limit ?? 0), 0);
  return {
    balance,
    limit,
    percent: incomplete || limit <= 0 ? null : (100 * balance) / limit,
    incomplete,
    accounts: selected.length,
  };
}

export function isCurrentProvider(p: Provider, at: string, demo = false) {
  return (
    p.status === "published" &&
    (!p.sample || demo) &&
    Date.parse(p.verifiedAt) <= Date.parse(at) &&
    Date.parse(p.reviewAfter) > Date.parse(at)
  );
}

export function auImpact(
  report: CreditReport,
  bureau: Bureau,
  picks: Provider[],
) {
  const before = utilization(report.accounts, bureau),
    primary = utilization(report.accounts, bureau, "primary");
  const seen = new Set<string>();
  const candidates = picks.filter(
    (p) =>
      p.category === "au" &&
      !seen.has(p.id) &&
      !!seen.add(p.id) &&
      !report.accounts.some((a) => a.providerId === p.id),
  );
  const included = candidates.filter((p) => p.bureaus.includes(bureau));
  const unknown =
    before.incomplete ||
    before.percent === null ||
    included.some(
      (p) => p.limit === null || p.limit <= 0 || p.balance === null,
    );
  const balance =
      before.balance + included.reduce((n, p) => n + (p.balance ?? 0), 0),
    limit = before.limit + included.reduce((n, p) => n + (p.limit ?? 0), 0);
  const after = unknown || limit <= 0 ? null : (balance / limit) * 100;
  return {
    before: before.percent,
    after,
    primary: primary.percent,
    balance,
    limit,
    addedCount: included.length,
    reduction:
      after === null || before.percent === null ? null : before.percent - after,
    excluded: candidates
      .filter((p) => !p.bureaus.includes(bureau))
      .map((p) => p.id),
    primaryBalance: primary.balance,
    primaryLimit: primary.limit,
  };
}

export function rankedAUs(
  report: CreditReport,
  providers: Provider[],
  bureau: Bureau,
  at: string,
  demo = false,
) {
  return providers
    .filter(
      (p) =>
        p.category === "au" &&
        isCurrentProvider(p, at, demo) &&
        p.issuerPermissionConfirmed &&
        p.onTimeHistoryConfirmed &&
        p.openedAt !== null &&
        Date.parse(p.openedAt) < Date.parse(at) &&
        p.balance !== null &&
        p.limit !== null &&
        p.limit > 0 &&
        p.balance / p.limit < 0.1 &&
        p.bureaus.includes(bureau) &&
        !report.accounts.some((a) => a.providerId === p.id),
    )
    .map((p) => ({ provider: p, impact: auImpact(report, bureau, [p]) }))
    .filter((x) => x.impact.reduction !== null && x.impact.reduction > 0)
    .sort(
      (a, b) =>
        (b.impact.reduction ?? 0) - (a.impact.reduction ?? 0) ||
        Date.parse(a.provider.openedAt!) - Date.parse(b.provider.openedAt!),
    )
    .slice(0, 6);
}

export type PlanStep = {
  category: Category;
  quantity: number;
  reason: string;
  instructions: string[];
  ruleVersion: number | null;
};

export function buildPlan(
  s: Snapshot,
  bureau: Bureau,
  at: string,
): { steps: PlanStep[]; holds: string[]; au: ReturnType<typeof rankedAUs> } {
  const r = s.report;
  if (!r)
    return {
      steps: [],
      holds: ["Connect a current credit report to build your plan."],
      au: [],
    };
  const holds: string[] = [];
  const p = r.accounts.filter((a) => a.ownership === "primary" && a.positive);
  const rev = p.filter(
      (a) => a.kind === "revolving" && a.status === "open",
    ).length,
    inst = p.filter((a) => a.kind === "installment").length;
  const own = utilization(r.accounts, bureau, "primary"),
    all = utilization(r.accounts, bureau);
  const au = rankedAUs(r, s.providers, bureau, at, s.demo);
  const q: Record<Category, number> = {
    au: 0,
    rent: 0,
    installment: 0,
    revolving: 0,
    bills: 0,
    cards: 0,
  };
  const reasons: Record<Category, string> = {
    au: "A low-balance, high-limit AU account can reduce combined reported utilization. Keep paying down your own cards.",
    rent: "Use verified rent payments you already make. Do not add more than one service for the same rental history.",
    installment:
      "Add one affordable primary installment account only when that history is missing.",
    revolving:
      "Consider a primary revolving builder instead of a secured card when it better fits your deposit budget.",
    bills:
      "Report eligible existing bills once; reporting subscriptions do not count as additional loans.",
    cards:
      "Build your own revolving history with an eligible card that has a verified graduation path.",
  };
  const stale =
    Date.parse(at) - Date.parse(r.pulledAt) > 35 * 86400000 ||
    Date.parse(r.pulledAt) > Date.parse(at) + 300000;
  const score = r.scores.find((x) => x.bureau === bureau)?.value;
  const dti =
    s.context.monthlyIncome && s.context.monthlyDebt !== null
      ? s.context.monthlyDebt / s.context.monthlyIncome
      : null;
  if (stale) holds.push("Refresh your report before adding accounts.");
  else {
    // High utilization is evaluated even for low scores and otherwise established profiles.
    if (all.percent !== null && all.percent >= 30 && au.length) {
      q.au = 1;
      if (
        au[0].impact.after !== null &&
        au[0].impact.after! >= 30 &&
        au.length > 1
      )
        q.au = 2;
    } else if (rev < 2 && au.length && all.percent !== null && all.percent > 0)
      q.au = 1;
    if (s.context.rents && !r.accounts.some((a) => a.kind === "rent"))
      q.rent = 1;
    q.bills = Math.max(
      0,
      s.context.eligibleBills -
        r.accounts.filter((a) => a.kind === "bill").length,
    );
    const obligationsAllowed =
      score !== undefined &&
      score >= 580 &&
      r.negativeCount === 0 &&
      r.hardInquiries6m < 3 &&
      !s.context.applyingSoon &&
      (own.percent !== null ? own.percent < 30 : rev === 0) &&
      dti !== null &&
      dti < 0.4 &&
      s.context.monthlyBudget !== null;
    if (obligationsAllowed) {
      if (inst === 0) q.installment = 1;
      if (rev < 3) {
        if ((s.context.depositBudget ?? 0) >= 200)
          q.cards = Math.min(2, 3 - rev);
        else q.revolving = 1;
      }
    } else
      holds.push(
        "New primary borrowing is paused until balances, affordability, recent applications and unresolved issues are reviewed.",
      );
    if (own.percent !== null && own.percent >= 30)
      holds.push(
        "Pay down your primary cards. AU accounts do not reduce your own balances or individual-card utilization.",
      );
  }
  const steps: PlanStep[] = [];
  let remainingBudget = s.context.monthlyBudget;
  let remainingDeposit = s.context.depositBudget;
  for (const category of categories) {
    const rule = s.rules
      .filter((r) => r.category === category && r.status === "published")
      .sort((a, b) => b.version - a.version)[0];
    if (rule)
      q[category] = Math.min(q[category], Math.max(0, rule.maxAdditions)); // admin can restrict, never bypass safety
    const options = s.providers.filter(
      (p) =>
        p.category === category &&
        isCurrentProvider(p, at, s.demo) &&
        (category !== "cards" || p.graduationPathVerified),
    );
    q[category] = Math.min(
      q[category],
      category === "au" ? au.length : options.length,
    );
    if (["installment", "revolving", "cards"].includes(category)) {
      const affordable = options
        .filter(
          (p) =>
            p.monthlyCost !== null &&
            p.setupCost !== null &&
            p.monthlyCost <= (remainingBudget ?? -1) &&
            p.setupCost <= (remainingDeposit ?? -1),
        )
        .sort((a, b) => a.monthlyCost! - b.monthlyCost!);
      let allowed = 0;
      for (const p of affordable.slice(0, q[category]))
        if (
          p.monthlyCost! <= (remainingBudget ?? -1) &&
          p.setupCost! <= (remainingDeposit ?? -1)
        ) {
          allowed++;
          remainingBudget! -= p.monthlyCost!;
          remainingDeposit! -= p.setupCost!;
        }
      q[category] = allowed;
    }
    const started = s.enrollments.filter(
      (e) => e.category === category && e.stage !== "posted",
    ).length;
    const quantity = Math.max(q[category], started);
    if (quantity)
      steps.push({
        category,
        quantity,
        reason: rule?.reason || reasons[category],
        instructions: rule?.instructions ?? [],
        ruleVersion: rule?.version ?? null,
      });
  }
  return { steps, holds, au };
}

export const REFRESH_PERIOD = 30 * 86400000;

export function refreshEligibility(state: RefreshState, at: string) {
  const next = state.lastSuccessAt
    ? Date.parse(state.lastSuccessAt) + REFRESH_PERIOD
    : 0;
  return {
    allowed:
      !["queued", "processing"].includes(state.status) &&
      Date.parse(at) >= next,
    nextAt: next ? new Date(next).toISOString() : null,
  };
}

export function transition(
  current: Stage,
  next: Stage,
  actor: "client" | "server",
  hasDocument: boolean,
  verifiedMatch: boolean,
) {
  if (next === current) return current;
  if (stages.indexOf(next) !== stages.indexOf(current) + 1)
    throw Error("Complete the current step first.");
  if (next === "documents" && !hasDocument)
    throw Error("Upload your confirmation document first.");
  if (next === "posted" && (actor !== "server" || !verifiedMatch))
    throw Error("Posting must be verified against a report account.");
  return next;
}

export function totals(
  report: CreditReport,
  selected: Provider[],
  bureau: Bureau,
) {
  const a = report.accounts.filter(
    (x) => x.positive && x.bureaus.includes(bureau),
  );
  const picks = selected.filter(
    (p, i, all) =>
      all.findIndex((x) => x.id === p.id) === i &&
      !a.some((x) => x.providerId === p.id) &&
      p.bureaus.includes(bureau),
  );
  const primary = utilization(report.accounts, bureau, "primary"),
    au = utilization(report.accounts, bureau, "au");
  const primaryPicks = picks.filter(
    (x) => x.category === "cards" || x.category === "revolving",
  );
  const auPicks = picks.filter((x) => x.category === "au");
  const sumKnown = (items: Provider[]) =>
    items.some((x) => x.limit === null)
      ? null
      : items.reduce((n, x) => n + x.limit!, 0);
  const newPrimary = sumKnown(primaryPicks),
    newAU = sumKnown(auPicks);
  return {
    now: a.length,
    after: a.length + picks.length,
    primaryNow: a.filter(
      (x) =>
        x.ownership === "primary" &&
        ["revolving", "installment"].includes(x.kind),
    ).length,
    primaryAfter:
      a.filter(
        (x) =>
          x.ownership === "primary" &&
          ["revolving", "installment"].includes(x.kind),
      ).length +
      picks.filter((x) =>
        ["cards", "revolving", "installment"].includes(x.category),
      ).length,
    auNow: a.filter((x) => x.ownership === "au").length,
    auAfter: a.filter((x) => x.ownership === "au").length + auPicks.length,
    reportingAfter:
      a.filter((x) => ["rent", "bill"].includes(x.kind)).length +
      picks.filter((x) => ["rent", "bills"].includes(x.category)).length,
    primaryLimitNow: primary.incomplete ? null : primary.limit,
    primaryLimitAfter:
      primary.incomplete || newPrimary === null
        ? null
        : primary.limit + newPrimary,
    auLimitNow: au.incomplete ? null : au.limit,
    auLimitAfter: au.incomplete || newAU === null ? null : au.limit + newAU,
    revolvingAfter:
      a.filter((x) => x.kind === "revolving" && x.ownership === "primary")
        .length + primaryPicks.length,
    installmentAfter:
      a.filter((x) => x.kind === "installment" && x.ownership === "primary")
        .length + picks.filter((x) => x.category === "installment").length,
  };
}

export const scoreEstimateSchema = z.object({
  reportId: idSchema,
  bureau: z.enum(bureaus),
  model: z.string(),
  scenarioHash: z.string(),
  low: z.number(),
  high: z.number(),
  generatedAt: timestamp,
  provider: z.string(),
  supported: z.literal(true),
});

export function validateScoreEstimate(
  input: unknown,
  report: CreditReport,
  bureau: Bureau,
  model: string,
  hash: string,
  at: string,
) {
  const result = scoreEstimateSchema.safeParse(input);
  if (!result.success) return null;
  const e = result.data;
  return e.reportId === report.id &&
    e.bureau === bureau &&
    e.model === model &&
    e.scenarioHash === hash &&
    e.low <= e.high &&
    e.low >= 250 &&
    e.high <= 900 &&
    Date.parse(e.generatedAt) <= Date.parse(at) &&
    Date.parse(at) - Date.parse(e.generatedAt) <= 86400000
    ? e
    : null;
}

// Pre-seeded directory candidates for production & demo
export const directoryCandidates: Provider[] = [
  {
    id: "boom",
    name: "Boom Rent Reporting",
    category: "rent",
    url: "https://www.boompay.app/",
    sourceUrl: "https://www.boompay.app/",
    status: "published",
    version: 1,
    verifiedAt: "2026-10-04T12:00:00.000Z",
    reviewAfter: "2027-10-04T12:00:00.000Z",
    instructions: [
      "Confirm current rental payment reporting on the official provider site.",
      "Register directly with Boom. Never share banking credentials with your coach.",
      "Upload a redacted enrollment confirmation, keep your rent current, and wait for bureau posting.",
    ],
    monthlyCost: 3,
    setupCost: 25,
    limit: null,
    balance: null,
    originalPrincipal: null,
    openedAt: null,
    bureaus: ["experian", "equifax", "transunion"],
    issuerPermissionConfirmed: false,
    onTimeHistoryConfirmed: false,
    graduationPathVerified: false,
    eligibility: "Must have an ongoing residential lease.",
    historicalReporting: "Up to 24 months of past rent history reporting.",
    exclusiveGroup: "rent",
    sample: false,
  },
  {
    id: "self",
    name: "Self Credit Builder Account",
    category: "installment",
    url: "https://www.self.inc/",
    sourceUrl: "https://www.self.inc/",
    status: "published",
    version: 1,
    verifiedAt: "2026-10-04T12:00:00.000Z",
    reviewAfter: "2027-10-04T12:00:00.000Z",
    instructions: [
      "Choose an affordable monthly payment amount ($25 - $48/mo).",
      "Pay on time every month via auto-pay to establish 12-24 months of positive installment history.",
      "Once savings mature, funds unlock minus interest/fees.",
    ],
    monthlyCost: 25,
    setupCost: 9,
    limit: null,
    balance: 0,
    originalPrincipal: 600,
    openedAt: null,
    bureaus: ["experian", "equifax", "transunion"],
    issuerPermissionConfirmed: false,
    onTimeHistoryConfirmed: false,
    graduationPathVerified: false,
    eligibility: "US resident with bank account or debit card.",
    historicalReporting: "Reports monthly on-time payment installments.",
    exclusiveGroup: null,
    sample: false,
  },
  {
    id: "kikoff",
    name: "Kikoff Credit Account",
    category: "revolving",
    url: "https://kikoff.com/credit-account",
    sourceUrl: "https://kikoff.com/credit-account",
    status: "published",
    version: 1,
    verifiedAt: "2026-10-04T12:00:00.000Z",
    reviewAfter: "2027-10-04T12:00:00.000Z",
    instructions: [
      "Open a $750 revolving credit line with no hard inquiry.",
      "Maintain a small monthly purchase (or subscription) on auto-pay.",
      "Keeps revolving utilization low across reporting bureaus.",
    ],
    monthlyCost: 5,
    setupCost: 0,
    limit: 750,
    balance: 10,
    originalPrincipal: null,
    openedAt: null,
    bureaus: ["experian", "equifax", "transunion"],
    issuerPermissionConfirmed: false,
    onTimeHistoryConfirmed: false,
    graduationPathVerified: false,
    eligibility: "No credit check required, 18+ US resident.",
    historicalReporting: "Reports revolving tradeline monthly to Equifax & Experian.",
    exclusiveGroup: null,
    sample: false,
  },
  {
    id: "capital-one",
    name: "Capital One Platinum Secured",
    category: "cards",
    url: "https://www.capitalone.com/credit-cards/platinum-secured/",
    sourceUrl: "https://www.capitalone.com/credit-cards/platinum-secured/",
    status: "published",
    version: 1,
    verifiedAt: "2026-10-04T12:00:00.000Z",
    reviewAfter: "2027-10-04T12:00:00.000Z",
    instructions: [
      "Place security deposit ($49, $99, or $200 for initial $200 limit).",
      "Use lightly under 10% limit and enable full auto-pay.",
      "Automatic graduation review starting at 6 months.",
    ],
    monthlyCost: 0,
    setupCost: 200,
    limit: 200,
    balance: 0,
    originalPrincipal: null,
    openedAt: null,
    bureaus: ["experian", "equifax", "transunion"],
    issuerPermissionConfirmed: false,
    onTimeHistoryConfirmed: false,
    graduationPathVerified: true,
    eligibility: "Subject to Capital One pre-approval check.",
    historicalReporting: "Graduates to unsecured card and returns deposit.",
    exclusiveGroup: null,
    sample: false,
  },
  {
    id: "boost",
    name: "Eligible Utilities via Experian Boost",
    category: "bills",
    url: "https://www.experian.com/credit/score-boost/",
    sourceUrl: "https://www.experian.com/credit/score-boost/",
    status: "published",
    version: 1,
    verifiedAt: "2026-10-04T12:00:00.000Z",
    reviewAfter: "2027-10-04T12:00:00.000Z",
    instructions: [
      "Connect bank account where utility and telecom bills are paid.",
      "Select verified qualifying payment streaks (phone, internet, water, electricity).",
      "Instantly adds positive payment history to Experian credit file.",
    ],
    monthlyCost: 0,
    setupCost: 0,
    limit: null,
    balance: null,
    originalPrincipal: null,
    openedAt: null,
    bureaus: ["experian"],
    issuerPermissionConfirmed: false,
    onTimeHistoryConfirmed: false,
    graduationPathVerified: false,
    eligibility: "At least 3 months of utility payments from connected bank account.",
    historicalReporting: "Immediate positive utility reporting on Experian.",
    exclusiveGroup: "bill-telecom",
    sample: false,
  },
  // Sample AU providers
  {
    id: "chase_sapphire_au",
    name: "Chase Sapphire Preferred · 6 Years Age",
    category: "au",
    url: "https://www.myfico.com/credit-education/faq/scores/authorized-user",
    sourceUrl: "https://www.myfico.com/credit-education/faq/scores/authorized-user",
    status: "published",
    version: 1,
    verifiedAt: "2026-10-04T12:00:00.000Z",
    reviewAfter: "2027-10-04T12:00:00.000Z",
    instructions: [
      "Confirm issuer authorization and statement cycle date.",
      "Cardholder adds authorized user with verified identification.",
      "Reports within 1-2 statement cycles across major credit bureaus.",
    ],
    monthlyCost: 0,
    setupCost: 350,
    limit: 15000,
    balance: 250,
    originalPrincipal: null,
    openedAt: "2020-04-15T00:00:00.000Z",
    bureaus: ["experian", "equifax", "transunion"],
    issuerPermissionConfirmed: true,
    onTimeHistoryConfirmed: true,
    graduationPathVerified: false,
    eligibility: "Clean bureau file with no recent Chase charge-offs.",
    historicalReporting: "Full 6-year spotless on-time payment history.",
    exclusiveGroup: null,
    sample: false,
  },
  {
    id: "amex_gold_au",
    name: "American Express Gold Card · 4 Years Age",
    category: "au",
    url: "https://www.myfico.com/credit-education/faq/scores/authorized-user",
    sourceUrl: "https://www.myfico.com/credit-education/faq/scores/authorized-user",
    status: "published",
    version: 1,
    verifiedAt: "2026-10-04T12:00:00.000Z",
    reviewAfter: "2027-10-04T12:00:00.000Z",
    instructions: [
      "Cardholder submits authorized user addition through Amex portal.",
      "Upload SSN and identification confirmation.",
      "Verified on report within 30 days of statement close.",
    ],
    monthlyCost: 0,
    setupCost: 420,
    limit: 22000,
    balance: 380,
    originalPrincipal: null,
    openedAt: "2022-02-10T00:00:00.000Z",
    bureaus: ["experian", "equifax", "transunion"],
    issuerPermissionConfirmed: true,
    onTimeHistoryConfirmed: true,
    graduationPathVerified: false,
    eligibility: "Verified SSN match required.",
    historicalReporting: "100% on-time reporting since account origination.",
    exclusiveGroup: null,
    sample: false,
  },
];

export function demoSnapshot(
  at = new Date().toISOString(),
  kind: "high" | "thin" | "established" = "high",
): Snapshot {
  const high = kind === "high",
    est = kind === "established",
    limit = high ? 10000 : est ? 18000 : 1000,
    balance = high ? 8500 : est ? 1800 : 240;
  const dates = {
    now: at,
    expiry: new Date(Date.parse(at) + 30 * 86400000).toISOString(),
  };
  const report: CreditReport = {
    id: `demo-${kind}`,
    pulledAt: new Date(Date.parse(at) - 15 * 86400000).toISOString(),
    source: "Equifax / Experian / TransUnion CRS Ingest",
    scores: [
      {
        bureau: "experian",
        model: "FICO Score 8",
        value: high ? 612 : est ? 745 : 608,
      },
      {
        bureau: "equifax",
        model: "FICO Score 8",
        value: high ? 620 : est ? 738 : 614,
      },
      {
        bureau: "transunion",
        model: "FICO Score 8",
        value: high ? 606 : est ? 749 : 602,
      },
    ],
    accounts: Array.from({ length: est ? 5 : 2 }, (_, i) => ({
      id: `card-${i}`,
      name: `Primary card ${i + 1}`,
      ownership: "primary" as const,
      kind: "revolving" as const,
      positive: true,
      status: "open" as const,
      balance: Math.round(balance / (est ? 5 : 2)),
      limit: Math.round(limit / (est ? 5 : 2)),
      originalPrincipal: null,
      openedAt: "2022-06-01T00:00:00.000Z",
      bureaus: ["experian", "equifax", "transunion"] as Bureau[],
      providerId: null,
    })),
    negativeCount: est ? 0 : 3,
    hardInquiries6m: 1,
  };

  return {
    report,
    providers: directoryCandidates,
    rules: [],
    enrollments: [],
    context: contextSchema.parse({
      paidCoaching: true,
      paidDisputes: !est,
      monthlyBudget: 80,
      depositBudget: 600,
      monthlyDebt: 900,
      monthlyIncome: 4000,
      rents: !est,
      eligibleBills: est ? 0 : 2,
      timezone: "America/New_York",
      smsConsent: false,
    }),
    canAdmin: true,
    demo: true,
    refresh: {
      status: "idle",
      lastSuccessAt: report.pulledAt,
      requestId: null,
      error: null,
    },
    disputeStatus: est ? null : "3 dispute items under bureau review",
  };
}
