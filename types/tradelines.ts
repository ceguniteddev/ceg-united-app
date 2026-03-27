// ============================================
// Tradelines — TypeScript Interfaces
// ============================================
// Covers available tradelines, purchased tradelines,
// shopping cart, credit builder accounts, and special deals.

export type TradelineCategory =
  | "available"
  | "purchased"
  | "personal-credit-builder"
  | "business-credit-builder"
  | "special-deals";

export type TradelineStatus = "in-stock" | "low-stock" | "out-of-stock";

export type PurchaseStatus = "pending" | "approved" | "declined";

export interface AvailableTradeline {
  id: string;
  bankName: string;
  cardId: string;
  creditLimit: number;
  dateOpened: string; // e.g. "2015 Mar"
  purchaseByDate: string; // e.g. "Apr 7th"
  reportingDate: string; // e.g. "Apr 18th"
  stock: number;
  price: number;
  status: TradelineStatus;
  featured?: boolean;
  image?: string;
}

export interface PurchasedTradeline {
  id: string;
  bankName: string;
  cardId: string;
  creditLimit: number;
  purchasedOn: string; // e.g. "3/26/2026"
  quantity: number;
  totalPaid: number;
  status: PurchaseStatus;
  image?: string;
}

export interface CartItem {
  tradeline: AvailableTradeline;
  quantity: number;
}

export interface CreditBuilderAccount {
  id: string;
  name: string;
  type: "personal" | "business";
  provider: string;
  description: string;
  creditLimitRange: string; // e.g. "$500 - $5,000"
  monthlyFee: number | string;
  setupFee: number | string;
  reportsToBureaus: string[];
  timeToReport: string; // e.g. "30-60 days"
  recommended?: boolean;
}

export interface SpecialDeal {
  id: string;
  bankName: string;
  cardId: string;
  creditLimit: number;
  dateOpened: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  stock: number;
  expiresAt: string; // ISO date
  tag: string; // e.g. "Flash Sale", "Limited Time"
  image?: string;
}
