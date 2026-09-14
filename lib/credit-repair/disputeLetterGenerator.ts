import type {
  Agency,
  ClientInfo,
  DisputeReasonAssignment,
  GeneratedLetter,
  NegativeItem,
} from "./credit-repair-types";
import { getReason } from "./disputeReasons";

// ============================================
// Dispute Letter Generator
// ============================================
// Deterministic, FCRA-compliant letter templates. The output looks like
// AI-generated personalized correspondence but is fully reproducible.
//
// To swap in a real LLM (Claude / OpenAI), replace the body of
// `generateLetter()` with an API call that uses the same input shape.
// The returned string can be dropped straight into the rest of the flow.

const TODAY = (): string =>
  new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

function formatAddress(addr: ClientInfo["address"]): string {
  const lines: string[] = [];
  if (addr.line1?.trim()) lines.push(addr.line1.trim());
  if (addr.line2?.trim()) lines.push(addr.line2.trim());
  const city = addr.city?.trim() ?? "";
  const state = addr.state?.trim() ?? "";
  const zip = addr.zip?.trim() ?? "";
  const cityState = [city, state].filter(Boolean).join(", ");
  const cityStateZip = [cityState, zip].filter(Boolean).join(" ");
  if (cityStateZip) lines.push(cityStateZip);
  return lines.join("\n");
}

function formatAgencyAddress(agency: Agency): string {
  const a = agency.address;
  const lines = [agency.name, a.line1];
  if (a.line2) lines.push(a.line2);
  lines.push(`${a.city}, ${a.state} ${a.zip}`);
  return lines.join("\n");
}

function fmtMoney(n: number): string {
  return n === 0 ? "—" : `$${n.toLocaleString("en-US")}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Formats a date of birth without shifting across time zones. A plain
// "YYYY-MM-DD" string is parsed by `new Date()` as UTC midnight, which can
// render as the previous day in time zones behind UTC. Parsing the parts
// manually keeps the DOB accurate.
function fmtDob(value: string): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const d = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function itemTypeLabel(type: NegativeItem["type"]): string {
  switch (type) {
    case "collection":
      return "Collection account";
    case "charge-off":
      return "Charge-off";
    case "late-payment":
      return "Late-payment notation";
    case "inquiry":
      return "Hard inquiry";
    case "public-record":
      return "Public record";
    case "bankruptcy":
      return "Bankruptcy filing";
  }
}

function actionVerb(reasonCode: string): string {
  switch (reasonCode) {
    case "fraud":
      return "BLOCK and PERMANENTLY DELETE";
    case "outdated":
    case "past-sol":
      return "PERMANENTLY DELETE";
    case "incorrect-balance":
    case "incorrect-dates":
    case "incorrect-creditor":
    case "never-late":
      return "CORRECT or DELETE";
    case "cannot-verify":
      return "DELETE if not properly verified";
    case "unauthorized-inquiry":
      return "REMOVE";
    default:
      return "DELETE or correct";
  }
}

interface GenerateLetterArgs {
  client: ClientInfo;
  agency: Agency;
  items: NegativeItem[];
  reasonByItem: Record<string, DisputeReasonAssignment>;
  round?: 1 | 2 | 3;
}

export function generateLetter(args: GenerateLetterArgs): GeneratedLetter {
  const { client, agency, items, reasonByItem, round = 1 } = args;

  // Build sender block
  const sender = [
    `${client.firstName} ${client.lastName}`,
    formatAddress(client.address),
    `DOB: ${fmtDob(client.dob)}`,
    `SSN (last 4): XXX-XX-${client.ssnLast4}`,
  ]
    .filter((line) => line.trim() !== "")
    .join("\n");

  const recipient = formatAgencyAddress(agency);

  const isRound2 = round === 2;
  const isRound3 = round === 3;

  const subject = isRound3
    ? "Formal CFPB Complaint Notice — Continuing FCRA Violation"
    : isRound2
      ? "Method of Verification Demand — FCRA §611(a)(7)"
      : "Formal Dispute of Inaccurate / Unverifiable Information — Request for Reinvestigation Pursuant to FCRA §611";

  // Opening
  const opening = isRound2
    ? `I am writing to demand the Method of Verification for the items previously disputed and returned as "verified." Pursuant to FCRA §611(a)(7), I am entitled to a description of the procedure used, including the name, address, and telephone number of every person contacted, the documents reviewed, and how verification was completed. Failure to provide this within 15 days will be treated as a willful violation of the Fair Credit Reporting Act.`
    : isRound3
      ? `Despite a prior dispute and a §611(a)(7) demand, the items below remain on my consumer file without proper verification. I am preparing a complaint to the Consumer Financial Protection Bureau (CFPB), the FTC, and my state Attorney General. This is your final notice to delete the inaccurate or unverifiable items below before that complaint is filed.`
      : `I am writing to formally dispute the items listed below on my consumer credit file pursuant to the Fair Credit Reporting Act, specifically 15 U.S.C. §1681i (FCRA §611) and 15 U.S.C. §1681g (FCRA §609(a)). I have reviewed my report and have identified items that are inaccurate, incomplete, unverifiable, or otherwise improperly reported. I am requesting a reinvestigation and, where applicable, deletion of these items within the 30-day window mandated by FCRA §611(a)(1)(A).`;

  // Itemized list
  const itemBlocks = items.map((item, idx) => {
    const reason = reasonByItem[item.id];
    const r = reason ? getReason(reason.reasonCode) : undefined;
    const reasonLabel = r?.label || "Item is inaccurate or unverifiable";
    const citation = r?.fcraCitation || "FCRA §611";
    const description = r?.description || "";
    const verb = actionVerb(reason?.reasonCode || "other");

    const lines = [
      `${idx + 1}. ${itemTypeLabel(item.type).toUpperCase()} — ${item.creditor}`,
      `   Account #: ${item.accountNumber}`,
      `   Bureau(s) reporting: ${item.bureaus
        .map((b) => b[0].toUpperCase() + b.slice(1))
        .join(", ")}`,
      item.amount > 0 ? `   Amount reported: ${fmtMoney(item.amount)}` : null,
      `   Date opened: ${fmtDate(item.dateOpened)}`,
      `   Date reported: ${fmtDate(item.dateReported)}`,
      ``,
      `   Reason for dispute: ${reasonLabel}`,
      `   Legal basis: ${citation}`,
      `   ${description}`,
      reason?.additionalDetails
        ? `   Additional facts: ${reason.additionalDetails}`
        : null,
      ``,
      `   Requested action: ${verb} this item from my consumer file within the FCRA-mandated 30-day reinvestigation window.`,
    ].filter(Boolean);
    return lines.join("\n");
  });

  // Special legal notes
  const specialNotes: string[] = [];
  if (Object.values(reasonByItem).some((r) => r.reasonCode === "fraud")) {
    specialNotes.push(
      "NOTICE OF IDENTITY THEFT — One or more items above are the result of identity theft. Pursuant to FCRA §605B (15 U.S.C. §1681c-2), I am attaching a copy of my FTC Identity Theft Report (IdentityTheft.gov) and demanding that the affected information be BLOCKED from my consumer file within four (4) business days of receipt.",
    );
  }
  if (
    Object.values(reasonByItem).some(
      (r) => r.reasonCode === "outdated" || r.reasonCode === "past-sol",
    )
  ) {
    specialNotes.push(
      "OBSOLETE INFORMATION — One or more items above exceed the 7-year reporting period (10 years for Chapter 7 bankruptcy) and must be removed under FCRA §605 (15 U.S.C. §1681c).",
    );
  }
  if (
    Object.values(reasonByItem).some(
      (r) => r.reasonCode === "unauthorized-inquiry",
    )
  ) {
    specialNotes.push(
      "UNAUTHORIZED INQUIRY — One or more hard inquiries were placed on my file without permissible purpose under FCRA §604 (15 U.S.C. §1681b). Please remove them and provide the certified permissible purpose for each.",
    );
  }
  if (agency.category === "cra") {
    specialNotes.push(
      `THIRD-PARTY DATA FURNISHER — As a specialty consumer reporting agency, you are subject to the same accuracy and reinvestigation requirements as the nationwide bureaus under FCRA §611 and §623. Please confirm that you have notified all data recipients (including the nationwide bureaus) of any deletion or correction made as a result of this dispute.`,
    );
  }

  // Closing
  const closing = isRound3
    ? `Govern yourselves accordingly. I expect a written response within fifteen (15) days confirming the deletion of the items above. Otherwise, I will proceed with formal complaints and, if necessary, civil action under FCRA §616 / §617 (15 U.S.C. §1681n / §1681o) for actual and statutory damages.`
    : `Please complete your reinvestigation and respond in writing within the thirty (30) day period required by 15 U.S.C. §1681i(a)(1)(A). If any item cannot be verified by the original creditor with documentary evidence, it must be deleted in full. A reinvestigation that consists only of re-running the same e-OSCAR code without obtaining and reviewing original documentation is not a reasonable reinvestigation under the law.`;

  // Enclosures
  const enclosures: string[] = [
    "Government-issued photo identification",
    "Proof of address (utility bill or bank statement)",
  ];
  if (Object.values(reasonByItem).some((r) => r.reasonCode === "fraud")) {
    enclosures.push("FTC Identity Theft Report (IdentityTheft.gov)");
    enclosures.push("Police report (where applicable)");
  }
  if (
    Object.values(reasonByItem).some(
      (r) =>
        r.reasonCode === "paid-in-full" || r.reasonCode === "included-in-bk",
    )
  ) {
    enclosures.push(
      "Supporting documentation (paid-in-full letter / bankruptcy discharge order)",
    );
  }

  // Compose
  const content = [
    sender,
    "",
    TODAY(),
    "",
    recipient,
    "",
    `RE: ${subject}`,
    `Consumer: ${client.firstName} ${client.lastName}`,
    `DOB: ${fmtDob(client.dob)}    SSN: XXX-XX-${client.ssnLast4}`,
    "",
    `To Whom It May Concern,`,
    "",
    opening,
    "",
    `DISPUTED ITEMS:`,
    "",
    itemBlocks.join("\n\n"),
    "",
    ...(specialNotes.length
      ? [
          `ADDITIONAL LEGAL NOTICES:`,
          "",
          specialNotes.map((n) => `• ${n}`).join("\n\n"),
          "",
        ]
      : []),
    closing,
    "",
    `Please send all written correspondence to the address listed in the header. I am preserving this dispute and any responses for the record. Thank you for your prompt attention to this matter.`,
    "",
    `Sincerely,`,
    "",
    "",
    `${client.firstName} ${client.lastName}`,
    "",
    `Enclosures:`,
    enclosures.map((e) => `  • ${e}`).join("\n"),
  ].join("\n");

  return {
    agencyKey: agency.key,
    agencyName: agency.name,
    content,
    generatedAt: new Date().toISOString(),
    status: "drafted",
  };
}

export function generateLetters(args: {
  client: ClientInfo;
  agencies: Agency[];
  items: NegativeItem[];
  reasonByItem: Record<string, DisputeReasonAssignment>;
  round?: 1 | 2 | 3;
}): Record<string, GeneratedLetter> {
  const { agencies, items, reasonByItem } = args;
  const result: Record<string, GeneratedLetter> = {};

  for (const agency of agencies) {
    // For bureau letters, only include items that are reported on that bureau.
    // For specialty CRAs, include all selected items (the CRA may feed any of them).
    const itemsForAgency =
      agency.category === "bureau"
        ? items.filter((i) => i.bureaus.includes(agency.key as any))
        : items;
    if (itemsForAgency.length === 0) continue;
    const filteredReasons: Record<string, DisputeReasonAssignment> = {};
    for (const item of itemsForAgency) {
      if (reasonByItem[item.id])
        filteredReasons[item.id] = reasonByItem[item.id];
    }
    result[agency.key] = generateLetter({
      ...args,
      agency,
      items: itemsForAgency,
      reasonByItem: filteredReasons,
    });
  }
  return result;
}
