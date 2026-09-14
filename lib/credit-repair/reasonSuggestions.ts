import type {
  NegativeItem,
  NegativeItemType,
  SuggestedReason,
} from "./credit-repair-types";
import type { FactualError } from "@/hooks/identify-factual-errors";
import { getReason } from "./disputeReasons";

// ============================================
// Dispute Reason Suggestions
// ============================================
// Clients frequently do not know *why* an item should be disputed. This
// module turns the AI's plain-language report findings (FactualError[]) plus
// simple heuristics about the item itself into a short, ranked list of
// recommended dispute-reason codes that we render as selectable chips.
//
// The pipeline is intentionally forgiving: if the AI returns nothing useful
// for a given item, we still surface heuristic suggestions based on the item
// type so the client is never left staring at an empty list.

// -------- normalisation helpers --------

function normalize(value: string | undefined | null): string {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Compares two account numbers ignoring masking characters. Credit reports and
// AI output frequently disagree on how much of the number is masked, so we
// match on any shared trailing run of >= 4 digits.
function accountNumbersMatch(a: string, b: string): boolean {
  const da = (a || "").replace(/\D/g, "");
  const db = (b || "").replace(/\D/g, "");
  if (!da || !db) return false;
  if (da === db) return true;
  const shorter = da.length <= db.length ? da : db;
  const longer = da.length <= db.length ? db : da;
  const tail = shorter.slice(-4);
  return tail.length >= 4 && longer.endsWith(tail);
}

// Loose creditor-name match: exact after normalisation, or one name contains
// the other (handles "Capital One" vs "Capital One Bank N.A.").
function creditorNamesMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

/**
 * Find the AI-reported factual errors that correspond to a given negative
 * item, searching only the bureaus that item is reported on.
 */
export function matchErrorsToItem(
  item: NegativeItem,
  errorsByBureau: {
    experian?: FactualError[];
    transunion?: FactualError[];
    equifax?: FactualError[];
  },
): FactualError[] {
  const pool: FactualError[] = [];
  for (const bureau of item.bureaus) {
    const list = errorsByBureau[bureau];
    if (list && list.length) pool.push(...list);
  }
  // Fall back to scanning every bureau if none of the item's bureaus produced
  // findings (the AI sometimes attributes an error to a single bureau only).
  const source = pool.length
    ? pool
    : [
        ...(errorsByBureau.experian || []),
        ...(errorsByBureau.transunion || []),
        ...(errorsByBureau.equifax || []),
      ];

  return source.filter((e) => {
    const byAccount =
      !!e.accountNumber &&
      accountNumbersMatch(e.accountNumber, item.accountNumber);
    const byCreditor = creditorNamesMatch(e.creditorName, item.creditor);
    // Require creditor match; account number is a strong bonus but the AI does
    // not always include it.
    return byCreditor || byAccount;
  });
}

// -------- error-text → reason-code mapping --------

// Ordered list of keyword groups. The first group whose keywords appear in the
// AI error text wins its reason code. Order matters: more specific problems are
// listed before generic ones.
const KEYWORD_RULES: { code: string; keywords: string[] }[] = [
  {
    code: "fraud",
    keywords: ["identity theft", "fraud", "stolen", "not authorized by me"],
  },
  {
    code: "not-mine",
    keywords: [
      "not mine",
      "does not belong",
      "not my account",
      "unknown account",
      "unrecognized",
    ],
  },
  {
    code: "mixed-file",
    keywords: [
      "mixed file",
      "another consumer",
      "wrong person",
      "belongs to someone",
    ],
  },
  {
    code: "never-late",
    keywords: [
      "never late",
      "paid on time",
      "on-time",
      "incorrect payment history",
      "late payment",
      "reported late",
      "delinquen",
    ],
  },
  {
    code: "incorrect-balance",
    keywords: ["balance", "amount owed", "wrong amount", "incorrect amount"],
  },
  {
    code: "paid-in-full",
    keywords: [
      "paid in full",
      "already paid",
      "paid off",
      "satisfied",
      "zero balance",
      "should be zero",
    ],
  },
  {
    code: "included-in-bk",
    keywords: ["bankrupt", "discharged", "chapter 7", "chapter 13"],
  },
  {
    code: "incorrect-dates",
    keywords: [
      "date opened",
      "date of last activity",
      "wrong date",
      "incorrect date",
      "date reported",
    ],
  },
  {
    code: "incorrect-creditor",
    keywords: [
      "creditor name",
      "wrong creditor",
      "incorrect creditor",
      "furnisher name",
    ],
  },
  {
    code: "duplicate",
    keywords: ["duplicate", "reported twice", "same account twice"],
  },
  {
    code: "closed-by-consumer",
    keywords: [
      "closed by consumer",
      "i closed",
      "voluntarily closed",
      "account closed",
    ],
  },
  { code: "authorized-user", keywords: ["authorized user"] },
  {
    code: "outdated",
    keywords: [
      "outdated",
      "over 7 years",
      "past 7",
      "obsolete",
      "too old",
      "reporting period",
    ],
  },
  {
    code: "past-sol",
    keywords: [
      "statute of limitations",
      "past sol",
      "time-barred",
      "no longer collectible",
    ],
  },
  {
    code: "unauthorized-inquiry",
    keywords: [
      "unauthorized inquiry",
      "did not authorize",
      "no permissible purpose",
      "inquiry",
    ],
  },
  {
    code: "cannot-verify",
    keywords: [
      "cannot verify",
      "unverifiable",
      "could not be verified",
      "not verifiable",
      "no documentation",
    ],
  },
];

function codesFromErrorText(text: string): string[] {
  const t = (text || "").toLowerCase();
  const codes: string[] = [];
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((k) => t.includes(k))) {
      if (!codes.includes(rule.code)) codes.push(rule.code);
    }
  }
  return codes;
}

// Heuristic fallbacks keyed on the item type, used when the AI provides no
// usable finding for the item.
const TYPE_FALLBACK: Record<NegativeItemType, string[]> = {
  collection: ["cannot-verify", "not-mine", "incorrect-balance"],
  "charge-off": ["cannot-verify", "never-late", "incorrect-balance"],
  "late-payment": ["never-late", "cannot-verify", "incorrect-dates"],
  inquiry: ["unauthorized-inquiry", "cannot-verify"],
  "public-record": ["not-mine", "cannot-verify", "outdated"],
  bankruptcy: ["included-in-bk", "not-mine", "cannot-verify"],
};

/**
 * Produce a ranked list of suggested dispute reasons for a single item by
 * combining AI findings (preferred) with type-based heuristics (fallback).
 */
export function buildSuggestionsForItem(
  item: NegativeItem,
  aiErrors: FactualError[],
): SuggestedReason[] {
  const suggestions: SuggestedReason[] = [];
  const seen = new Set<string>();

  const push = (
    code: string,
    rationale: string,
    confidence: number,
    source: SuggestedReason["source"],
  ) => {
    if (!code || seen.has(code)) return;
    if (!getReason(code)) return; // guard against unknown codes
    seen.add(code);
    suggestions.push({ reasonCode: code, rationale, confidence, source });
  };

  // 1) AI-derived suggestions (highest confidence).
  for (const err of aiErrors) {
    const codes = codesFromErrorText(err.error);
    const rationale =
      err.error?.trim() || "AI flagged this item as inaccurate.";
    for (const code of codes) {
      push(code, rationale, 0.9, "ai");
    }
  }

  // 2) Heuristic fallbacks based on the item type. These fill out the list so
  //    there is always something to click. Lower confidence.
  const fallbacks = TYPE_FALLBACK[item.type] || ["cannot-verify"];
  fallbacks.forEach((code, idx) => {
    push(code, heuristicRationale(item, code), 0.5 - idx * 0.05, "heuristic");
  });

  // Rank by confidence, keep it short.
  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
}

function heuristicRationale(item: NegativeItem, code: string): string {
  switch (code) {
    case "never-late":
      return `Dispute the ${item.latePaymentDays ?? 30}-day late notation reported by ${item.creditor}.`;
    case "unauthorized-inquiry":
      return `Challenge this hard inquiry from ${item.creditor} as unauthorized.`;
    case "incorrect-balance":
      return `Question the reported balance on the ${item.creditor} account.`;
    case "not-mine":
      return `Assert this ${item.creditor} item does not belong to you.`;
    case "included-in-bk":
      return `Report this account as included in bankruptcy.`;
    case "cannot-verify":
    default:
      return `Demand the furnisher verify this ${item.creditor} item with documentation.`;
  }
}

/**
 * Build suggestions for every provided item at once.
 */
export function buildSuggestions(
  items: NegativeItem[],
  errorsByBureau: {
    experian?: FactualError[];
    transunion?: FactualError[];
    equifax?: FactualError[];
  },
): Record<string, SuggestedReason[]> {
  const map: Record<string, SuggestedReason[]> = {};
  for (const item of items) {
    const matched = matchErrorsToItem(item, errorsByBureau);
    map[item.id] = buildSuggestionsForItem(item, matched);
  }
  return map;
}
