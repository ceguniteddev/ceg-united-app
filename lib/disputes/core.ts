// ============================================================================
// CEG Brain Dispute Module v3 — Core Definitions, Math, Types & Localizations
// Ported to Next.js App Router inside ceg-united-app/lib/disputes/core.ts
// ============================================================================

export type ISODate = string; // 'YYYY-MM-DD'
export type ISODateTime = string; // full ISO-8601 UTC
export type Locale = "en" | "es";
export type Bureau = "experian" | "equifax" | "transunion";

export type Stage =
  | "S0"
  | "S1"
  | "S2"
  | "S3"
  | "S4"
  | "S5"
  | "S6"
  | "S7"
  | "S8"
  | "S9"
  | "S10"
  | "S11";

export type ErrorCode =
  | "E01"
  | "E02"
  | "E03"
  | "E04"
  | "E05"
  | "E06"
  | "E07"
  | "E08"
  | "E09"
  | "E10"
  | "E11"
  | "E12"
  | "E13";

export type OutcomeCode =
  | "R01"
  | "R02"
  | "R03"
  | "R04"
  | "R05"
  | "R06"
  | "R07"
  | "R08"
  | "R09"
  | "R10"
  | "R11"
  | "R12"
  | "R13"
  | "R14"
  | "R15"
  | "R16";

export type ViolationRule =
  | "V1"
  | "V2"
  | "V3"
  | "V4"
  | "V5"
  | "V6"
  | "V7"
  | "V8"
  | "V9";

export type ViolationTier = "V-CLEAR" | "V-LEAD" | "NONE";
export type Track = "T-CRA" | "T-IDT" | "T-FDCPA" | "T-FURN" | "T-INQ";
export type LetterCode =
  | "L1"
  | "L2"
  | "L3"
  | "L4"
  | "L5"
  | "L6"
  | "L7"
  | "L8"
  | "L9"
  | "L10"
  | "L11"
  | "L12"
  | "L13"
  | "L14";

export type NotificationCode =
  | "N01"
  | "N02"
  | "N03"
  | "N03b"
  | "N04"
  | "N05"
  | "N06"
  | "N07"
  | "N08"
  | "N09"
  | "N10"
  | "N11"
  | "N12"
  | "N13"
  | "N14"
  | "N15"
  | "N16"
  | "N17"
  | "N18"
  | "N19"
  | "N20"
  | "N21"
  | "N22"
  | "N23"
  | "N24"
  | "N25"
  | "N26"
  | "N27"
  | "N28"
  | "N29"
  | "N30"
  | "N31"
  | "N32";

export type LetterStatus =
  | "draft"
  | "ready_to_sign"
  | "signed"
  | "mailed"
  | "delivered"
  | "returned";

export interface Clock {
  D0: ISODate | null;
  R: ISODate;
  rEstimated: boolean;
  F: ISODate;
  C: ISODate;
  Cplus: ISODate | null;
  extended: boolean;
  annualDisclosureRoute: boolean;
  N: ISODate;
  OD: ISODate;
}

export interface DisputeLine {
  id: string;
  uid: string;
  itemId: string;
  creditor: string;
  accountLast4: string;
  bureau: Bureau;
  errorCodes: ErrorCode[];
  tracks: Track[];
  stage: Stage;
  status: "active" | "closed" | "withdrawn";
  itemState:
    | "CANDIDATE"
    | "NEEDS_EVIDENCE"
    | "READY"
    | "NOT_DISPUTABLE"
    | "ACCURATE";
  attempt: number;
  attestation: {
    text: string;
    signedAt: ISODateTime;
    ip: string;
    userAgent: string;
  } | null;
  dqs: { complete: boolean; gaps: string[] };
  evidenceDocIds: string[];
  weakEvidenceAccepted: boolean;
  clock: Clock | null;
  mailing: {
    letterId: string;
    lobId?: string;
    method: "certified" | "first_class" | "portal";
    trackingNumber?: string;
    D0?: ISODate;
    deliveredAt?: ISODate;
    returned?: boolean;
  } | null;
  lastOutcome: OutcomeCode | null;
  lastResponseId: string | null;
  outcomeHistory: {
    code: OutcomeCode;
    at: ISODate;
    responseId: string | null;
  }[];
  violationIds: string[];
  litigationCaseId: string | null;
  progressPct: number;
  nextAction: {
    code: string;
    title_en: string;
    title_es: string;
    dueAt: ISODate;
    owner: "client" | "system" | "reviewer" | "attorney";
  } | null;
  watchUntil: ISODate | null;
  priority: number;
  kbVersion: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  caseStage?: "S7" | "S9" | "S10" | "S11" | "CLOSED" | null;
  L0?: ISODate | null;
  disputedField?: { field: string; reported: string; correct: string } | null;
}

export interface ResponseExtraction {
  documentType:
    | "bureau_results"
    | "bureau_frivolous"
    | "bureau_id_request"
    | "bureau_suspicious_request"
    | "bureau_ack"
    | "bureau_reinsertion"
    | "bureau_procedure_description"
    | "furnisher_response"
    | "collector_validation"
    | "idt_block_response"
    | "other";
  sender: string;
  letterDate: ISODate | null;
  receivedDate: ISODate;
  referenceNumber: string | null;
  itemsAddressed: {
    creditor: string;
    accountLast4: string;
    resultText: string;
    fieldsChanged: string[];
    newValues: Record<string, string>;
  }[];
  statedMethod: string | null;
  furnisherContactInfo: string | null;
  rightsNotices: {
    procedureDescriptionOffered: boolean;
    statementOfDisputeOffered: boolean;
    recipientNoticeOffered: boolean;
  };
  requestsFromBureau: string[];
  confidence: number;
}

export interface ResponseDoc {
  id: string;
  uid: string;
  lineIds: string[];
  kind: "letter" | "no_response_confirmation";
  storagePaths: string[];
  sha256: string | null;
  uploadedAt: ISODateTime;
  receivedDate: ISODate;
  senderSelected: string;
  ocrText: string | null;
  extraction: ResponseExtraction | null;
  outcomeCode: OutcomeCode | null;
  processing:
    | "pending"
    | "ocr"
    | "classifying"
    | "needs_client_answer"
    | "needs_review"
    | "done"
    | "error";
  clarifyingQuestion?: {
    question_en: string;
    question_es: string;
    field: string;
    answer?: string;
  } | null;
  reviewer: { uid: string; decidedAt: ISODateTime; override?: OutcomeCode } | null;
  reportSnapshotId: string | null;
  kbVersion: string;
}

export interface LetterDoc {
  id: string;
  lineIds: string[];
  bureau: Bureau | string;
  letterCode: LetterCode;
  html: string;
  pdfPath: string | null;
  status: LetterStatus;
  attestationText?: string;
  signature: {
    name: string;
    signedAt: ISODateTime;
    ip: string;
    userAgent: string;
  } | null;
  lob: {
    id?: string;
    trackingNumber?: string;
    events: { type: string; at: ISODateTime }[];
  } | null;
  mailing?: {
    method: "certified" | "first_class" | "portal";
    requestedAt: ISODateTime;
  } | null;
  createdAt: ISODateTime;
}

export interface EvidenceDoc {
  id: string;
  itemId: string;
  lineIds: string[];
  docType: string;
  fileName: string;
  storagePath: string;
  sizeBytes: number;
  contentType: string;
  uploadedAt: ISODateTime;
}

export interface AuditItem {
  id: string;
  type:
    | "collection"
    | "charge-off"
    | "late-payment"
    | "inquiry"
    | "public-record"
    | "bankruptcy"
    | "personal-info";
  creditor: string;
  accountNumber: string;
  bureaus: Bureau[];
  amount: number;
  dateOpened: ISODate | null;
  dateReported: ISODate | null;
  audit: {
    errorCodes: ErrorCode[];
    impact: "high" | "medium" | "low";
    suspectedError_en: string;
    suspectedError_es: string;
    verdict: "wrong" | "accurate" | null;
    verdictAt: ISODateTime | null;
    removalDate: ISODate | null;
  } | null;
}

export interface DisputeNotification {
  id: string;
  uid: string;
  eventCode: NotificationCode | string;
  lineId: string | null;
  caseId: string | null;
  title: string;
  body: string;
  locale: Locale;
  channels: ("in_app" | "push" | "email" | "sms" | "whatsapp")[];
  urgent: boolean;
  sendAt: ISODateTime;
  sentAt: ISODateTime;
  deliveries: { channel: string; status: string }[];
  readAt: ISODateTime | null;
  actionUrl: string;
  dedupeKey: string;
  escalationOf: string | null;
  i18n?: {
    en: { title: string; body: string };
    es: { title: string; body: string };
  };
}

export interface DisputeTask {
  id: string;
  uid: string;
  code: string;
  lineId: string | null;
  owner: "client" | "reviewer" | "system" | "attorney";
  status: "open" | "done" | "cancelled";
  dueAt: ISODate;
  completedAt: ISODateTime | null;
  title_en: string;
  title_es: string;
  actionUrl: string;
  escalationLevel: number;
}

export interface InstructionSet {
  id: string;
  category: string;
  instructions: string[];
}

export interface LitigationCase {
  id: string;
  uid: string;
  lineIds: string[];
  status: "open" | "evaluating" | "referred" | "settled" | "closed";
  violationCodes: ViolationRule[];
  attorneyName?: string;
  harmDocuments: { storagePath: string; fileName: string; uploadedAt: ISODateTime }[];
  limitationDeadline: ISODate;
}

export interface ReportSnapshot {
  id: string;
  uid: string;
  reportId: string;
  pulledAt: ISODateTime;
  bureauDiffs: Record<string, any>;
}

export interface NotificationPrefs {
  channels: { push: boolean; email: boolean; sms: boolean; whatsapp: boolean };
  smsConsent: { granted: boolean; text: string; at: ISODateTime } | null;
  whatsappConsent: { granted: boolean; text: string; at: ISODateTime } | null;
  locale: Locale;
  pushTokens: string[];
}

export interface PortalProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  locale: Locale;
  notificationPrefs?: NotificationPrefs | null;
}

export interface DisputeSettings {
  kbVersion: string;
  kbApproved: boolean;
  autonomy: {
    autoAcceptConfidence: number;
    clarifyBeforeReview: boolean;
    reviewerRequiredFor: string[];
    vClearRequiresReviewer: boolean;
    reviewerSlaBusinessDays: number;
    autoPullFreshReport: boolean;
    autoGenerateNextLetters: boolean;
  };
  quietHours: { start: string; end: string };
  selfRepresentedPathEnabled: boolean;
  attorneyReferral: {
    name: string;
    email: string;
    bookingUrl: string;
  } | null;
  portalBaseUrl: string;
}

export interface DisputeSnapshot {
  profile: PortalProfile;
  settings: DisputeSettings;
  items: AuditItem[];
  lines: DisputeLine[];
  letters: LetterDoc[];
  responses: ResponseDoc[];
  tasks: DisputeTask[];
  notifications: DisputeNotification[];
  instructions: InstructionSet[];
  cases: LitigationCase[];
  evidence: EvidenceDoc[];
  snapshots: ReportSnapshot[];
  today: ISODate;
}

// ============================================================================
// ISO Date Helpers & Statutory Calendars
// ============================================================================

export function assertISODate(d: string, label = "date"): asserts d is ISODate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    throw new Error(`Invalid ${label}: expected YYYY-MM-DD, got "${d}"`);
  }
}

export function toUTC(d: ISODate): Date {
  assertISODate(d);
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function fromUTC(dt: Date): ISODate {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ymd(y: number, m: number, d: number): ISODate {
  return fromUTC(new Date(Date.UTC(y, m - 1, d)));
}

export function weekday(d: ISODate): number {
  return toUTC(d).getUTCDay();
}

export function addCalendarDays(d: ISODate, n: number): ISODate {
  const dt = toUTC(d);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fromUTC(dt);
}

export function addMonths(d: ISODate, n: number): ISODate {
  const dt = toUTC(d);
  const day = dt.getUTCDate();
  dt.setUTCDate(1);
  dt.setUTCMonth(dt.getUTCMonth() + n);
  const last = new Date(
    Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0),
  ).getUTCDate();
  dt.setUTCDate(Math.min(day, last));
  return fromUTC(dt);
}

export function addYears(d: ISODate, n: number): ISODate {
  return addMonths(d, n * 12);
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / 86_400_000);
}

export function compareISO(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function shortDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export function todayISO(): ISODate {
  return fromUTC(new Date());
}

// Federal Holidays (5 U.S.C. § 6103)
function nthWeekdayOfMonth(
  year: number,
  month: number,
  dow: number,
  n: number,
): ISODate {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (dow - first.getUTCDay() + 7) % 7;
  return ymd(year, month, 1 + offset + (n - 1) * 7);
}

function lastWeekdayOfMonth(year: number, month: number, dow: number): ISODate {
  const last = new Date(Date.UTC(year, month, 0));
  const offset = (last.getUTCDay() - dow + 7) % 7;
  return ymd(year, month, last.getUTCDate() - offset);
}

function observedDate(actual: ISODate): ISODate {
  const dow = weekday(actual);
  const dt = new Date(actual + "T00:00:00Z");
  if (dow === 6) dt.setUTCDate(dt.getUTCDate() - 1);
  else if (dow === 0) dt.setUTCDate(dt.getUTCDate() + 1);
  return fromUTC(dt);
}

function federalHolidays(year: number): ISODate[] {
  const h = (actual: ISODate) => observedDate(actual);
  return [
    h(ymd(year, 1, 1)),
    h(nthWeekdayOfMonth(year, 1, 1, 3)),
    h(nthWeekdayOfMonth(year, 2, 1, 3)),
    h(lastWeekdayOfMonth(year, 5, 1)),
    h(ymd(year, 6, 19)),
    h(ymd(year, 7, 4)),
    h(nthWeekdayOfMonth(year, 9, 1, 1)),
    h(nthWeekdayOfMonth(year, 10, 1, 2)),
    h(ymd(year, 11, 11)),
    h(nthWeekdayOfMonth(year, 11, 4, 4)),
    h(ymd(year, 12, 25)),
  ];
}

const holidayCache = new Map<number, Set<ISODate>>();
export function isFederalHoliday(d: ISODate): boolean {
  const yr = Number(d.slice(0, 4));
  let set = holidayCache.get(yr);
  if (!set) {
    set = new Set(federalHolidays(yr));
    holidayCache.set(yr, set);
  }
  return set.has(d);
}

export function isBusinessDay(
  date: ISODate,
  extraHolidays?: Set<ISODate>,
): boolean {
  const dow = weekday(date);
  if (dow === 0 || dow === 6) return false;
  if (extraHolidays && extraHolidays.has(date)) return false;
  return !isFederalHoliday(date);
}

export function addBusinessDays(
  date: ISODate,
  n: number,
  extraHolidays?: Iterable<ISODate>,
): ISODate {
  const extra = extraHolidays ? new Set(extraHolidays) : undefined;
  const dt = toUTC(date);
  const step = n < 0 ? -1 : 1;
  let remaining = Math.abs(n);
  while (remaining > 0) {
    dt.setUTCDate(dt.getUTCDate() + step);
    if (isBusinessDay(fromUTC(dt), extra)) remaining--;
  }
  return fromUTC(dt);
}

export function businessDaysBetween(
  a: ISODate,
  b: ISODate,
  extraHolidays?: Iterable<ISODate>,
): number {
  const extra = extraHolidays ? new Set(extraHolidays) : undefined;
  if (compareISO(a, b) >= 0) return 0;
  let count = 0;
  let cur = a;
  while (cur < b) {
    cur = addCalendarDays(cur, 1);
    if (isBusinessDay(cur, extra)) count++;
  }
  return count;
}

export function computeClock(input: {
  D0: ISODate | null;
  R: ISODate;
  rEstimated: boolean;
  extended: boolean;
  annualDisclosureRoute: boolean;
  extraHolidays?: Iterable<ISODate>;
}): Clock {
  const { D0, R, rEstimated, extended, annualDisclosureRoute, extraHolidays } =
    input;
  const F = addBusinessDays(R, 5, extraHolidays);
  const C = addCalendarDays(R, 30);
  const Cplus =
    extended || annualDisclosureRoute ? addCalendarDays(R, 45) : null;
  const N = addBusinessDays(Cplus ?? C, 5, extraHolidays);
  const OD = addBusinessDays(N, 5, extraHolidays);
  return {
    D0,
    R,
    rEstimated,
    F,
    C,
    Cplus,
    extended,
    annualDisclosureRoute,
    N,
    OD,
  };
}

export function estimateReceipt(
  D0: ISODate,
  extraHolidays?: Iterable<ISODate>,
): { R: ISODate; rEstimated: true } {
  return { R: addBusinessDays(D0, 5, extraHolidays), rEstimated: true };
}

export function supplementalExtends(clock: Clock, sentDate: ISODate): boolean {
  return compareISO(sentDate, clock.C) <= 0 && compareISO(sentDate, clock.R) >= 0;
}

// ============================================================================
// Decisive Evidence Checklist per Error Code (KB 4.1)
// ============================================================================

export interface EvidenceSpec {
  key: string;
  label: string;
  example: string;
  decisive: boolean;
}

type EvidenceRow = {
  key: string;
  en: [string, string];
  es: [string, string];
  decisive?: boolean;
};

const ID_EVIDENCE: EvidenceRow = {
  key: "identity",
  en: [
    "Government ID and proof of address",
    "Driver license or passport plus a utility bill or lease dated within 60 days.",
  ],
  es: [
    "Identificación oficial y comprobante de domicilio",
    "Licencia de conducir o pasaporte más un recibo de servicios o contrato de renta de los últimos 60 días.",
  ],
};

const EVIDENCE_ROWS: Record<ErrorCode, EvidenceRow[]> = {
  E01: [
    {
      key: "id_mismatch",
      decisive: true,
      en: [
        "Proof the account belongs to someone else",
        "Your ID, SSN card and address history showing you never lived at the address on the account.",
      ],
      es: [
        "Prueba de que la cuenta pertenece a otra persona",
        "Tu identificación, tarjeta del Seguro Social e historial de domicilios que muestre que nunca viviste en la dirección de la cuenta.",
      ],
    },
    ID_EVIDENCE,
  ],
  E02: [
    {
      key: "ftc_report",
      decisive: true,
      en: [
        "FTC Identity Theft Report",
        "The PDF from IdentityTheft.gov listing this account.",
      ],
      es: [
        "Reporte de robo de identidad de la FTC",
        "El PDF de IdentityTheft.gov que enumera esta cuenta.",
      ],
    },
    {
      key: "police_report",
      en: ["Police report (optional)", "A report number is enough."],
      es: ["Reporte policial (opcional)", "Basta con el número de reporte."],
    },
    ID_EVIDENCE,
  ],
  E03: [
    {
      key: "au_record",
      decisive: true,
      en: [
        "Creditor letter or enrollment record showing your role",
        "A letter or screenshot showing you as authorized user, not borrower.",
      ],
      es: [
        "Carta del acreedor o registro que muestre tu rol",
        "Una carta o captura que te muestre como usuario autorizado, no como titular.",
      ],
    },
    {
      key: "application",
      en: [
        "Application showing who signed",
        "The original application or card agreement.",
      ],
      es: [
        "Solicitud que muestre quién firmó",
        "La solicitud original o el contrato de la tarjeta.",
      ],
    },
  ],
  E04: [
    {
      key: "statements",
      decisive: true,
      en: [
        "Original-creditor statements showing the first missed payment",
        "Statements from the months around the first missed payment that was never caught up.",
      ],
      es: [
        "Estados de cuenta del acreedor original con el primer pago omitido",
        "Estados de cuenta de los meses cercanos al primer pago omitido que nunca se puso al día.",
      ],
    },
    {
      key: "prior_reports",
      en: [
        "Older credit reports showing the earlier date",
        "A report from a previous year listing the original delinquency date.",
      ],
      es: [
        "Reportes de crédito antiguos con la fecha anterior",
        "Un reporte de un año anterior con la fecha original del atraso.",
      ],
    },
  ],
  E05: [
    {
      key: "dofd_proof",
      decisive: true,
      en: [
        "Proof of the first-delinquency date",
        "A statement, letter or older report showing when the account first went unpaid.",
      ],
      es: [
        "Prueba de la fecha del primer atraso",
        "Un estado de cuenta, carta o reporte antiguo que muestre cuándo dejó de pagarse la cuenta.",
      ],
    },
  ],
  E06: [
    {
      key: "bank_statements",
      decisive: true,
      en: [
        "Bank statements or payment confirmations for the months reported late",
        "Highlight the payment date and amount.",
      ],
      es: [
        "Estados de cuenta bancarios o confirmaciones de pago de los meses reportados como atrasados",
        "Resalta la fecha y el monto del pago.",
      ],
    },
    {
      key: "forbearance",
      en: [
        "Deferment or forbearance agreement (if any)",
        "The letter approving a pause in payments.",
      ],
      es: [
        "Acuerdo de aplazamiento o indulgencia (si existe)",
        "La carta que aprueba la pausa de pagos.",
      ],
    },
  ],
  E07: [
    {
      key: "paid_letter",
      decisive: true,
      en: [
        "Paid-in-full, settlement or payoff letter",
        "The creditor's letter confirming the balance is settled or zero.",
      ],
      es: [
        "Carta de pago total, acuerdo o liquidación",
        "La carta del acreedor que confirma que el saldo está liquidado o en cero.",
      ],
    },
    {
      key: "modification",
      en: [
        "Modification agreement (if any)",
        "Signed terms showing the new balance or status.",
      ],
      es: [
        "Acuerdo de modificación (si existe)",
        "Términos firmados con el nuevo saldo o estado.",
      ],
    },
  ],
  E08: [
    {
      key: "discharge_order",
      decisive: true,
      en: [
        "Bankruptcy discharge order",
        "The court order with the case number.",
      ],
      es: [
        "Orden de descarga de bancarrota",
        "La orden del tribunal con el número de caso.",
      ],
    },
    {
      key: "schedule",
      decisive: true,
      en: ["Schedule listing this debt", "The schedule page (D/E/F) where this creditor appears."],
      es: ["Anexo que enumera esta deuda", "La página del anexo (D/E/F) donde aparece este acreedor."],
    },
  ],
  E09: [
    {
      key: "transfer_letter",
      decisive: true,
      en: [
        "Sale or transfer letter",
        "The notice that the debt was sold or placed with another company.",
      ],
      es: [
        "Carta de venta o transferencia",
        "El aviso de que la deuda se vendió o se asignó a otra empresa.",
      ],
    },
    {
      key: "both_tradelines",
      en: [
        "Both tradelines side by side",
        "The report pages showing both accounts with a balance.",
      ],
      es: [
        "Ambas cuentas lado a lado",
        "Las páginas del reporte que muestran ambas cuentas con saldo.",
      ],
    },
  ],
  E10: [
    {
      key: "prior_dispute",
      decisive: true,
      en: [
        "Copy of your earlier dispute and proof it was received",
        "The letter plus the certified-mail receipt or delivery scan.",
      ],
      es: [
        "Copia de tu disputa anterior y prueba de recepción",
        "La carta más el recibo de correo certificado o el escaneo de entrega.",
      ],
    },
  ],
  E11: [
    {
      key: "docket",
      decisive: true,
      en: [
        "Certified court docket, dismissal or vacatur order",
        "Request it from the clerk of the court.",
      ],
      es: [
        "Expediente certificado del tribunal, orden de desestimación o anulación",
        "Solicítalo al secretario del tribunal.",
      ],
    },
  ],
  E12: [
    {
      key: "no_application",
      decisive: true,
      en: [
        "Your statement that you did not apply",
        "Captured in your attestation; add any identity-theft evidence if applicable.",
      ],
      es: [
        "Tu declaración de que no solicitaste crédito",
        "Queda registrada en tu confirmación; agrega evidencia de robo de identidad si aplica.",
      ],
    },
  ],
  E13: [
    {
      key: "id_proof",
      decisive: true,
      en: [
        "ID, utility bill or lease",
        "Documents showing the correct name, address or employer.",
      ],
      es: [
        "Identificación, recibo de servicios o contrato de renta",
        "Documentos que muestren el nombre, domicilio o empleador correctos.",
      ],
    },
  ],
};

export function evidenceFor(codes: ErrorCode[], locale: Locale): EvidenceSpec[] {
  const seen = new Set<string>();
  const out: EvidenceSpec[] = [];
  for (const code of codes) {
    for (const row of EVIDENCE_ROWS[code] || []) {
      if (seen.has(row.key)) continue;
      seen.add(row.key);
      const [label, example] = row[locale];
      out.push({ key: row.key, label, example, decisive: !!row.decisive });
    }
  }
  return out;
}

export function evidenceStrength(
  specs: EvidenceSpec[],
  uploadedKeys: Set<string>,
): {
  pct: number;
  level: "weak" | "fair" | "strong";
  missingDecisive: EvidenceSpec[];
} {
  const decisive = specs.filter((s) => s.decisive);
  const have = decisive.filter((s) => uploadedKeys.has(s.key)).length;
  const support = specs.filter(
    (s) => !s.decisive && uploadedKeys.has(s.key),
  ).length;
  const pct = decisive.length
    ? Math.min(
        100,
        Math.round((have / decisive.length) * 80 + Math.min(20, support * 10)),
      )
    : uploadedKeys.size
      ? 100
      : 0;
  const level =
    have === decisive.length && decisive.length > 0
      ? "strong"
      : have > 0
        ? "fair"
        : "weak";
  return {
    pct,
    level,
    missingDecisive: decisive.filter((s) => !uploadedKeys.has(s.key)),
  };
}

// ============================================================================
// Next Steps Engine & Statutory Gates
// ============================================================================

export interface NextStep {
  code: string;
  dueAt: ISODate;
  actionUrl: string;
  task: DisputeTask | null;
  line: DisputeLine | null;
  title_en: string;
  title_es: string;
}

const URGENCY: Record<string, number> = {
  CONFIRM_NO_RESPONSE: 3,
  UPLOAD_RESPONSE: 3,
  ANSWER_QUESTION: 3,
  SIGN_LETTERS: 2,
  UPLOAD_EVIDENCE: 2,
  PRESERVE_EVIDENCE: 2,
  ATTEST: 1,
};

export function selectNextSteps(
  lines: DisputeLine[],
  tasks: DisputeTask[],
  today: ISODate,
): NextStep[] {
  const byId = new Map(lines.map((l) => [l.id, l]));
  const steps: NextStep[] = tasks
    .filter((t) => t.status === "open" && t.owner === "client")
    .map((t) => ({
      code: t.code,
      dueAt: t.dueAt,
      actionUrl: t.actionUrl || "/",
      task: t,
      line: t.lineId ? byId.get(t.lineId) || null : null,
      title_en: t.title_en,
      title_es: t.title_es,
    }));

  const PER_ITEM = new Set(["UPLOAD_EVIDENCE", "SIGN_LETTERS", "ATTEST"]);
  const covered = new Set(
    steps.map((s) =>
      PER_ITEM.has(s.code)
        ? `${s.code}:item:${s.line?.itemId ?? ""}`
        : `${s.code}:${s.line?.id ?? ""}`,
    ),
  );

  for (const l of lines) {
    if (l.status !== "active" || !l.nextAction || l.nextAction.owner !== "client")
      continue;
    const key = PER_ITEM.has(l.nextAction.code)
      ? `${l.nextAction.code}:item:${l.itemId}`
      : `${l.nextAction.code}:${l.id}`;
    if (covered.has(key)) continue;
    covered.add(key);
    steps.push({
      code: l.nextAction.code,
      dueAt: l.nextAction.dueAt,
      actionUrl: `/lines/${l.id}`,
      task: null,
      line: l,
      title_en: l.nextAction.title_en,
      title_es: l.nextAction.title_es,
    });
  }

  const score = (s: NextStep) => {
    const d = diffDays(today, s.dueAt);
    return [
      d < 0 ? 0 : 1,
      d,
      -(URGENCY[s.code] ?? 0),
      -(s.line?.priority ?? 0),
    ] as const;
  };

  return steps.sort((a, b) => {
    const sa = score(a);
    const sb = score(b);
    for (let i = 0; i < sa.length; i++) {
      if (sa[i] !== sb[i]) return sa[i] - sb[i];
    }
    return a.dueAt.localeCompare(b.dueAt);
  });
}

export function selectNextStep(
  lines: DisputeLine[],
  tasks: DisputeTask[],
  today: ISODate,
): NextStep | null {
  return selectNextSteps(lines, tasks, today)[0] || null;
}

export function noResponseAllowed(
  line: DisputeLine,
  today: ISODate,
): { allowed: boolean; from: ISODate | null } {
  if (!line.clock) return { allowed: false, from: null };
  return { allowed: today >= line.clock.N, from: line.clock.N };
}

export function supplementalNeedsExtensionConfirm(
  line: DisputeLine,
  today: ISODate,
): boolean {
  return (
    !!line.clock &&
    ["S2", "S3", "S4"].includes(line.stage) &&
    today <= line.clock.C &&
    !line.clock.extended
  );
}

// ============================================================================
// Letter Generator Template
// ============================================================================

export function letterHtml(opts: {
  name: string;
  bureau: string;
  creditor: string;
  last4: string;
  code: string;
  attempt: number;
  body_en: string;
  date: ISODate;
}): string {
  const addr: Record<string, string> = {
    experian: "Experian, P.O. Box 4500, Allen, TX 75013",
    equifax:
      "Equifax Information Services LLC, P.O. Box 740256, Atlanta, GA 30374",
    transunion: "TransUnion Consumer Solutions, P.O. Box 2000, Chester, PA 19016",
  };
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Georgia,serif;font-size:14px;line-height:1.55;color:#111;padding:28px;max-width:680px;margin:0 auto}h1{font-size:15px;margin:18px 0 8px}p{margin:0 0 10px}.meta{color:#444;font-size:12px}.sig{margin-top:28px}</style></head><body>
<p class="meta">${opts.date}</p><p class="meta">${addr[opts.bureau] || opts.bureau}</p>
<h1>Re: Dispute of inaccurate information · ${opts.creditor} · account ending ${opts.last4} · ${opts.code}${opts.attempt > 1 ? ` · follow-up #${opts.attempt}` : ""}</h1>
<p>To whom it may concern,</p>
<p>I am writing to dispute specific information in my credit file. ${opts.body_en}</p>
<p>Under 15 U.S.C. § 1681i, please reinvestigate this item, forward all relevant information I have enclosed to the furnisher, and send me written results of your reinvestigation, including a description of the procedure used if I request it. If the information cannot be verified as accurate and complete, please delete it and notify me.</p>
<p>Enclosed: copy of my identification, proof of address, and the supporting documents listed on the attached index.</p>
<p class="sig">Sincerely,<br><br>${opts.name}</p></body></html>`;
}
