declare global {
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
    name: string; // "invoice.pdf"
    path: string; // "documents/<uid>/invoice.pdf"
    contentType?: string;
    size: number; // bytes
    updated: string; // ISO string from GCS
    signedUrl: string; // time-limited read URL
  };
}

export {};
