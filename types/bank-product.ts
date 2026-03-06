import { BankProductCriteria } from "@/schema/bank-products";

declare global {
  type ApprovedMappedFund = {
    id?: string;
    bankProductId: string;
    createdAt: Date;
    approvedById: string;
    referenceNumber: string;
    userId: string;
    products: BankProductCriteria[];
  };
}

export {};
