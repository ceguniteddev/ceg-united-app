"use server";

export const isProd = async () => process.env.ENVIRONMENT === "production";

export const getFundingAnalysis = async () =>
  (await isProd()) ? "funding-analysis-prod" : "funding-analysis";

export const createAsanaTaskForLender = async () =>
  (await isProd())
    ? "client-apply-bank-product-prod"
    : "client-apply-bank-product";

export const generateCRSReportN8N = async () =>
  (await isProd()) ? "crs-report-prod" : "crs-report";

export const deleteCRSReportN8N = async () =>
  (await isProd()) ? "delete-crs-qdrant-prod" : "delete-crs-qdrant";
