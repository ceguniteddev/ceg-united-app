"use server";

export const isProd = async () => process.env.ENVIRONMENT === "production";

export const getFundingAnalysis = async () =>
  (await isProd()) ? "funding-analysis-prod" : "funding-analysis";

export const deleteFundingAnalysis = async () =>
  (await isProd()) ? "delete-funding-analysis-prod" : "delete-funding-analysis";

export const createAsanaTaskForLender = async () =>
  (await isProd())
    ? "client-apply-bank-product-prod"
    : "client-apply-bank-product";

export const generateCRSReportN8N = async () =>
  (await isProd()) ? "crs-report-prod" : "crs-report";

export const deleteCRSReportN8N = async () =>
  (await isProd()) ? "delete-crs-qdrant-prod" : "delete-crs-qdrant";

export const sendClientAnalysisN8N = async () =>
  (await isProd()) ? "send-client-analysis-prod" : "send-client-analysis-prod";

export const createFundingAnalysisToPDFN8N = async () =>
  (await isProd()) ? "credit-analysis-to-pdf-prod" : "credit-analysis-to-pdf";
