declare global {
  type ApprovedMappedFund = {
    id?: string;
    bankProductId: string;
    createdAt: Date;
    approvedById: string;
  };
}

export {};
