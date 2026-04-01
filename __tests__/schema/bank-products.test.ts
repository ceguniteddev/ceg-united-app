import { describe, it, expect } from "vitest";
import {
  YesNoEnum,
  ApplicationMethodEnum,
  ClientApplicationMethodEnum,
  CreditBureauEnum,
  ClientApplicationStatusEnum,
  TaxYearsEnum,
  bankProductCriteriaSchema,
  bankDataSchema,
} from "@/schema/bank-products";

describe("YesNoEnum", () => {
  it("accepts Yes", () => {
    expect(YesNoEnum.safeParse("Yes").success).toBe(true);
  });

  it("accepts No", () => {
    expect(YesNoEnum.safeParse("No").success).toBe(true);
  });

  it("accepts Unknown", () => {
    expect(YesNoEnum.safeParse("Unknown").success).toBe(true);
  });

  it("is optional (accepts undefined)", () => {
    expect(YesNoEnum.safeParse(undefined).success).toBe(true);
  });

  it("rejects invalid value", () => {
    expect(YesNoEnum.safeParse("Maybe").success).toBe(false);
  });
});

describe("ApplicationMethodEnum", () => {
  it.each(["Online", "Branch", "Referral", "Phone"])("accepts %s", (value) => {
    expect(ApplicationMethodEnum.safeParse(value).success).toBe(true);
  });

  it("rejects invalid method", () => {
    expect(ApplicationMethodEnum.safeParse("Email").success).toBe(false);
  });
});

describe("ClientApplicationMethodEnum", () => {
  it("accepts specialist", () => {
    expect(ClientApplicationMethodEnum.safeParse("specialist").success).toBe(
      true,
    );
  });

  it("accepts online", () => {
    expect(ClientApplicationMethodEnum.safeParse("online").success).toBe(true);
  });

  it("rejects other values", () => {
    expect(ClientApplicationMethodEnum.safeParse("branch").success).toBe(false);
    expect(ClientApplicationMethodEnum.safeParse("Online").success).toBe(false);
    expect(ClientApplicationMethodEnum.safeParse("").success).toBe(false);
  });
});

describe("CreditBureauEnum", () => {
  const validBureaus = [
    "Experian",
    "TransUnion",
    "Equifax",
    "Dun & Bradstreet or SBFE",
    "TRW",
    "LexisNexis",
    "Clarity",
    "Experian Business",
    "Equifax Business",
  ];

  it.each(validBureaus)("accepts %s", (value) => {
    expect(CreditBureauEnum.safeParse(value).success).toBe(true);
  });

  it("rejects invalid bureau", () => {
    expect(CreditBureauEnum.safeParse("FICO").success).toBe(false);
    expect(CreditBureauEnum.safeParse("").success).toBe(false);
  });
});

describe("ClientApplicationStatusEnum", () => {
  const validStatuses = [
    "Not Applied",
    "Pending",
    "Sent to Lender",
    "Approved",
    "Declined",
    "Funded",
    "Lender Skipped",
  ];

  it.each(validStatuses)("accepts %s", (value) => {
    expect(ClientApplicationStatusEnum.safeParse(value).success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(ClientApplicationStatusEnum.safeParse("Processing").success).toBe(
      false,
    );
  });
});

describe("TaxYearsEnum", () => {
  it.each(["None", "1 Year", "2 Years", "3 Years"])("accepts %s", (value) => {
    expect(TaxYearsEnum.safeParse(value).success).toBe(true);
  });

  it("rejects invalid value", () => {
    expect(TaxYearsEnum.safeParse("4 Years").success).toBe(false);
  });
});

describe("bankProductCriteriaSchema", () => {
  const validMinimal = {
    productName: "Personal Line of Credit",
    creditBureauPulled: ["Experian"],
    stateAvailability: ["CA", "TX"],
    applicationMethod: ["Online"],
  };

  it("accepts valid minimal object", () => {
    const result = bankProductCriteriaSchema.safeParse(validMinimal);
    expect(result.success).toBe(true);
  });

  it("rejects empty productName", () => {
    const result = bankProductCriteriaSchema.safeParse({
      ...validMinimal,
      productName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid creditBureauPulled value", () => {
    const result = bankProductCriteriaSchema.safeParse({
      ...validMinimal,
      creditBureauPulled: ["InvalidBureau"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid applicationMethod value", () => {
    const result = bankProductCriteriaSchema.safeParse({
      ...validMinimal,
      applicationMethod: ["Email"],
    });
    expect(result.success).toBe(false);
  });
});

describe("bankDataSchema", () => {
  const validProduct = {
    productName: "Business Credit",
    creditBureauPulled: ["Equifax"],
    stateAvailability: ["NY"],
    applicationMethod: ["Branch"],
  };

  it("accepts valid bank with products array", () => {
    const result = bankDataSchema.safeParse({
      bankName: "First National Bank",
      products: [validProduct],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty products array (min 1)", () => {
    const result = bankDataSchema.safeParse({
      bankName: "First National Bank",
      products: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing bankName", () => {
    const result = bankDataSchema.safeParse({
      products: [validProduct],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty bankName", () => {
    const result = bankDataSchema.safeParse({
      bankName: "",
      products: [validProduct],
    });
    expect(result.success).toBe(false);
  });
});
