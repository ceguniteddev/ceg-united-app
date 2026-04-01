import { describe, it, expect, afterEach } from "vitest";
import {
  getFundingAnalysis,
  deleteFundingAnalysis,
  createAsanaTaskForLender,
  generateCRSReportN8N,
  deleteCRSReportN8N,
  sendClientAnalysisN8N,
  createFundingAnalysisToPDFN8N,
  generateDisputeLetterN8N,
  generateDisputeLetterFactualErrorN8N,
  sendClientCongratsMessageN8N,
  mapBankProductsN8n,
  sendClientServiceAgreementN8N,
  createAsanaCustomerServiceTaskN8N,
} from "@/lib/n8n";

afterEach(() => {
  delete process.env.ENVIRONMENT;
});

describe("getFundingAnalysis", () => {
  it("returns dev webhook name when ENVIRONMENT is not set", async () => {
    expect(await getFundingAnalysis()).toBe("funding-analysis");
  });

  it("returns prod webhook name when ENVIRONMENT=production", async () => {
    process.env.ENVIRONMENT = "production";
    expect(await getFundingAnalysis()).toBe("funding-analysis-prod");
  });
});

describe("deleteFundingAnalysis", () => {
  it("returns dev webhook name when ENVIRONMENT is not set", async () => {
    expect(await deleteFundingAnalysis()).toBe("delete-funding-analysis");
  });

  it("returns prod webhook name when ENVIRONMENT=production", async () => {
    process.env.ENVIRONMENT = "production";
    expect(await deleteFundingAnalysis()).toBe("delete-funding-analysis-prod");
  });
});

describe("createAsanaTaskForLender", () => {
  it("returns dev webhook name when ENVIRONMENT is not set", async () => {
    expect(await createAsanaTaskForLender()).toBe("client-apply-bank-product");
  });

  it("returns prod webhook name when ENVIRONMENT=production", async () => {
    process.env.ENVIRONMENT = "production";
    expect(await createAsanaTaskForLender()).toBe(
      "client-apply-bank-product-prod",
    );
  });
});

describe("generateCRSReportN8N", () => {
  it("returns dev webhook name when ENVIRONMENT is not set", async () => {
    expect(await generateCRSReportN8N()).toBe("crs-report");
  });

  it("returns prod webhook name when ENVIRONMENT=production", async () => {
    process.env.ENVIRONMENT = "production";
    expect(await generateCRSReportN8N()).toBe("crs-report-prod");
  });
});

describe("deleteCRSReportN8N", () => {
  it("returns dev webhook name when ENVIRONMENT is not set", async () => {
    expect(await deleteCRSReportN8N()).toBe("delete-crs-qdrant");
  });

  it("returns prod webhook name when ENVIRONMENT=production", async () => {
    process.env.ENVIRONMENT = "production";
    expect(await deleteCRSReportN8N()).toBe("delete-crs-qdrant-prod");
  });
});

describe("sendClientAnalysisN8N", () => {
  it("returns dev webhook name when ENVIRONMENT is not set", async () => {
    expect(await sendClientAnalysisN8N()).toBe("send-client-analysis");
  });

  it("returns prod webhook name when ENVIRONMENT=production", async () => {
    process.env.ENVIRONMENT = "production";
    expect(await sendClientAnalysisN8N()).toBe("send-client-analysis-prod");
  });
});

describe("createFundingAnalysisToPDFN8N", () => {
  it("returns dev webhook name when ENVIRONMENT is not set", async () => {
    expect(await createFundingAnalysisToPDFN8N()).toBe(
      "credit-analysis-to-pdf",
    );
  });

  it("returns prod webhook name when ENVIRONMENT=production", async () => {
    process.env.ENVIRONMENT = "production";
    expect(await createFundingAnalysisToPDFN8N()).toBe(
      "credit-analysis-to-pdf-prod",
    );
  });
});

describe("generateDisputeLetterN8N", () => {
  it("returns dev webhook name when ENVIRONMENT is not set", async () => {
    expect(await generateDisputeLetterN8N()).toBe("generate-dispute-letter");
  });

  it("returns prod webhook name when ENVIRONMENT=production", async () => {
    process.env.ENVIRONMENT = "production";
    expect(await generateDisputeLetterN8N()).toBe(
      "generate-dispute-letter-prod",
    );
  });
});

describe("generateDisputeLetterFactualErrorN8N", () => {
  it("returns same webhook name regardless of environment", async () => {
    expect(await generateDisputeLetterFactualErrorN8N()).toBe(
      "generate-dispute-letter-factual-error",
    );
  });

  it("returns same webhook name in production", async () => {
    process.env.ENVIRONMENT = "production";
    expect(await generateDisputeLetterFactualErrorN8N()).toBe(
      "generate-dispute-letter-factual-error",
    );
  });
});

describe("sendClientCongratsMessageN8N", () => {
  it("returns dev webhook name when ENVIRONMENT is not set", async () => {
    expect(await sendClientCongratsMessageN8N()).toBe(
      "send-client-congrats-message",
    );
  });

  it("returns prod webhook name when ENVIRONMENT=production", async () => {
    process.env.ENVIRONMENT = "production";
    expect(await sendClientCongratsMessageN8N()).toBe(
      "send-client-congrats-message-prod",
    );
  });
});

describe("mapBankProductsN8n", () => {
  it("returns dev webhook name when ENVIRONMENT is not set", async () => {
    expect(await mapBankProductsN8n()).toBe("bank-product-mapping");
  });

  it("returns prod webhook name when ENVIRONMENT=production", async () => {
    process.env.ENVIRONMENT = "production";
    expect(await mapBankProductsN8n()).toBe("bank-product-mapping-prod");
  });
});

describe("sendClientServiceAgreementN8N", () => {
  it("returns dev webhook name when ENVIRONMENT is not set", async () => {
    expect(await sendClientServiceAgreementN8N()).toBe(
      "sign-client-service-agreement",
    );
  });

  it("returns prod webhook name when ENVIRONMENT=production", async () => {
    process.env.ENVIRONMENT = "production";
    expect(await sendClientServiceAgreementN8N()).toBe(
      "sign-client-service-agreement-prod",
    );
  });
});

describe("createAsanaCustomerServiceTaskN8N", () => {
  it("returns dev webhook name when ENVIRONMENT is not set", async () => {
    expect(await createAsanaCustomerServiceTaskN8N()).toBe(
      "create-asana-customer-service-task",
    );
  });

  it("returns prod webhook name when ENVIRONMENT=production", async () => {
    process.env.ENVIRONMENT = "production";
    expect(await createAsanaCustomerServiceTaskN8N()).toBe(
      "create-asana-customer-service-task-prod",
    );
  });
});
