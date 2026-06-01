// ============================================
// CEG Brain — Credit Review & Repair — Types
// ============================================
// Mirrors the Firestore schema described in INSTRUCTIONS.md.

export interface UserProfile {
  uid: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string
}

// Full client identity used in dispute letters.
export interface ClientInfo {
  uid: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dob: string // 'YYYY-MM-DD'
  ssnLast4: string // '1234'
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
  }
}

// -------- Bureaus --------
export type Bureau = 'experian' | 'equifax' | 'transunion'

export const ALL_BUREAUS: Bureau[] = ['experian', 'equifax', 'transunion']

export interface BureauScore {
  bureau: Bureau
  score: number
  delta: number // change since last pull
  pulledAt: string // ISO
}

// -------- Negative Items --------
export type NegativeItemType =
  | 'collection'
  | 'charge-off'
  | 'late-payment'
  | 'inquiry'
  | 'public-record'
  | 'bankruptcy'

export type NegativeItemStatus =
  | 'new'
  | 'in-dispute'
  | 'verified'
  | 'updated'
  | 'deleted'

export interface NegativeItem {
  id: string
  type: NegativeItemType
  creditor: string
  accountNumber: string // masked, e.g. '****1234'
  bureaus: Bureau[]
  amount: number
  dateOpened: string // ISO
  dateReported: string // ISO
  status: NegativeItemStatus
  // Type-specific extras:
  latePaymentDays?: 30 | 60 | 90 | 120
  publicRecordType?: 'civil-judgment' | 'tax-lien' | 'bankruptcy'
  inquiryAgeMonths?: number
}

// -------- Dispute Reasons --------
export interface DisputeReason {
  code: string
  label: string
  description: string
  fcraCitation?: string
  highPriority?: boolean
  requiresIdTheftReport?: boolean
  itemTypes?: NegativeItemType[] // when present, only applicable to these types
}

export interface DisputeReasonAssignment {
  reasonCode: string
  additionalDetails?: string
}

// -------- Agencies (Bureaus + 3rd-party CRAs) --------
export type AgencyCategory = 'bureau' | 'cra'

export interface Agency {
  key: string
  name: string
  category: AgencyCategory
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
  }
  notes?: string
}

// -------- Disputes --------
export type DisputeRound = 1 | 2 | 3 // 1: initial, 2: MOV / §611(a)(7), 3: CFPB

export type LetterStatus =
  | 'drafted'
  | 'sent'
  | 'awaiting-response'
  | 'responded'
  | 'verified'
  | 'updated'
  | 'deleted'

export interface GeneratedLetter {
  agencyKey: string
  agencyName: string
  content: string
  generatedAt: string // ISO
  sentAt?: string
  status: LetterStatus
  lastResponseAt?: string
  responseSummary?: string
  // Lob.com mailing fields — populated after the Mail Letter flow runs.
  mailedAt?: string
  trackingNumber?: string
  lobId?: string
  expectedDelivery?: string
  mailingMethod?: 'first-class' | 'certified' | 'certified-rr'
  mailedFrom?: string
}

export interface Dispute {
  id: string
  itemIds: string[]
  reasonByItem: Record<string, DisputeReasonAssignment>
  targetAgencies: string[] // agency keys
  generatedLetters: Record<string, GeneratedLetter> // keyed by agencyKey
  round: DisputeRound
  createdAt: string
  resolvedAt?: string
}

// -------- Page-level state machine --------
export type RepairView =
  | 'overview'
  | 'select-items'
  | 'choose-reasons'
  | 'pick-agencies'
  | 'generating'
  | 'letters-ready'
  | 'attaching-documents'
  | 'mailing-options'
  | 'mailing-sent'
  | 'tracking'

// -------- Toast / micro UI --------
export interface Toast {
  id: string
  tone: 'success' | 'info' | 'warning' | 'error'
  title: string
  message?: string
}
