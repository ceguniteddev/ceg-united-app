// Primitive helpers
export type ISODate = string; // e.g. "2025-09-09"
export type ISODateTime = string; // e.g. "2025-09-09T15:24:12.051826Z"
export type NumericString = `${number}`; // e.g. "4800"

// Common shapes
export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode?: string;
  dateReported?: ISODate;
}

export interface Name {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
}

export interface RequestAddress extends Address {
  borrowerResidencyType?: string; // e.g. "Current"
}

export interface RequestData extends Name {
  ssn?: string;
  addresses?: RequestAddress[];
}

export interface RepositoryIncluded {
  transunion: boolean;
  experian: boolean;
  equifax: boolean;
}

export interface Party {
  name: string;
}

export interface CreditBureauContact {
  name: string;
  address?: Address;
}

export interface ResponseDetail {
  dateRequested: ISODateTime;
  requestingParty?: Party;
  creditBureauContact?: CreditBureauContact;
}

export interface CreditFileDetail {
  creditFileInfileDate?: ISODate;
  creditFileResultStatusType?: "FileReturned" | "NoFileReturnedNoHit" | string;
  sourceType?: "Experian" | "Equifax" | "TransUnion" | string;
}

export interface CreditFile {
  creditFileDetail?: CreditFileDetail;
  aliases?: Name[];
  addresses?: Address[];
}

export interface TradelineComment {
  commentCode?: string;
  commentSourceType?: string; // e.g. "Experian"
  commentType?: string; // e.g. "BureauRemarks"
  commentText?: string; // e.g. "ACCOUNT CLOSED AT CONSUMER’S REQUEST"
}

export interface Tradeline {
  accountIdentifier: string;
  creditorName?: string;
  subscriberCode?: string;

  accountType?: string; // e.g. "Revolving", "Installment"
  loanType?: string; // e.g. "CreditCard"
  businessType?: string; // e.g. "Banking"

  accountOwnershipType?: string; // e.g. "Individual", "AuthorizedUser"
  accountStatusType?: "Open" | "Closed" | "Paid" | string;

  accountOpenedDate?: ISODate;
  accountClosedDate?: ISODate;
  accountPaidDate?: ISODate;
  lastActivityDate?: ISODate;
  accountReportedDate?: ISODate;
  paymentPatternStartDate?: ISODate;

  monthsReviewedCount?: NumericString;
  termsMonthsCount?: NumericString;

  creditLimitAmount?: NumericString;
  highBalanceAmount?: NumericString;
  currentBalanceAmount?: NumericString;
  monthlyPaymentAmount?: NumericString;

  derogatoryDataIndicator?: boolean;

  currentRatingCode?: string; // e.g. "C"
  currentRatingType?: string; // e.g. "AsAgreed"

  paymentPatternData?: string; // bureau’s raw payment grid (e.g. "CCCC...")

  /** Late counts (as strings in payload) */
  _30DayLates?: NumericString;
  _60DayLates?: NumericString;
  _90DayLates?: NumericString;

  sourceType?: "Experian" | "Equifax" | "TransUnion" | string;

  comments?: TradelineComment[];
}

export interface ScoreFactor {
  scoreFactorCode: string; // e.g. "10"
  scoreFactorText: string;
}

export interface CreditScore {
  modelName: string; // e.g. "Experian/Fair Isaac Risk Model V9"
  modelNameType?: string; // e.g. "F9"
  sourceType?: "Experian" | "Equifax" | "TransUnion" | string;

  scoreValue: NumericString; // e.g. "634"
  scoreMinimumValue?: NumericString; // e.g. "336"
  scoreMaximumValue?: NumericString; // e.g. "843"
  scoreRankPercentileValue?: NumericString; // e.g. "20"

  factaInquiriesIndicator?: boolean;
  scoreFactors?: ScoreFactor[];
}

export interface OfacResult {
  name: string; // e.g. "OFAC"
  productType?: string; // e.g. "OFAC"
  sourceType?: string; // e.g. "Experian"
  resultText?: string; // e.g. "OFAC SEARCH NOT PERFORMED DUE TO MISSING REQUIRED DATA"
  resultStatusType?: string; // e.g. "Error"
}

export interface ErrorMessage {
  creditErrorMessageCode: string;
  creditErrorMessageSourceType: string;
  creditErrorMessageText: string;
}

/**
 * Top-level credit report type for the provided payload
 */
export interface CreditReport {
  requestData: RequestData;
  repositoryIncluded: RepositoryIncluded;
  responseDetail?: ResponseDetail;

  /** Often empty or vendor-specific; keep as unknowns unless you have a schema */
  responseAlertMessages?: unknown[];
  errorMessages?: ErrorMessage[];

  creditFiles?: CreditFile[];
  tradelines?: Tradeline[];
  scores?: CreditScore[];
  ofacs?: OfacResult[];
}
