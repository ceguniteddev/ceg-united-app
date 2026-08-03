// ============================================
// CEG Brain — Income-Based Funding — Mock Data
// ============================================
// Replace with Firestore reads in production.

import { calculateMaxFunding } from "./underwriting";
import type {
  AdminClient,
  DealOffer,
  DocumentRecord,
  IncomeFundingDeal,
  LoanCoordinator,
  UnderwritingInput,
  UserProfile,
} from "../types/income-funding-types";

// -------- The signed-in client --------
export const mockUser: UserProfile = {
  uid: "user_sharon_001",
  firstName: "Sharon",
  lastName: "Mitchell",
  email: "sharon@cegholdings.com",
};

// Sharon's underwriting input — should grade A and produce ~$168,750 pre-approval.
export const mockUnderwritingInput: UnderwritingInput = {
  monthlyDeposits: 45000,
  endingBalance: 22400,
  averageDailyBalance: 18200,
  negativeDays: 0,
  nsfCount: 1,
  timeInBusinessMonths: 24,
  industryType: "Professional Services",
  creditScore: 712,
};

export const mockUnderwritingResult = calculateMaxFunding(
  mockUnderwritingInput,
);

// -------- Coordinator --------
export const mockCoordinator: LoanCoordinator = {
  uid: "coord_marcus_001",
  name: "Marcus Reed",
  email: "marcus.reed@creditexpertsgroup.com",
  phone: "(305) 555-0142",
  initials: "MR",
};

// -------- Documents (Sharon's set) --------
export const mockDocuments: DocumentRecord[] = [
  {
    key: "ein",
    title: "EIN Letter",
    description: "IRS-issued employer identification number letter (CP 575).",
    required: true,
    status: "required",
  },
  {
    key: "articles",
    title: "Articles of Incorporation",
    description: "State filing showing entity formation.",
    required: true,
    status: "required",
  },
  {
    key: "voidedCheck",
    title: "Voided Check",
    description: "Voided check or bank letter for funding wire.",
    required: true,
    status: "required",
  },
  {
    key: "id",
    title: "Driver's License / ID",
    description: "Government-issued photo ID for the principal owner.",
    required: false,
    status: "optional",
  },
  {
    key: "bankStatements",
    title: "Business Bank Statements",
    description: "Last 4 months of business bank statements.",
    required: true,
    status: "synced",
    fileName: "Bank Statements",
    fileSize: "4 months",
  },
];

// -------- Mock offers (used in OffersView + AdminClientDetail) --------
export const mockOffers: DealOffer[] = [
  {
    id: "offer_rapid_001",
    dealType: "MCA",
    lenderName: "Rapid Capital",
    fundingAmount: 50000,
    paybackAmount: 67500,
    factorRate: 1.35,
    termLength: 9,
    termUnit: "months",
    paymentFrequency: "daily",
    estimatedPayment: 357,
    notes:
      "Requires last 4 months of business bank statements verified. ACH debit Mon-Fri.",
    approvalLikelihood: "most-likely",
    createdAt: "2025-01-12T15:30:00Z",
    createdBy: "coord_marcus_001",
  },
  {
    id: "offer_bluevine_002",
    dealType: "LOC",
    lenderName: "BlueVine",
    fundingAmount: 75000,
    paybackAmount: 88500,
    factorRate: 1.18,
    termLength: 12,
    termUnit: "months",
    paymentFrequency: "weekly",
    estimatedPayment: 1701,
    notes:
      "Revolving line of credit. Draw what you need, pay only on what you use. 700+ FICO required.",
    approvalLikelihood: "likely",
    createdAt: "2025-01-12T15:45:00Z",
    createdBy: "coord_marcus_001",
  },
  {
    id: "offer_clearco_003",
    dealType: "Revenue-Based",
    lenderName: "Clearco",
    fundingAmount: 40000,
    paybackAmount: 47200,
    factorRate: 1.18,
    termLength: 8,
    termUnit: "months",
    paymentFrequency: "monthly",
    estimatedPayment: 5900,
    notes:
      "Revenue-share model. Repayment scales with monthly receipts — no fixed term penalty.",
    approvalLikelihood: "possible",
    createdAt: "2025-01-12T16:02:00Z",
    createdBy: "coord_marcus_001",
  },
];

// -------- The deal (used by client state machine) --------
export const mockDeal: IncomeFundingDeal = {
  id: "deal_sharon_001",
  status: "prequalified",
  underwritingInput: mockUnderwritingInput,
  underwritingResult: mockUnderwritingResult,
  documents: mockDocuments,
  offers: mockOffers,
  coordinatorId: mockCoordinator.uid,
};

// -------- Admin: 5 mock clients across grades --------
export const mockAdminClients: AdminClient[] = [
  {
    uid: "user_sharon_001",
    referenceNumber: "REF-MOCK-123",
    firstName: "Sharon",
    lastName: "Mitchell",
    businessName: "CEG Holdings LLC",
    email: "sharon@cegholdings.com",
    monthlyRevenue: 45000,
    grade: "A",
    preApprovedAmount: 168753,
    status: "offers-ready",
    submittedAt: "2025-01-10",
    documents: mockDocuments.map((d) =>
      d.required
        ? {
            ...d,
            status: "uploaded",
            fileName: `${d.key}.pdf`,
            fileSize: "1.2 MB",
          }
        : d,
    ),
    offers: mockOffers,
  },
  {
    uid: "user_anthony_002",
    referenceNumber: "REF-MOCK-456",
    firstName: "Anthony",
    lastName: "Brooks",
    businessName: "Brooks Logistics Inc",
    email: "anthony@brookslogistics.com",
    monthlyRevenue: 28500,
    grade: "B",
    preApprovedAmount: 71250,
    status: "under-review",
    submittedAt: "2025-01-11",
    documents: mockDocuments.slice(0, 4).map((d) => ({
      ...d,
      status: "uploaded",
      fileName: `${d.key}.pdf`,
      fileSize: "0.9 MB",
    })),
    offers: [],
  },
  {
    uid: "user_priya_003",
    referenceNumber: "REF-MOCK-789",
    firstName: "Priya",
    lastName: "Shah",
    businessName: "Lotus Wellness Studio",
    email: "priya@lotuswellness.com",
    monthlyRevenue: 14200,
    grade: "C",
    preApprovedAmount: 17750,
    status: "collecting-documents",
    submittedAt: "2025-01-12",
    documents: mockDocuments.map((d, i) =>
      i < 2
        ? {
            ...d,
            status: "uploaded",
            fileName: `${d.key}.pdf`,
            fileSize: "0.7 MB",
          }
        : d,
    ),
    offers: [],
  },
  {
    uid: "user_diego_004",
    referenceNumber: "REF-MOCK-321",
    firstName: "Diego",
    lastName: "Ramirez",
    businessName: "RamCo Auto Repair",
    email: "diego@ramcoauto.com",
    monthlyRevenue: 22000,
    grade: "B",
    preApprovedAmount: 55000,
    status: "offers-ready",
    submittedAt: "2025-01-08",
    documents: mockDocuments.map((d) => ({
      ...d,
      status: "uploaded",
      fileName: `${d.key}.pdf`,
      fileSize: "1.0 MB",
    })),
    offers: [
      {
        id: "offer_kabbage_004",
        dealType: "MCA",
        lenderName: "Kabbage",
        fundingAmount: 35000,
        paybackAmount: 49000,
        factorRate: 1.4,
        termLength: 6,
        termUnit: "months",
        paymentFrequency: "daily",
        estimatedPayment: 379,
        notes: "Daily ACH. 6-month term.",
        approvalLikelihood: "most-likely",
        createdAt: "2025-01-09T10:00:00Z",
      },
    ],
  },
  {
    uid: "user_jamal_005",
    referenceNumber: "REF-MOCK-654",
    firstName: "Jamal",
    lastName: "Carter",
    businessName: "Carter Construction Group",
    email: "jamal@carterconstruction.com",
    monthlyRevenue: 62000,
    grade: "A",
    preApprovedAmount: 232500,
    status: "complete",
    submittedAt: "2025-01-05",
    documents: mockDocuments.map((d) => ({
      ...d,
      status: "uploaded",
      fileName: `${d.key}.pdf`,
      fileSize: "1.5 MB",
    })),
    offers: [
      {
        id: "offer_funbox_005",
        dealType: "Term Loan",
        lenderName: "Funding Circle",
        fundingAmount: 150000,
        paybackAmount: 178500,
        factorRate: 1.19,
        termLength: 24,
        termUnit: "months",
        paymentFrequency: "monthly",
        estimatedPayment: 7437,
        notes: "Fixed-rate term loan. UCC filing required.",
        approvalLikelihood: "most-likely",
        createdAt: "2025-01-06T09:00:00Z",
      },
    ],
  },
];

const names = [
  "Michael",
  "Sarah",
  "David",
  "Jessica",
  "Robert",
  "Emma",
  "William",
  "Olivia",
  "James",
  "Ava",
  "John",
  "Sophia",
  "Thomas",
  "Isabella",
  "Daniel",
];
const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Jones",
  "Brown",
  "Davis",
  "Miller",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
];
const businessTypes = [
  "Consulting",
  "Logistics",
  "Auto Repair",
  "Wellness",
  "Holdings",
  "Ventures",
  "Associates",
  "Partners",
  "Studio",
  "Inc",
  "LLC",
  "Group",
];

for (let i = 0; i < 15; i++) {
  const baseClient = mockAdminClients[i % 5];
  mockAdminClients.push({
    ...baseClient,
    uid: `user_mock_${i + 6}`,
    referenceNumber: `REF-MOCK-${1000 + i}`,
    firstName: names[i],
    lastName: lastNames[i],
    businessName: `${lastNames[i]} ${businessTypes[i % businessTypes.length]}`,
    monthlyRevenue: Math.floor(Math.random() * 80000) + 10000,
    preApprovedAmount: Math.floor(Math.random() * 200000) + 20000,
  });
}
