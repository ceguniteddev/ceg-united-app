declare global {
  type DropdownOption = {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
    isRequired?: boolean;
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
}

export {};
