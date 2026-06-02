import type {
  ClientInfo,
  BureauScore,
  NegativeItem,
  UserProfile,
} from "./credit-repair-types";

// ============================================
// Mock Data — Used for local preview only.
// In production, replace with Firestore reads.
// ============================================

export const mockUser: UserProfile = {
  uid: "demo-uid-001",
  firstName: "Jordan",
  lastName: "Mitchell",
  email: "jordan.mitchell@example.com",
};

export const mockClient: ClientInfo = {
  uid: "demo-uid-001",
  firstName: "Jordan",
  lastName: "Mitchell",
  email: "jordan.mitchell@example.com",
  phone: "(415) 555-0148",
  dob: "1986-05-14",
  ssnLast4: "4821",
  address: {
    line1: "2847 Mission Street",
    line2: "Apt 4B",
    city: "San Francisco",
    state: "CA",
    zip: "94110",
  },
};

export const mockBureauScores: BureauScore[] = [
  {
    bureau: "experian",
    score: 612,
    delta: 12,
    pulledAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    bureau: "equifax",
    score: 597,
    delta: 8,
    pulledAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    bureau: "transunion",
    score: 624,
    delta: -3,
    pulledAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
];

// 12 realistic negative items spanning the full mix.
export const mockNegativeItems: NegativeItem[] = [
  {
    id: "neg-001",
    type: "collection",
    creditor: "Portfolio Recovery Associates",
    accountNumber: "****8472",
    bureaus: ["equifax", "transunion"],
    amount: 1247,
    dateOpened: "2022-03-12",
    dateReported: "2024-09-01",
    status: "new",
  },
  {
    id: "neg-002",
    type: "collection",
    creditor: "LVNV Funding LLC",
    accountNumber: "****5103",
    bureaus: ["experian", "equifax", "transunion"],
    amount: 834,
    dateOpened: "2021-08-04",
    dateReported: "2024-08-22",
    status: "new",
  },
  {
    id: "neg-003",
    type: "collection",
    creditor: "Midland Credit Management",
    accountNumber: "****2916",
    bureaus: ["experian"],
    amount: 2109,
    dateOpened: "2020-11-19",
    dateReported: "2024-07-15",
    status: "new",
  },
  {
    id: "neg-004",
    type: "charge-off",
    creditor: "Capital One Bank",
    accountNumber: "****7244",
    bureaus: ["experian", "equifax"],
    amount: 5432,
    dateOpened: "2019-02-08",
    dateReported: "2024-06-30",
    status: "new",
  },
  {
    id: "neg-005",
    type: "charge-off",
    creditor: "Synchrony Bank",
    accountNumber: "****1058",
    bureaus: ["transunion"],
    amount: 1895,
    dateOpened: "2020-05-22",
    dateReported: "2024-05-12",
    status: "new",
  },
  {
    id: "neg-006",
    type: "late-payment",
    creditor: "Discover Bank",
    accountNumber: "****3367",
    bureaus: ["equifax"],
    amount: 412,
    dateOpened: "2018-07-15",
    dateReported: "2024-04-01",
    status: "new",
    latePaymentDays: 30,
  },
  {
    id: "neg-007",
    type: "late-payment",
    creditor: "Citi (Citibank N.A.)",
    accountNumber: "****9981",
    bureaus: ["experian", "transunion"],
    amount: 1180,
    dateOpened: "2017-01-30",
    dateReported: "2024-03-12",
    status: "new",
    latePaymentDays: 60,
  },
  {
    id: "neg-008",
    type: "late-payment",
    creditor: "Wells Fargo Bank",
    accountNumber: "****4422",
    bureaus: ["experian", "equifax", "transunion"],
    amount: 2740,
    dateOpened: "2016-09-10",
    dateReported: "2024-02-19",
    status: "new",
    latePaymentDays: 90,
  },
  {
    id: "neg-009",
    type: "late-payment",
    creditor: "Bank of America",
    accountNumber: "****6688",
    bureaus: ["equifax"],
    amount: 615,
    dateOpened: "2019-04-21",
    dateReported: "2024-01-08",
    status: "new",
    latePaymentDays: 30,
  },
  {
    id: "neg-010",
    type: "inquiry",
    creditor: "Chase Bank",
    accountNumber: "—",
    bureaus: ["experian"],
    amount: 0,
    dateOpened: "2024-04-10",
    dateReported: "2024-04-10",
    status: "new",
    inquiryAgeMonths: 8,
  },
  {
    id: "neg-011",
    type: "inquiry",
    creditor: "American Express",
    accountNumber: "—",
    bureaus: ["equifax", "transunion"],
    amount: 0,
    dateOpened: "2024-01-22",
    dateReported: "2024-01-22",
    status: "new",
    inquiryAgeMonths: 11,
  },
  {
    id: "neg-012",
    type: "public-record",
    creditor: "Superior Court of CA — Civil Judgment",
    accountNumber: "CGC-22-0" + "06438",
    bureaus: ["experian", "equifax", "transunion"],
    amount: 3250,
    dateOpened: "2022-06-14",
    dateReported: "2024-09-01",
    status: "new",
    publicRecordType: "civil-judgment",
  },
];

export const mockReportHealth = {
  totalAccounts: 18,
  negativeItems: mockNegativeItems.length,
  openDisputes: 0,
  itemsDeleted: 0,
  averageScore: 611,
};

export const mockPositiveFactors = [
  {
    label: "Long credit history",
    detail: "11 years 4 months — older than 78% of consumers",
    impact: "high",
  },
  {
    label: "Diverse credit mix",
    detail: "4 revolving accounts + 2 installment loans",
    impact: "medium",
  },
  {
    label: "Recent on-time payments",
    detail: "12 consecutive months across all open accounts",
    impact: "high",
  },
  {
    label: "Healthy oldest account",
    detail: "Discover card — opened July 2013, never late",
    impact: "medium",
  },
];

export const mockNegativeFactors = [
  {
    label: "High credit utilization",
    detail: "68% across revolving — keep below 30%",
    impact: "high",
  },
  {
    label: "Recent late payments",
    detail: "4 late payments in the last 24 months",
    impact: "high",
  },
  {
    label: "Collections on file",
    detail: "3 active collections totaling $4,190",
    impact: "high",
  },
  {
    label: "Public record on file",
    detail: "1 civil judgment for $3,250 — heavy negative",
    impact: "high",
  },
];
