declare global {
  type DropdownOption = {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
    isRequired?: boolean;
  };

  type LinkTokenDoc = {
    userId: string;
    linkToken: string;
    requestId: string;
    expiresAt: Date;
    createdAt: Date;
  };

  type PlaidAccessToken = {
    id: string;
    userId: string;
    accessToken: string;
    itemId: string;
    createdAt: Date;
  };
}

export {};
