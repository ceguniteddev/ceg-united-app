// ============================================
// CEG Brain — My Documents Library (mock)
// ============================================
// In production, this lives at Firestore: users/{uid}/documents/{docId}
// with file storage in Firebase Storage. Each document captures the
// metadata needed to attach it to outbound dispute mail.
//
// Schema (Firestore):
//   filename: string
//   storageUrl: string  (Firebase Storage signed URL)
//   sizeBytes: number
//   mimeType: 'application/pdf' | 'image/jpeg' | 'image/png'
//   category: 'identity' | 'address' | 'financial' | 'legal' | 'other'
//   uploadedAt: Timestamp
//   tags: string[]

export type DocumentCategory =
  | "identity"
  | "address"
  | "financial"
  | "legal"
  | "other";

export type DocumentMime = "application/pdf" | "image/jpeg" | "image/png";

export interface MyDocument {
  id: string;
  filename: string;
  storageUrl?: string;
  sizeBytes: number;
  mimeType: DocumentMime;
  category: DocumentCategory;
  uploadedAt: string; // ISO
  tags: string[];
}

export const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  identity: "Identity",
  address: "Address",
  financial: "Financial",
  legal: "Legal",
  other: "Other",
};

// 8 demo documents covering every category so the picker always feels real.
export const MOCK_USER_DOCUMENTS: MyDocument[] = [
  {
    id: "doc-1",
    filename: "drivers-license.pdf",
    sizeBytes: 1_258_291, // 1.2 MB
    mimeType: "application/pdf",
    category: "identity",
    uploadedAt: "2026-01-12T15:32:00Z",
    tags: ["ID", "DL"],
  },
  {
    id: "doc-2",
    filename: "utility-bill-pge-jan2026.pdf",
    sizeBytes: 877_568, // 856 KB
    mimeType: "application/pdf",
    category: "address",
    uploadedAt: "2026-01-28T09:14:00Z",
    tags: ["utility", "POA"],
  },
  {
    id: "doc-3",
    filename: "social-security-card.pdf",
    sizeBytes: 442_368, // 432 KB
    mimeType: "application/pdf",
    category: "identity",
    uploadedAt: "2025-12-03T12:01:00Z",
    tags: ["SSN", "sensitive"],
  },
  {
    id: "doc-4",
    filename: "ein-letter.pdf",
    sizeBytes: 202_752, // 198 KB
    mimeType: "application/pdf",
    category: "legal",
    uploadedAt: "2025-11-15T18:42:00Z",
    tags: ["IRS", "EIN"],
  },
  {
    id: "doc-5",
    filename: "lease-agreement.pdf",
    sizeBytes: 2_202_009, // 2.1 MB
    mimeType: "application/pdf",
    category: "address",
    uploadedAt: "2025-10-22T11:20:00Z",
    tags: ["lease", "POA"],
  },
  {
    id: "doc-6",
    filename: "bank-statement-chase-feb2026.pdf",
    sizeBytes: 1_468_006, // 1.4 MB
    mimeType: "application/pdf",
    category: "financial",
    uploadedAt: "2026-02-05T08:05:00Z",
    tags: ["bank", "Chase"],
  },
  {
    id: "doc-7",
    filename: "passport.jpg",
    sizeBytes: 3_355_443, // 3.2 MB
    mimeType: "image/jpeg",
    category: "identity",
    uploadedAt: "2025-09-08T16:48:00Z",
    tags: ["passport", "ID"],
  },
  {
    id: "doc-8",
    filename: "pay-stub-acme-jan2026.pdf",
    sizeBytes: 612_352, // 598 KB
    mimeType: "application/pdf",
    category: "financial",
    uploadedAt: "2026-01-15T10:00:00Z",
    tags: ["paystub", "income"],
  },
];

// ---------- helpers ----------

import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";

export function subscribeToDocuments(
  uid: string,
  callback: (docs: MyDocument[]) => void,
) {
  const q = query(
    collection(db, `users/${uid}/documents`),
    orderBy("uploadedAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MyDocument));
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatUploadDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------- "Required identity" + "Optional supporting" templates ----------
// These are NOT user-uploaded files. They're checkbox templates the user can
// toggle to indicate "yes, I've gathered this proof and I'm including it".
// In production the UI would prompt the user to upload each one before
// finalizing — for the demo we treat them as deterministic check-items.

export interface RequiredDocTemplate {
  id: string;
  label: string;
  description: string;
  /** suggested file size when included as PDF */
  estimatedSizeBytes: number;
  /** category to filter against the user library */
  matchCategory: DocumentCategory;
}

export const REQUIRED_IDENTITY_DOCS: RequiredDocTemplate[] = [
  {
    id: "req-dl",
    label: "Driver’s License or State ID",
    description:
      "Government-issued photo ID matching the name on your dispute letter.",
    estimatedSizeBytes: 1_200_000,
    matchCategory: "identity",
  },
  {
    id: "req-ssn",
    label: "Social Security Card (or W-2 / SSA letter)",
    description: "Proof of SSN — redact all but last 4 digits before sending.",
    estimatedSizeBytes: 450_000,
    matchCategory: "identity",
  },
  {
    id: "req-poa",
    label: "Proof of Address",
    description:
      "Utility bill, lease, or bank statement dated within the last 90 days.",
    estimatedSizeBytes: 900_000,
    matchCategory: "address",
  },
];

export interface OptionalDocTemplate {
  id: string;
  label: string;
  description: string;
  estimatedSizeBytes: number;
  /** auto-recommend ON when any selected dispute uses this reason code */
  autoRecommendForReason?: string;
}

export const OPTIONAL_SUPPORTING_DOCS: OptionalDocTemplate[] = [
  {
    id: "opt-ftc",
    label: "FTC Identity Theft Report (Form 14039)",
    description: "Required for FCRA §605B blocks. File at IdentityTheft.gov.",
    estimatedSizeBytes: 800_000,
    autoRecommendForReason: "fraud",
  },
  {
    id: "opt-police",
    label: "Police Report",
    description:
      "Strengthens identity-theft claims; many jurisdictions accept online filings.",
    estimatedSizeBytes: 650_000,
    autoRecommendForReason: "fraud",
  },
  {
    id: "opt-bk",
    label: "Bankruptcy Discharge Papers",
    description: "Court order showing the debt was discharged.",
    estimatedSizeBytes: 1_400_000,
    autoRecommendForReason: "included-in-bk",
  },
  {
    id: "opt-receipts",
    label: "Payment Receipts / Proof of Payment",
    description:
      "Cancelled checks, settlement letters, or paid-in-full statements.",
    estimatedSizeBytes: 700_000,
    autoRecommendForReason: "paid-in-full",
  },
  {
    id: "opt-goodwill",
    label: "Goodwill Letter",
    description: "Personalized request for the creditor to remove a paid item.",
    estimatedSizeBytes: 200_000,
    autoRecommendForReason: "goodwill",
  },
  {
    id: "opt-cd",
    label: "Cease and Desist Letter",
    description: "Stops collector contact under FDCPA §805(c).",
    estimatedSizeBytes: 200_000,
  },
  {
    id: "opt-mov",
    label: "Method of Verification Request",
    description: "Forces the bureau to disclose how the item was “verified”.",
    estimatedSizeBytes: 250_000,
  },
  {
    id: "opt-closure",
    label: "Account Closure Confirmation",
    description: "Letter from the creditor confirming the account is closed.",
    estimatedSizeBytes: 350_000,
  },
];
