import { BankFormData } from "@/schema/bank-products";

declare global {
  type AdminApprovedStatus = "Approved" | "Pending";
  type DropdownOption = {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
    isRequired?: boolean;
    category?: FundingApplicationType;
  };

  type AdminStatistics = {
    totalClients: number;
    totalFundingApplications: number;
    countsByState: {
      [key: string]: number;
    };
    countsByStatus: {
      [key: string]: number;
    };
  };

  type InterestedProduct =
    | "Personal & Business Funding"
    | "Personal Funding"
    | "Business Funding"
    | "Personal Tradelines"
    | "Business Tradelines"
    | "Personal & Business Tradelines"
    | "Aged Shelf Corporation"
    | "Knowledge Community"
    | "Auto Loan"
    | "Equipment Financing";

  type UserDoc = {
    name: string;
    path: string;
    contentType?: string;
    size: number;
    updated: string;
    signedUrl: string;
  };

  type GetBankFormDataResponse = {
    success: boolean;
    data?: BankFormData[];
    error?: "error" | "warning";
    message?: string;
  };

  type CommonResponse = {
    success: boolean;
    error?: "error" | "warning";
    message?: string;
  };
}

export {};
