import {
  FileText,
  FileBadge,
  IdCard,
  UserSquare,
  FileCheck2,
  FileKey2,
  Handshake,
  ShieldCheck,
  LineChart,
  Columns,
  Lightbulb,
  ReceiptText,
  ShieldAlert,
  CreditCard,
  BadgeDollarSign,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface DocumentType {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: "universal" | "personal" | "business";
  required: boolean;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: "DRIVERS_LICENSE",
    title: "Driver's License",
    description:
      "Upload a clear image of the front and back. All 4 corners must be visible.",
    icon: UserSquare,
    category: "universal",
    required: true,
  },
  {
    id: "SSN_CARD",
    title: "SSN Card",
    description:
      "Upload a clear, sharp image of your Social Security card. All 4 corners must be visible.",
    icon: IdCard,
    category: "universal",
    required: true,
  },
  {
    id: "BANK_STATEMENTS",
    title: "Business Bank Statements",
    description: "Upload your most recent month's business bank statements.",
    icon: CreditCard,
    category: "universal",
    required: true,
  },
  {
    id: "PERSONAL_BANK_STATEMENTS",
    title: "Personal Bank Statements",
    description: "Upload your most recent month's personal bank statements.",
    icon: CreditCard,
    category: "personal",
    required: true,
  },
  {
    id: "PAYSTUBS",
    title: "Paystubs ",
    description: "Upload your most recent month's worth.",
    icon: ReceiptText,
    category: "personal",
    required: false, // Optional
  },
  {
    id: "PROOF_OF_ADDRESS",
    title: "Proof of Address",
    description:
      "A bill or statement (no older than 90 days) showing your name and address.",
    icon: FileCheck2,
    category: "personal",
    required: false, // Optional
  },
  {
    id: "PERSONAL_TAXES",
    title: "Taxes (Up to 3 Years)",
    description:
      "Upload your personal tax returns for the last 3 years, or extension documents if filed.",
    icon: FileText,
    category: "personal",
    required: false, // Optional
  },
  {
    id: "EIN_LETTER",
    title: "EIN Letter",
    description:
      "Your official Employer Identification Number letter from the IRS. PDF format is required.",
    icon: FileKey2,
    category: "business",
    required: true, // Must upload
  },
  {
    id: "ARTICLES_OF_ORGANIZATION",
    title: "Articles of Org. / Inc.",
    description:
      "Your LLC's Articles of Organization or your Corporation's Articles of Incorporation.",
    icon: FileBadge,
    category: "business",
    required: true, // Must upload
  },
  {
    id: "OPERATING_AGREEMENT",
    title: "Bylaws / Operating Agreement",
    description: "Your Corporation's Bylaws or your LLC's Operating Agreement.",
    icon: Handshake,
    category: "business",
    required: false, // Optional
  },
  {
    id: "BUSINESS_TAXES",
    title: "Business Taxes (Up to 3 Years)",
    description:
      "Upload your business tax returns for the last 3 years, or extension documents if filed.",
    icon: FileText,
    category: "business",
    required: false, // Optional
  },
  {
    id: "BUSINESS_PERMITS",
    title: "Business Permits",
    description:
      "Upload any permits required for your industry to operate legally.",
    icon: ShieldCheck,
    category: "business",
    required: false, // Optional
  },
  {
    id: "BUSINESS_INSURANCE",
    title: "Business Insurance",
    description:
      "Upload proof of insurance if your industry requires it to operate.",
    icon: ShieldAlert,
    category: "business",
    required: false, // Optional
  },
  {
    id: "PROFIT_AND_LOSS",
    title: "Year to Date Profit & Loss",
    description: "Your Year-to-Date Profit and Loss statement.",
    icon: LineChart,
    category: "business",
    required: false, // Optional
  },
  {
    id: "BALANCE_SHEET",
    title: "Year to Date Balance Sheet",
    description: "Your Year-to-Date Balance Sheet.",
    icon: Columns,
    category: "business",
    required: false, // Optional
  },
  {
    id: "BUSINESS_PLAN",
    title: "Business Plan",
    description: "Your formal business plan document.",
    icon: Lightbulb,
    category: "business",
    required: false, // Optional
  },
  {
    id: "VOIDED_CHECK",
    title: "Voided Check",
    description:
      "Upload a voided business check to verify your bank account for funding.",
    icon: ReceiptText,
    category: "business",
    required: false,
  },
  {
    id: "OFFER_DOCUMENT",
    title: "Offer Document",
    description: "Upload the offer document for your funding request.",
    icon: BadgeDollarSign,
    category: "business",
    required: false,
  },
  // --- Credit Repair Optional Documents ---
  {
    id: "FTC_REPORT",
    title: "FTC Identity Theft Report",
    description: "Required for FCRA §605B blocks. File at IdentityTheft.gov.",
    icon: ShieldAlert,
    category: "personal",
    required: false,
  },
  {
    id: "POLICE_REPORT",
    title: "Police Report",
    description: "Strengthens identity-theft claims.",
    icon: ShieldCheck,
    category: "personal",
    required: false,
  },
  {
    id: "BANKRUPTCY_PAPERS",
    title: "Bankruptcy Discharge Papers",
    description: "Court order showing the debt was discharged.",
    icon: FileText,
    category: "personal",
    required: false,
  },
  {
    id: "PAYMENT_RECEIPT",
    title: "Payment Receipts / Proof of Payment",
    description:
      "Cancelled checks, settlement letters, or paid-in-full statements.",
    icon: ReceiptText,
    category: "personal",
    required: false,
  },
  {
    id: "GOODWILL_LETTER",
    title: "Goodwill Letter",
    description: "Personalized request for the creditor to remove a paid item.",
    icon: FileText,
    category: "personal",
    required: false,
  },
  {
    id: "CEASE_AND_DESIST",
    title: "Cease and Desist Letter",
    description: "Stops collector contact under FDCPA §805(c).",
    icon: FileText,
    category: "personal",
    required: false,
  },
  {
    id: "METHOD_OF_VERIFICATION",
    title: "Method of Verification Request",
    description: "Forces the bureau to disclose how the item was verified.",
    icon: FileText,
    category: "personal",
    required: false,
  },
  {
    id: "ACCOUNT_CLOSURE_CONFIRMATION",
    title: "Account Closure Confirmation",
    description: "Letter from the creditor confirming the account is closed.",
    icon: FileCheck2,
    category: "personal",
    required: false,
  },
];
