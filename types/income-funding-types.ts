// ============================================
// CEG Brain — Income-Based Funding — TypeScript Types
// ============================================
// These types mirror the Firestore schema described in INSTRUCTIONS.md.

// -------- User --------
export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

// -------- Underwriting --------
export type RiskGrade = "A" | "B" | "C" | "D";

export interface UnderwritingInput {
  monthlyDeposits: number;
  endingBalance: number;
  averageDailyBalance: number;
  negativeDays: number;
  nsfCount: number;
  timeInBusinessMonths: number;
  industryType: string;
  creditScore: number;
}

export interface UnderwritingResult {
  grade: RiskGrade;
  maxFundingAmount: number;
  multiplier: number;
  // Concrete values used in the formula, displayed in the UI breakdown card.
  baseMultiple: number;
  percentage: number;
  rationale: string;
}

// -------- Documents --------
export type DocumentStatus = "required" | "optional" | "uploaded" | "synced";

export interface UploadedFileRecord {
  fileName: string;
  fileSize: string;
  signedUrl?: string;
  contentType?: string;
}

export interface DocumentRecord {
  key: "ein" | "articles" | "voidedCheck" | "id" | "bankStatements";
  title: string;
  description: string;
  required: boolean;
  status: DocumentStatus;
  fileName?: string;
  fileSize?: string;
  signedUrl?: string;
  contentType?: string;
  files?: UploadedFileRecord[];
}

// -------- Deal / Offers --------
export type DealType =
  | "MCA"
  | "LOC"
  | "Revenue-Based"
  | "Term Loan"
  | "Equipment Finance";
export type ApprovalLikelihood = "most-likely" | "likely" | "possible";
export type TermUnit = "days" | "weeks" | "months";
export type PaymentFrequency = "daily" | "weekly" | "biweekly" | "monthly";

export interface DealOfferDocument {
  name: string;
  url: string;
}

export interface DealOffer {
  id: string;
  dealType: DealType;
  lenderName: string;
  brokerageId?: string;
  brokerageName?: string;
  fundingAmount: number;
  paybackAmount: number;
  factorRate: number;
  termLength: number;
  termUnit: TermUnit;
  paymentFrequency: PaymentFrequency;
  estimatedPayment: number;
  notes: string;
  approvalLikelihood: ApprovalLikelihood;
  createdAt: string;
  createdBy?: string;
  status?: "Pending" | "Accepted" | "Skipped";
  documents?: DealOfferDocument[];
  percentageFee?: number;
}

// -------- Deal Status (state machine) --------
export type DealStatus =
  | "prequalified"
  | "collecting-documents"
  | "under-review"
  | "offers-ready"
  | "accepting"
  | "complete";

export interface IncomeFundingDeal {
  id: string;
  status: DealStatus;
  underwritingInput: UnderwritingInput;
  underwritingResult: UnderwritingResult;
  documents: DocumentRecord[];
  offers: DealOffer[];
  selectedOfferId?: string;
  submittedAt?: string;
  acceptedAt?: string;
  coordinatorId: string;
}

// -------- Coordinator / Admin --------
export interface LoanCoordinator {
  uid: string;
  name: string;
  email: string;
  phone: string;
  initials: string;
}

export interface AdminClient {
  uid: string;
  referenceNumber: string;
  firstName: string;
  lastName: string;
  businessName: string;
  monthlyRevenue: number;
  email: string;
  grade: RiskGrade;
  preApprovedAmount: number | { amount: number; calculationSteps?: string; rationale?: string; stipulations?: string[] };
  status: DealStatus;
  backendStatus?: string;
  submittedAt: string;
  documents: DocumentRecord[];
  offers: DealOffer[];
  ein?: string;
}
