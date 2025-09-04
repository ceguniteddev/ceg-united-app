declare global {
  type PlaidLinkTokenCreateRequest = {
    userId: string;
    userToken?: string;
    incomeSourceType?: IncomeVerificationSourceType;
    itemId?: string;
    isNewAccount?: boolean;
  };

  type LinkTokenDoc = {
    userId: string;
    linkToken: string;
    requestId: string;
    expiresAt: Date;
    createdAt: Date;
  };

  type PlaidAccessToken = {
    id?: string;
    userId: string;
    accessToken: string;
    iv: string;
    itemId: string;
    tokenType: TokenType;
    createdAt: Date | null;
  };

  type TokenType = "ITEM" | "INCOME_VERIFICATION_BANK" | "INCOME_VERIFICATION_PAYROLL";

  type PlaidWebhookType = "ITEM" | "ASSETS";

  interface PlaidItemWebhookData {
    createdAt: Date;
    environment: string;
    error: string;
    item_id: string;
    reason: string;
    webhook_code: string;
  }

  interface PlaidAssetWebhookData {
    asset_report_id: string;
    environment: string;
    report_type: string;
    webhook_code: string;
  }

  // Discriminated union
  type PlaidWebhookData =
    | (PlaidItemWebhookData & { webhook_type: "ITEM" })
    | (PlaidAssetWebhookData & { webhook_type: "ASSETS" });

  type PlaidAssetReportRequest = {
    userId: string;
    assetReportToken: string;
    assetReportId: string;
    itemId: string;
    createdAt: Date;
  };
}

export {};
