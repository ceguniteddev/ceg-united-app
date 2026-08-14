/**
 * types/funding-playbook.ts
 * Canonical TypeScript types for the CEG Funding Playbook.
 */

export type Bureau = "experian" | "equifax" | "transunion";

export type FundingPath =
  | "personal_credit_cards"
  | "business_credit_cards"
  | "business_lines_of_credit"
  | "sba_loan"
  | "personal_loan"
  | "auto_loan"
  | "mortgage"
  | "mixed";

export type LenderType =
  | "bank"
  | "credit_union"
  | "online_lender"
  | "card_issuer";

export type ProductType =
  | "personal_credit_card"
  | "business_credit_card"
  | "business_line_of_credit"
  | "business_term_loan"
  | "sba_loan"
  | "personal_loan";

export type EmploymentType =
  | "w2_employee"
  | "self_employed"
  | "business_owner_llc"
  | "business_owner_scorp"
  | "business_owner_sole_prop"
  | "1099_contractor"
  | "retired"
  | "unemployed";

export interface CreditReportSummary {
  bureau: Bureau;
  score: number;
  pulledAt: string; // ISO date
  inquiriesLast6Months: number;
  inquiriesLast24Months: number;
  openTradelines: number;
  oldestTradelineAgeMonths: number;
  totalRevolvingLimit: number;
  totalRevolvingBalance: number;
  utilizationPct: number; // 0-100
  derogatoryMarks: string[];
  publicRecords: string[];
  fiveTwentyFourCount?: number;
}

export interface IncomeProfile {
  employmentType: EmploymentType;
  statedAnnualIncome: number;
  verifiableAnnualIncome: number;
  householdIncome?: number;
  monthlyGrossIncome: number;
  monthlyNetIncome: number;
  businessName?: string;
  businessAgeMonths?: number;
  businessAnnualRevenue?: number;
  taxReturnsAvailable: boolean;
  bankStatementsAvailableMonths: number;
  additionalMonthlyIncome?: number;
  additionalAnnualIncome?: number;
  additionalIncomeSource?: string;
  trailing3MonthRevenue?: number;
  annualizedBusinessRunRate?: number;
}

export interface DTIProfile {
  monthlyDebtPayments: number;
  monthlyGrossIncome: number;
  dtiPct: number;
  rentOrMortgageMonthly: number;
  rentOrMortgageIsReported: boolean;
  autoLoanMonthly?: number;
  studentLoanMonthly?: number;
  otherInstallmentMonthly?: number;
}

export interface ExistingLenderRelationship {
  lenderId: string;
  lenderDisplayName: string;
  relationshipType:
    | "checking"
    | "savings"
    | "credit_card"
    | "loan"
    | "business_banking";
  accountAgeMonths: number;
  averageBalance?: number;
  productIds: string[];
  lastDenialDate?: string;
  lastDenialReason?: string;
}

export interface ClientProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  zip: string;
  city?: string;
  state?: string;
  fundingPath: FundingPath;
  leadData?: any;
  fundingGoalAmount?: number;
  creditReports: CreditReportSummary[];
  income: IncomeProfile;
  dti: DTIProfile;
  existingLenderRelationships: ExistingLenderRelationship[];
  cegServicesEnrolled: Array<
    "tradelines" | "credit_repair" | "income_coaching" | "business_formation"
  >;
  createdAt: string;
  updatedAt: string;
}

export interface BankingRelationshipRequirements {
  ddaRequired: boolean;
  ddaRequiredStates?: string[];
  minRelationshipMonths?: number;
  minAverageBalance?: number;
  membershipRequired?: boolean;
  membershipRequirementNotes?: string;
  notes: string;
}

export interface CegProductLift {
  tradelines?: string;
  creditRepair?: string;
  incomeCoaching?: string;
  businessFormation?: string;
}

export interface Product {
  id: string;
  displayName: string;
  productType: ProductType;
  applicationUrl: string;
  existingCustomerUrl?: string;
  inBranchApplicationRecommended?: boolean;
  typicalApprovalRange: [number, number];
  minFICO: number;
  idealFICO?: number;
  denialReasons: string[];
  reconsiderationSuccessRate: number;
  structuringAdvice: string;
  cegProductLift: CegProductLift;
  annualFee?: number;
  introOfferNotes?: string;
  lastVerifiedAt: string;
  sourceNotes?: string;
}

export interface Lender {
  id: string;
  displayName: string;
  type: LenderType;
  primaryBureau: Bureau;
  secondaryBureau: Bureau | null;
  dualPullNotes?: string;
  bureauPullNotes: string;
  doubleDipFriendly: boolean;
  doubleDipRules: string;
  bankingRelationshipRequirements: BankingRelationshipRequirements;
  reconsiderationPhone: string;
  reconsiderationHours: string;
  reconsiderationTips: string;
  generalCustomerService: string;
  productPageBaseUrl: string;
  commonDenialReasons: string[];
  threeDayRuleNotes?: string;
  placesSearchQuery?: string;
  lastVerifiedAt: string;
  products: Product[];
}

export interface Branch {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  phone?: string;
  hours?: string[];
  openNow?: boolean;
  rating?: number;
  googleMapsUrl?: string;
}

export interface BranchCacheDoc {
  zip: string;
  lenderId: string;
  radiusMiles: number;
  branches: Branch[];
  fetchedAt: string;
  expiresAt: string;
}

export type ApplicationChannel =
  | "online"
  | "phone"
  | "in_branch"
  | "mobile_app";

export interface OtherChannel {
  channel: ApplicationChannel;
  recommended: boolean;
  note: string;
}

export interface Section1_BestMethod {
  recommendedChannel: ApplicationChannel;
  recommendedHeadline: string;
  reasoning: string;
  applicationUrl: string;
  inBranchRecommended: boolean;
  aiPersonalizedNote: string;
  keyTakeaways: string[];
  otherChannels: OtherChannel[];
  decisionSpeedNote: string;
}

export interface RelationshipAccount {
  label: string;
  detail: string;
  openedYear: number | null;
  balanceOrLimit: string;
}

export interface Section2_Relationship {
  hasExistingRelationship: boolean;
  relationshipDetails?: ExistingLenderRelationship;
  relationshipDepthAssessment: "none" | "light" | "moderate" | "deep";
  howRelationshipHelpsApproval: string;
  lenderDisplayName: string;
  yearsWithLender: number | null;
  accounts: RelationshipAccount[];
  applicationUrlLabel: string;
  whyThisMatters: string;
}

export type BureauRiskTier = "optimal" | "caution" | "high-risk";

export interface BureauInquiryInfo {
  bureau: Bureau;
  score: number | null;
  inquiries6mo: number;
  riskTier: BureauRiskTier;
  riskLabel: string;
  isPrimary: boolean;
}

export interface Section3_BureauPull {
  primaryBureau: Bureau;
  secondaryBureau: Bureau | null;
  clientScoreOnPrimaryBureau: number | null;
  bureauPullNotes: string;
  doubleDipFriendly: boolean;
  doubleDipRules: string;
  bureauInquiries: BureauInquiryInfo[];
  primaryBureauInquiries: number;
  primaryRiskTier: BureauRiskTier;
  primaryRiskLabel: string;
  favorable: boolean;
  ourRead: string;
}

export interface TopDriver {
  label: string;
  detail: string;
  weightPct: number;
  impact: "positive" | "negative" | "neutral";
}

export interface Section4_ApprovalEstimate {
  lenderDocumentedRange: [number, number];
  aiPersonalizedRange: [number, number];
  confidenceLevel: "low" | "medium" | "high";
  confidencePct?: number;
  aiReasoning: string;
  estimateNote?: string;
  topDrivers?: TopDriver[];
  minFICORequired: number;
  clientMeetsMinFICO: boolean;
}

export interface Section5_IncomeStructuring {
  currentStatedIncome: number;
  currentVerifiableIncome: number;
  aiRecommendedStatedIncome: number;
  aiReasoning: string;
  regulationBNote?: string;
  householdIncomeEligible: boolean;

  businessRevenue?: {
    annualBusinessRevenue: number;
    trailing3MonthRevenue: number;
    annualizedRunRate: number;
    documentableFrom: string;
    reasoning: string;
    fieldToEnter: number;
  };
  personalHouseholdIncome?: {
    householdTotal: number;
    yourIncome: number;
    additionalIncome: number;
    additionalIncomeSourceLabel?: string;
    reasoning: string;
    fieldToEnter: number;
  };
  whatToEnterSummary?: string;
}

export interface Section6_HousingStructuring {
  currentMonthlyHousingPayment: number;
  isReportedOnCreditReport: boolean;
  dtiImpactIfIncluded: number;
  dtiImpactIfExcluded: number;
  aiStructuringMath: string;
  aiRecommendation: string;
}

export interface Section7_DenialPathReasoning {
  lenderCommonDenialReasons: string[];
  productSpecificDenialReasons: string[];
  aiClientSpecificRisks: string[];
  aiMitigationSteps: string[];
  reconsiderationSuccessRateForProduct: number;
}

export interface CegRecommendation {
  service:
    | "tradelines"
    | "credit_repair"
    | "income_coaching"
    | "business_formation";
  rank: number;
  curatedImpactEstimate: string;
  aiApplicability: string;
  estimatedTimeToImpactDays: number;
}

export interface Section8_CegRecommendations {
  recommendations: CegRecommendation[];
}

export interface Section9_NearestBranches {
  zip: string;
  radiusMiles: number;
  branches: Branch[];
}

export interface Section10_ReconsiderationScript {
  reconsiderationPhone: string;
  reconsiderationHours: string;
  reconsiderationTips: string;
  aiPhoneScript: string;
}

export interface Section11_TimingStrategy {
  threeDayRuleNotes?: string;
  recommendedSequencing: string;
  aiTimingRationale: string;
}

export interface AlternativeProduct {
  productId: string;
  displayName: string;
  whyConsidered: string;
}

export interface Section12_Alternatives {
  alternatives: AlternativeProduct[];
}

export interface Section13_HelpOptions {
  cegSupportPhone: string;
  cegSupportEmail: string;
  scheduleConsultUrl: string;
  relevantLearningModules: string[];
  aiClosingNote: string;
}

export interface PlaybookMeta {
  id: string;
  clientId: string;
  lenderId: string;
  productId: string;
  lenderDisplayName?: string;
  productDisplayName?: string;
  generatedAt: string;
  expiresAt: string;
  reasoningModel: string;
  reasoningModelVersion?: string;
  generationCostUsdEstimate?: number;
  dataSourceVersions: {
    clientUpdatedAt: string;
    lenderLastVerifiedAt: string;
    productLastVerifiedAt: string;
  };
}

export interface Playbook {
  meta: PlaybookMeta;
  section1_bestMethod: Section1_BestMethod;
  section2_relationship: Section2_Relationship;
  section3_bureauPull: Section3_BureauPull;
  section4_approvalEstimate: Section4_ApprovalEstimate;
  section5_incomeStructuring: Section5_IncomeStructuring;
  section6_housingStructuring: Section6_HousingStructuring;
  section7_denialPathReasoning: Section7_DenialPathReasoning;
  section8_cegRecommendations: Section8_CegRecommendations;
  section9_nearestBranches: Section9_NearestBranches;
  section10_reconsiderationScript: Section10_ReconsiderationScript;
  section11_timingStrategy: Section11_TimingStrategy;
  section12_alternatives: Section12_Alternatives;
  section13_helpOptions: Section13_HelpOptions;
}

export interface PlaybookFeedback {
  id: string;
  playbookId: string;
  clientId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  sectionRatings?: Partial<
    Record<keyof Omit<Playbook, "meta">, 1 | 2 | 3 | 4 | 5>
  >;
  outcomeReported?: "approved" | "denied" | "not_yet_applied" | "unknown";
  approvedAmount?: number;
  submittedAt: string;
}

export interface LenderHistoryEntry {
  id: string;
  lenderId: string;
  checkedAt: string;
  productId: string;
  field: "applicationUrl" | "existingCustomerUrl" | "productPageBaseUrl";
  previousValue: string;
  currentHttpStatus: number;
  isLive: boolean;
  flaggedForReview: boolean;
  notes?: string;
}

export interface AIPlaybookReasoningOutput {
  section1_aiPersonalizedNote: string;
  section1_recommendedChannel: ApplicationChannel;
  section1_recommendedHeadline: string;
  section1_reasoning: string;
  section1_keyTakeaways: string[];
  section1_otherChannels: OtherChannel[];
  section1_decisionSpeedNote: string;
  section2_whyThisMatters: string;
  section3_ourRead: string;
  section4_aiPersonalizedRange: [number, number];
  section4_confidenceLevel: "low" | "medium" | "high";
  section4_confidencePct?: number;
  section4_aiReasoning: string;
  section4_estimateNote?: string;
  section4_topDrivers?: TopDriver[];
  section5_aiRecommendedStatedIncome: number;
  section5_aiReasoning: string;
  section5_regulationBNote?: string;
  section5_businessRevenueReasoning?: string;
  section5_personalHouseholdReasoning?: string;
  section6_aiStructuringMath: string;
  section6_aiRecommendation: string;
  section7_aiClientSpecificRisks: string[];
  section7_aiMitigationSteps: string[];
  section8_recommendations: Array<{
    service:
      | "tradelines"
      | "credit_repair"
      | "income_coaching"
      | "business_formation";
    rank: number;
    aiApplicability: string;
    estimatedTimeToImpactDays: number;
  }>;
  section10_aiPhoneScript: string;
  section11_aiTimingRationale: string;
  section13_aiClosingNote: string;
}

export interface AIReconsiderationScriptOutput {
  script: string;
}

export type ReasoningModelName =
  | "gpt-5"
  | "claude-sonnet-4.5"
  | "gemini-2.5-pro";

export interface GeneratePlaybookRequest {
  clientId: string;
  lenderId: string;
  productId: string;
}

export interface NearestBranchesRequest {
  zip: string;
  lenderId: string;
  radiusMiles?: number;
}

export interface ReconsiderationScriptRequest {
  clientId: string;
  lenderId: string;
  denialReason: string;
}

export interface SavePlaybookFeedbackRequest {
  playbookId: string;
  clientId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  sectionRatings?: Partial<
    Record<keyof Omit<Playbook, "meta">, 1 | 2 | 3 | 4 | 5>
  >;
  outcomeReported?: "approved" | "denied" | "not_yet_applied" | "unknown";
  approvedAmount?: number;
}
