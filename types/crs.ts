export type ISODate = string;
export type ISODateTime = string;
export type NumericString = `${number}` | string;

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  dateReported?: ISODate;
  borrowerResidencyType?: string;
}

export type CRSReportType =
  | "experian"
  | "transunion"
  | "equifax"
  | "issues"
  | "dti";

export interface Name {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
}

export interface RequestData extends Name {
  ssn?: string;
  addresses?: Address[];
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
  creditFileResultStatusType?: string;
  sourceType?: string;
}
export interface CreditFile {
  creditFileDetail?: CreditFileDetail;
  aliases?: Name[];
  addresses?: Address[];
  ssns?: { ssn: string }[];
}

export interface TradelineComment {
  commentCode?: string;
  commentSourceType?: string;
  commentType?: string;
  commentText?: string;
}

export interface Tradeline {
  accountIdentifier: string;
  creditorName?: string;
  subscriberCode?: string;
  accountType?: string;
  loanType?: string;
  businessType?: string;
  accountOwnershipType?: string;
  accountStatusType?: string; // Open | Closed | Paid | Transferred | etc.
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
  pastDueAmount?: NumericString;
  derogatoryDataIndicator?: boolean;
  currentRatingCode?: string;
  currentRatingType?: string;
  paymentPatternData?: string;
  _30DayLates?: NumericString;
  _60DayLates?: NumericString;
  _90DayLates?: NumericString;
  sourceType?: string;
  comments?: TradelineComment[];
}

export interface Inquiry {
  creditorName?: string;
  inquiryDate?: ISODate;
  businessType?: string;
  subscriberCode?: string;
  sourceType?: string;
}

export interface ScoreFactor {
  scoreFactorCode: string;
  scoreFactorText: string;
}

export interface CreditScore {
  modelName: string;
  modelNameType?: string;
  sourceType?: string; // Experian | Equifax | TransUnion
  factaInquiriesIndicator?: boolean;
  scoreValue: NumericString;
  scoreRankPercentileValue?: NumericString;
  scoreMaximumValue?: NumericString;
  scoreMinimumValue?: NumericString;
  scoreFactors?: ScoreFactor[];
}

export interface OfacResult {
  name: string;
  productType?: string;
  sourceType?: string;
  resultText?: string;
  resultStatusType?: string;
}
export interface ErrorMessage {
  code: string;
  message: string;
  sourceType?: string;
}

export interface CreditReport {
  requestData: RequestData;
  repositoryIncluded: RepositoryIncluded;
  responseDetail?: ResponseDetail;
  responseAlertMessages?: unknown[];
  errorMessages?: ErrorMessage[];
  creditFiles?: CreditFile[];
  inquiries?: Inquiry[]; // present on some bureaus
  tradelines?: Tradeline[];
  scores?: CreditScore[];
  ofacs?: OfacResult[];
}

export interface CreditReportWithId extends Record<string, any> {
  id: string;
  userId?: string;
  report: CreditReport;
  createdAt: ISODate;
}
