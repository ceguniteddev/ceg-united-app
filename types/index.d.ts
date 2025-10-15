import { FundingApplicationType } from "@/schema/apply-funding";
import { ApprovedBankFormData, BankFormData } from "@/schema/bank-products";

declare global {
  type AdminApprovedStatus = "Approved" | "Pending";
  type DropdownOption = {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
    isRequired?: boolean;
    category?: FundingApplicationType;
    type?: string;
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
    data?: BankFormData[] | ApprovedBankFormData[];
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
