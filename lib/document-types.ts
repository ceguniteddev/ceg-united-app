import {
  FileText,
  FileBadge,
  IdCard,
  Landmark,
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
    id: "PAYSTUBS",
    title: "Paystubs (1 Month)",
    description:
      "Only if payroll verification linking has not been done. Upload your most recent month's worth.",
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
];
