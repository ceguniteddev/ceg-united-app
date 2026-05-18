"use server";

const isProd = () => process.env.ENVIRONMENT === "production";

export const getFundingAnalysis = async () =>
  isProd() ? "funding-analysis-prod" : "funding-analysis";

export const getFundingAnalysisNewRegistrationFlow = async () =>
  isProd() ? "funding-analysis-new-registration-flow-prod" : "funding-analysis-new-registration-flow";

export const deleteFundingAnalysis = async () =>
  isProd() ? "delete-funding-analysis-prod" : "delete-funding-analysis";

export const createAsanaTaskForLender = async () =>
  isProd() ? "client-apply-bank-product-prod" : "client-apply-bank-product";

export const generateCRSReportN8N = async () =>
  isProd() ? "crs-report-prod" : "crs-report";

export const deleteCRSReportN8N = async () =>
  isProd() ? "delete-crs-qdrant-prod" : "delete-crs-qdrant";

export const sendClientAnalysisN8N = async () =>
  isProd() ? "send-client-analysis-prod" : "send-client-analysis";

export const createFundingAnalysisToPDFN8N = async () =>
  isProd() ? "credit-analysis-to-pdf-prod" : "credit-analysis-to-pdf";

export const generateDisputeLetterN8N = async () =>
  isProd() ? "generate-dispute-letter-prod" : "generate-dispute-letter";

export const generateDisputeLetterFactualErrorN8N = async () =>
  isProd()
    ? "generate-dispute-letter-factual-error"
    : "generate-dispute-letter-factual-error";

export const sendClientCongratsMessageN8N = async () =>
  isProd()
    ? "send-client-congrats-message-prod"
    : "send-client-congrats-message";

export const mapBankProductsN8n = async () =>
  isProd() ? "bank-product-mapping-prod" : "bank-product-mapping";

export const sendClientServiceAgreementN8N = async () =>
  isProd()
    ? "sign-client-service-agreement-prod"
    : "sign-client-service-agreement";

export const createAsanaCustomerServiceTaskN8N = async () =>
  isProd()
    ? "create-asana-customer-service-task-prod"
    : "create-asana-customer-service-task";

export const calculateBusinessIncomePreApprovedN8N = async () =>
  isProd()
    ? "business-income-preapprove-computation-prod"
    : "business-income-preapprove-computation";
