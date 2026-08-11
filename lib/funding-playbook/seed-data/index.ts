import { firestoreAdmin } from "@/lib/fireabase-admin";

export const LENDER_SEED_DATA = [
  {
    id: "american-express",
    displayName: "American Express",
    type: "card_issuer",
    primaryBureau: "experian",
    secondaryBureau: null,
    dualPullNotes:
      "Amex pulls Experian for the large majority of US consumer and small-business card applications.",
    bureauPullNotes:
      "American Express pulls Experian for both personal and small-business card applications.",
    doubleDipFriendly: false,
    doubleDipRules:
      "Amex is NOT considered double-dip friendly. Each application triggers its own hard inquiry.",
    bankingRelationshipRequirements: {
      ddaRequired: false,
      minRelationshipMonths: 0,
      membershipRequired: false,
      notes:
        "No banking relationship is required. However, applying by phone can reach a live underwriter faster.",
    },
    reconsiderationPhone: "1-800-567-1083",
    reconsiderationHours: "Mon-Fri 8am-midnight ET, Sat 10am-6:30pm ET",
    reconsiderationTips: "Call as soon as possible after the denial notice.",
    generalCustomerService: "1-800-528-4800",
    productPageBaseUrl:
      "https://www.americanexpress.com/us/credit-cards/business-credit-cards/",
    commonDenialReasons: [
      "too many Amex accounts opened in trailing 90 days",
      "prior bankruptcy or charge-off with Amex",
      "insufficient stated income",
      "at Amex total unsecured credit exposure limit",
      "thin file",
    ],
    placesSearchQuery: "American Express office",
    lastVerifiedAt: "2026-07-15",
    products: [
      {
        id: "business-platinum",
        displayName: "The Business Platinum Card®",
        productType: "business_credit_card",
        applicationUrl:
          "https://www.americanexpress.com/us/credit-cards/business/business-platinum-card/",
        existingCustomerUrl: "https://global.americanexpress.com/",
        inBranchApplicationRecommended: false,
        typicalApprovalRange: [10000, 50000],
        minFICO: 700,
        idealFICO: 760,
        denialReasons: [
          "Amex velocity limit exceeded",
          "insufficient verifiable business revenue",
          "existing exposure high",
        ],
        reconsiderationSuccessRate: 0.3,
        structuringAdvice:
          "Charge card approval is driven by ability-to-pay signals (income, cash reserves).",
        cegProductLift: {
          tradelines: "+30 points for thin-file applicants",
          creditRepair: "+25 points if late payments present",
          incomeCoaching: "+$10,000-$20,000 in effective spending capacity",
        },
        annualFee: 695,
        lastVerifiedAt: "2026-07-15",
      },
      {
        id: "business-gold",
        displayName: "American Express® Business Gold Card",
        productType: "business_credit_card",
        applicationUrl:
          "https://www.americanexpress.com/us/credit-cards/business/business-gold-card/",
        existingCustomerUrl: "https://global.americanexpress.com/",
        inBranchApplicationRecommended: false,
        typicalApprovalRange: [5000, 35000],
        minFICO: 690,
        idealFICO: 740,
        denialReasons: [
          "Amex velocity limit exceeded",
          "insufficient stated business income",
          "thin file",
        ],
        reconsiderationSuccessRate: 0.35,
        structuringAdvice:
          "Slightly more accessible underwriting than Business Platinum.",
        cegProductLift: {
          tradelines: "+30 points for thin-file applicants",
          creditRepair: "+25 points if late payments present",
          incomeCoaching: "+$5,000-$12,000 in effective spending capacity",
        },
        annualFee: 375,
        lastVerifiedAt: "2026-07-15",
      },
      {
        id: "blue-business-cash",
        displayName: "Blue Business Cash™ Card",
        productType: "business_credit_card",
        applicationUrl:
          "https://www.americanexpress.com/us/credit-cards/business/blue-business-cash-card/",
        existingCustomerUrl: "https://global.americanexpress.com/",
        inBranchApplicationRecommended: false,
        typicalApprovalRange: [3000, 20000],
        minFICO: 670,
        idealFICO: 700,
        denialReasons: [
          "Amex velocity limit exceeded",
          "thin file",
          "insufficient business income",
        ],
        reconsiderationSuccessRate: 0.4,
        structuringAdvice:
          "Best entry-point Amex business product for thin-file or newer-business applicants.",
        cegProductLift: {
          tradelines: "+30 points for thin-file applicants",
          creditRepair: "+25 points if late payments present",
          incomeCoaching: "+$2,000-$5,000 approval lift",
        },
        annualFee: 0,
        lastVerifiedAt: "2026-07-15",
      },
    ],
  },
  {
    id: "bank-of-america",
    displayName: "Bank of America",
    type: "bank",
    primaryBureau: "experian",
    secondaryBureau: null,
    dualPullNotes:
      "Bank of America pulls Experian for the majority of business card applications.",
    bureauPullNotes:
      "Tiered underwriting by banking relationship depth via Preferred Rewards for Business.",
    doubleDipFriendly: false,
    doubleDipRules:
      "Bank of America does not have a well-documented double-dip pattern.",
    bankingRelationshipRequirements: {
      ddaRequired: false,
      minRelationshipMonths: 0,
      membershipRequired: false,
      notes:
        "Preferred Rewards tiers (Gold/Platinum/Honors) improve approval odds.",
    },
    reconsiderationPhone: "1-866-695-6598",
    reconsiderationHours: "Mon-Fri 8am-7pm ET",
    reconsiderationTips: "Use the number printed on your denial letter first.",
    generalCustomerService: "1-888-287-4637",
    productPageBaseUrl:
      "https://www.bankofamerica.com/smallbusiness/credit-cards/",
    commonDenialReasons: [
      "insufficient banking relationship depth",
      "thin file",
      "too many recent inquiries",
      "insufficient business revenue",
    ],
    placesSearchQuery: "Bank of America branch",
    lastVerifiedAt: "2026-07-15",
    products: [
      {
        id: "business-advantage-unlimited-cash-rewards",
        displayName:
          "Bank of America® Business Advantage Unlimited Cash Rewards Mastercard®",
        productType: "business_credit_card",
        applicationUrl:
          "https://www.bankofamerica.com/smallbusiness/credit-cards/business-advantage-unlimited-cash-rewards/",
        existingCustomerUrl: "https://www.bankofamerica.com/smallbusiness/",
        inBranchApplicationRecommended: true,
        typicalApprovalRange: [5000, 25000],
        minFICO: 690,
        idealFICO: 730,
        denialReasons: [
          "no existing BofA business banking relationship",
          "insufficient business revenue",
          "thin file",
        ],
        reconsiderationSuccessRate: 0.3,
        structuringAdvice:
          "Opening a BofA checking account 30-60 days before applying is the highest-leverage move.",
        cegProductLift: {
          tradelines: "+35 points for thin-file applicants",
          creditRepair: "+25 points if late payments present",
          incomeCoaching: "+$3,000-$8,000 approval lift",
          businessFormation:
            "Establishing an LLC/EIN with BofA checking improves approval odds materially.",
        },
        annualFee: 0,
        lastVerifiedAt: "2026-07-15",
      },
    ],
  },
  {
    id: "capital-one",
    displayName: "Capital One",
    type: "bank",
    primaryBureau: "experian",
    secondaryBureau: "transunion",
    dualPullNotes:
      "Capital One pulls Experian OR TransUnion depending on state.",
    bureauPullNotes: "Bureau pulled varies by state/region.",
    doubleDipFriendly: false,
    doubleDipRules:
      "NOT double-dip friendly — same day triggers separate hard inquiries.",
    bankingRelationshipRequirements: {
      ddaRequired: false,
      minRelationshipMonths: 0,
      membershipRequired: false,
      notes: "No banking relationship required.",
    },
    reconsiderationPhone: "1-800-625-7866",
    reconsiderationHours: "Mon-Fri 8am-8pm ET",
    reconsiderationTips: "Wait for official decision letter before calling.",
    generalCustomerService: "1-800-955-7070",
    productPageBaseUrl:
      "https://www.capitalone.com/small-business/credit-cards/",
    commonDenialReasons: [
      "exceeds Capital One card velocity limit",
      "too many recent inquiries",
      "insufficient income",
      "thin file",
    ],
    placesSearchQuery: "Capital One Bank branch or Capital One Café",
    lastVerifiedAt: "2026-07-15",
    products: [
      {
        id: "spark-cash-plus",
        displayName: "Capital One Spark Cash Plus",
        productType: "business_credit_card",
        applicationUrl:
          "https://www.capitalone.com/small-business/credit-cards/spark-cash-plus/",
        existingCustomerUrl: "https://www.capitalone.com/small-business/",
        inBranchApplicationRecommended: false,
        typicalApprovalRange: [5000, 50000],
        minFICO: 700,
        idealFICO: 750,
        denialReasons: [
          "insufficient verifiable revenue",
          "too many recent inquiries",
          "thin business file",
        ],
        reconsiderationSuccessRate: 0.2,
        structuringAdvice:
          "Charge card requiring strong, well-documented business revenue.",
        cegProductLift: {
          tradelines: "+35 points for thin-file applicants",
          creditRepair: "+25 points if late payments present",
          incomeCoaching: "+$5,000-$15,000 approval lift",
        },
        annualFee: 150,
        lastVerifiedAt: "2026-07-15",
      },
      {
        id: "venture-x-business",
        displayName: "Capital One Venture X Business",
        productType: "business_credit_card",
        applicationUrl:
          "https://www.capitalone.com/small-business/credit-cards/venture-x-business/",
        existingCustomerUrl: "https://www.capitalone.com/small-business/",
        inBranchApplicationRecommended: false,
        typicalApprovalRange: [10000, 50000],
        minFICO: 720,
        idealFICO: 760,
        denialReasons: [
          "too many recent inquiries",
          "insufficient business revenue",
          "thin file",
        ],
        reconsiderationSuccessRate: 0.2,
        structuringAdvice: "True revolving credit line.",
        cegProductLift: {
          tradelines: "+35 points for thin-file applicants",
          creditRepair: "+25 points if late payments present",
          incomeCoaching: "+$5,000-$12,000 approval lift",
        },
        annualFee: 395,
        lastVerifiedAt: "2026-07-15",
      },
    ],
  },
  {
    id: "chase",
    displayName: "Chase",
    type: "bank",
    primaryBureau: "experian",
    secondaryBureau: null,
    dualPullNotes: "Chase pulls Experian for virtually all applications.",
    bureauPullNotes: "Experian is the default consumer-facing bureau.",
    doubleDipFriendly: true,
    doubleDipRules:
      "Same-day applications for two business cards often reuse a single Experian pull.",
    bankingRelationshipRequirements: {
      ddaRequired: false,
      minRelationshipMonths: 0,
      membershipRequired: false,
      notes: "No checking required, but Chase Business Complete account helps.",
    },
    reconsiderationPhone: "1-888-609-7805",
    reconsiderationHours: "Mon-Fri 9am-9pm ET",
    reconsiderationTips: "Call within 1-3 business days of denial letter.",
    generalCustomerService: "1-800-432-3117",
    productPageBaseUrl: "https://www.chase.com/business/credit-cards",
    commonDenialReasons: [
      "5/24 rule violation",
      "too many recent inquiries",
      "thin file",
      "insufficient stated business income",
      "at Chase credit exposure limit",
    ],
    threeDayRuleNotes:
      "Space applications by at least 7 days to avoid 3-day rule auto-flagging.",
    placesSearchQuery: "Chase Bank branch",
    lastVerifiedAt: "2026-07-15",
    products: [
      {
        id: "ink-business-preferred",
        displayName: "Ink Business Preferred® Credit Card",
        productType: "business_credit_card",
        applicationUrl:
          "https://creditcards.chase.com/business-credit-cards/ink/business-preferred",
        existingCustomerUrl: "https://www.chase.com/business/credit-cards",
        inBranchApplicationRecommended: false,
        typicalApprovalRange: [10000, 50000],
        minFICO: 690,
        idealFICO: 740,
        denialReasons: [
          "5/24 rule violation",
          "insufficient verifiable business income",
        ],
        reconsiderationSuccessRate: 0.35,
        structuringAdvice:
          "Sole proprietors can state personal income plus side business revenue.",
        cegProductLift: {
          tradelines: "+45 points for thin-file applicants",
          creditRepair: "+30 points for late payments",
          incomeCoaching: "+$8,000-$15,000 approved limit boost",
        },
        annualFee: 95,
        lastVerifiedAt: "2026-07-15",
      },
      {
        id: "ink-business-cash",
        displayName: "Ink Business Cash® Credit Card",
        productType: "business_credit_card",
        applicationUrl:
          "https://creditcards.chase.com/business-credit-cards/ink/business-cash",
        existingCustomerUrl: "https://www.chase.com/business/credit-cards",
        inBranchApplicationRecommended: false,
        typicalApprovalRange: [3000, 25000],
        minFICO: 670,
        idealFICO: 720,
        denialReasons: [
          "5/24 rule violation",
          "thin file",
          "too many recent inquiries",
        ],
        reconsiderationSuccessRate: 0.4,
        structuringAdvice:
          "Good first Chase business card for thin-file applicants.",
        cegProductLift: {
          tradelines: "+45 points for thin-file applicants",
          creditRepair: "+30 points if late payments present",
          incomeCoaching: "+$3,000-$7,000 approval lift",
        },
        annualFee: 0,
        lastVerifiedAt: "2026-07-15",
      },
      {
        id: "ink-business-unlimited",
        displayName: "Ink Business Unlimited® Credit Card",
        productType: "business_credit_card",
        applicationUrl:
          "https://creditcards.chase.com/business-credit-cards/ink/business-unlimited",
        existingCustomerUrl: "https://www.chase.com/business/credit-cards",
        inBranchApplicationRecommended: false,
        typicalApprovalRange: [3000, 25000],
        minFICO: 670,
        idealFICO: 720,
        denialReasons: [
          "5/24 rule violation",
          "thin file",
          "too many recent inquiries",
        ],
        reconsiderationSuccessRate: 0.4,
        structuringAdvice:
          "Identical underwriting profile to Ink Business Cash.",
        cegProductLift: {
          tradelines: "+45 points for thin-file applicants",
          creditRepair: "+30 points if late payments present",
          incomeCoaching: "+$3,000-$7,000 approval lift",
        },
        annualFee: 0,
        lastVerifiedAt: "2026-07-15",
      },
      {
        id: "sapphire-preferred",
        displayName: "Chase Sapphire Preferred® Card",
        productType: "personal_credit_card",
        applicationUrl:
          "https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred",
        existingCustomerUrl: "https://www.chase.com/personal/credit-cards",
        inBranchApplicationRecommended: false,
        typicalApprovalRange: [5000, 20000],
        minFICO: 700,
        idealFICO: 750,
        denialReasons: [
          "5/24 rule violation",
          "insufficient personal income relative to debt",
        ],
        reconsiderationSuccessRate: 0.3,
        structuringAdvice:
          "Reg B household income may apply if 21+ with reasonable access to spouse income.",
        cegProductLift: {
          tradelines: "+45 points for thin-file applicants",
          creditRepair: "+30 points if late payments present",
          incomeCoaching: "+$3,000-$6,000 approval lift",
        },
        annualFee: 95,
        lastVerifiedAt: "2026-07-15",
      },
    ],
  },
  {
    id: "navy-federal",
    displayName: "Navy Federal Credit Union",
    type: "credit_union",
    primaryBureau: "equifax",
    secondaryBureau: null,
    dualPullNotes: "Navy Federal consistently pulls Equifax.",
    bureauPullNotes:
      "Pulls Equifax; heavily weighs member relationship history.",
    doubleDipFriendly: false,
    doubleDipRules: "No documented double-dip pattern.",
    bankingRelationshipRequirements: {
      ddaRequired: false,
      minRelationshipMonths: 1,
      membershipRequired: true,
      membershipRequirementNotes:
        "Restricted to military/DoD civilian & immediate family.",
      notes:
        "Membership should be established at least 30 days before applying.",
    },
    reconsiderationPhone: "1-888-842-6328",
    reconsiderationHours: "24/7 Member Services",
    reconsiderationTips:
      "Emphasize membership tenure, direct deposit, and loan payment history.",
    generalCustomerService: "1-888-842-6328",
    productPageBaseUrl:
      "https://www.navyfederal.org/loans-cards/credit-cards.html",
    commonDenialReasons: [
      "membership under 30 days",
      "no direct deposit",
      "thin file",
    ],
    placesSearchQuery: "Navy Federal Credit Union branch",
    lastVerifiedAt: "2026-07-15",
    products: [
      {
        id: "more-rewards-amex",
        displayName: "Navy Federal More Rewards American Express® Card",
        productType: "personal_credit_card",
        applicationUrl:
          "https://www.navyfederal.org/loans-cards/credit-cards/more-rewards-amex-card.html",
        existingCustomerUrl: "https://www.navyfederal.org/",
        inBranchApplicationRecommended: true,
        typicalApprovalRange: [3000, 15000],
        minFICO: 670,
        idealFICO: 710,
        denialReasons: [
          "membership under 30 days",
          "no direct deposit relationship",
          "thin file",
        ],
        reconsiderationSuccessRate: 0.35,
        structuringAdvice:
          "Establish membership & direct deposit at least 1 pay cycle before applying.",
        cegProductLift: {
          tradelines: "+30 points for thin-file applicants",
          creditRepair: "+25 points if late payments present",
          incomeCoaching: "+$2,000-$5,000 approval lift",
        },
        annualFee: 0,
        lastVerifiedAt: "2026-07-15",
      },
      {
        id: "cash-rewards",
        displayName: "Navy Federal cashRewards Credit Card",
        productType: "personal_credit_card",
        applicationUrl:
          "https://www.navyfederal.org/loans-cards/credit-cards/cash-rewards-credit-card.html",
        existingCustomerUrl: "https://www.navyfederal.org/",
        inBranchApplicationRecommended: true,
        typicalApprovalRange: [3000, 15000],
        minFICO: 660,
        idealFICO: 700,
        denialReasons: [
          "membership under 30 days",
          "no direct deposit relationship",
          "thin file",
        ],
        reconsiderationSuccessRate: 0.35,
        structuringAdvice: "Starter card for newer Navy Federal members.",
        cegProductLift: {
          tradelines: "+30 points for thin-file applicants",
          creditRepair: "+25 points if late payments present",
          incomeCoaching: "+$2,000-$5,000 approval lift",
        },
        annualFee: 0,
        lastVerifiedAt: "2026-07-15",
      },
    ],
  },
  {
    id: "pnc",
    displayName: "PNC Bank",
    type: "bank",
    primaryBureau: "equifax",
    secondaryBureau: null,
    dualPullNotes: "PNC pulls Equifax for business credit cards.",
    bureauPullNotes: "Equifax pull with heavy branch relationship weighting.",
    doubleDipFriendly: false,
    doubleDipRules: "No documented double-dip pattern.",
    bankingRelationshipRequirements: {
      ddaRequired: false,
      minRelationshipMonths: 0,
      membershipRequired: false,
      notes:
        "PNC business checking relationship significantly improves approval odds.",
    },
    reconsiderationPhone: "1-800-762-5684",
    reconsiderationHours: "Mon-Fri business hours ET",
    reconsiderationTips: "Direct client to local branch banker first.",
    generalCustomerService: "1-877-287-2654",
    productPageBaseUrl:
      "https://www.pnc.com/en/small-business/banking/credit-cards.html",
    commonDenialReasons: [
      "no existing PNC banking relationship",
      "thin file",
      "insufficient business revenue",
    ],
    placesSearchQuery: "PNC Bank branch",
    lastVerifiedAt: "2026-07-15",
    products: [
      {
        id: "cash-rewards-visa-business",
        displayName: "PNC Cash Rewards® Visa Signature® Business Credit Card",
        productType: "business_credit_card",
        applicationUrl:
          "https://www.pnc.com/en/small-business/banking/credit-cards/cash-rewards-visa-business-credit-card.html",
        existingCustomerUrl: "https://www.pnc.com/en/small-business/",
        inBranchApplicationRecommended: true,
        typicalApprovalRange: [3000, 25000],
        minFICO: 680,
        idealFICO: 720,
        denialReasons: [
          "no existing PNC DDA relationship",
          "thin file",
          "insufficient business revenue",
        ],
        reconsiderationSuccessRate: 0.3,
        structuringAdvice:
          "Open PNC business checking and apply in-branch rather than online.",
        cegProductLift: {
          tradelines: "+35 points for thin-file applicants",
          creditRepair: "+25 points if late payments present",
          incomeCoaching: "+$2,000-$6,000 approval lift",
          businessFormation:
            "Formed LLC/EIN with matching PNC checking account improves approval odds.",
        },
        annualFee: 0,
        lastVerifiedAt: "2026-07-15",
      },
    ],
  },
  {
    id: "us-bank",
    displayName: "U.S. Bank",
    type: "bank",
    primaryBureau: "equifax",
    secondaryBureau: null,
    dualPullNotes: "Consistently pulls Equifax.",
    bureauPullNotes: "Equifax pull; DDA required in specific western states.",
    doubleDipFriendly: false,
    doubleDipRules: "No documented double-dip pattern.",
    bankingRelationshipRequirements: {
      ddaRequired: true,
      ddaRequiredStates: ["CA", "OR", "WA", "NM"],
      minRelationshipMonths: 0,
      membershipRequired: false,
      notes: "Checking account (DDA) required in CA, OR, WA, NM.",
    },
    reconsiderationPhone: "1-800-947-1444",
    reconsiderationHours: "Mon-Fri 8am-5pm CT",
    reconsiderationTips:
      "If DDA was denial reason, open checking account and call back with account number.",
    generalCustomerService: "1-800-285-8585",
    productPageBaseUrl:
      "https://www.usbank.com/business-banking/business-credit-cards.html",
    commonDenialReasons: [
      "no DDA in required state",
      "time in business under 12 months",
      "thin file",
    ],
    placesSearchQuery: "U.S. Bank branch",
    lastVerifiedAt: "2026-07-15",
    products: [
      {
        id: "triple-cash-rewards-business",
        displayName: "U.S. Bank Triple Cash Rewards Visa® Business Card",
        productType: "business_credit_card",
        applicationUrl:
          "https://www.usbank.com/business-banking/business-credit-cards/triple-cash-rewards-visa-card.html",
        existingCustomerUrl: "https://www.usbank.com/business-banking/",
        inBranchApplicationRecommended: true,
        typicalApprovalRange: [3000, 20000],
        minFICO: 680,
        idealFICO: 720,
        denialReasons: [
          "no DDA in required state",
          "time in business under 12 months",
          "thin file",
        ],
        reconsiderationSuccessRate: 0.3,
        structuringAdvice:
          "Open Silver Business Checking first if in CA/OR/WA/NM.",
        cegProductLift: {
          tradelines: "+35 points for thin-file applicants",
          creditRepair: "+25 points if late payments present",
          incomeCoaching: "+$2,000-$6,000 approval lift",
          businessFormation:
            "Establishing 12+ months business age reduces denial risk.",
        },
        annualFee: 0,
        lastVerifiedAt: "2026-07-15",
      },
    ],
  },
  {
    id: "wells-fargo",
    displayName: "Wells Fargo",
    type: "bank",
    primaryBureau: "experian",
    secondaryBureau: null,
    dualPullNotes: "Wells Fargo pulls Experian for business card applications.",
    bureauPullNotes:
      "Experian pull; in-branch applications perform significantly better.",
    doubleDipFriendly: false,
    doubleDipRules: "No documented double-dip pattern.",
    bankingRelationshipRequirements: {
      ddaRequired: false,
      minRelationshipMonths: 0,
      membershipRequired: false,
      notes:
        "In-branch applications with a banker approve borderline files more consistently.",
    },
    reconsiderationPhone: "1-800-967-9521",
    reconsiderationHours: "Mon-Fri 9am-9pm ET, Sat 8am-7pm ET",
    reconsiderationTips:
      "Visit a branch in person to have a banker attach a note.",
    generalCustomerService: "1-800-869-3557",
    productPageBaseUrl: "https://www.wellsfargo.com/biz/credit-card/",
    commonDenialReasons: [
      "online application without existing relationship",
      "thin file",
      "insufficient business revenue",
    ],
    placesSearchQuery: "Wells Fargo Bank branch",
    lastVerifiedAt: "2026-07-15",
    products: [
      {
        id: "signify-business-cash",
        displayName: "Wells Fargo Signify Business Cash℠ Card",
        productType: "business_credit_card",
        applicationUrl:
          "https://www.wellsfargo.com/biz/credit-card/signify-business-cash/",
        existingCustomerUrl: "https://www.wellsfargo.com/biz/",
        inBranchApplicationRecommended: true,
        typicalApprovalRange: [3000, 25000],
        minFICO: 690,
        idealFICO: 730,
        denialReasons: [
          "online application without existing relationship",
          "thin file",
          "insufficient business revenue",
        ],
        reconsiderationSuccessRate: 0.3,
        structuringAdvice:
          "In-branch applications strongly recommended over online path.",
        cegProductLift: {
          tradelines: "+35 points for thin-file applicants",
          creditRepair: "+25 points if late payments present",
          incomeCoaching: "+$2,000-$6,000 approval lift",
          businessFormation:
            "Well-documented business applying in-branch performs meaningfully better.",
        },
        annualFee: 0,
        lastVerifiedAt: "2026-07-15",
      },
    ],
  },
];

export async function seedLenderData(): Promise<{
  totalLenders: number;
  totalProducts: number;
}> {
  const db = firestoreAdmin();
  let totalProducts = 0;

  for (const lender of LENDER_SEED_DATA) {
    const { products, ...lenderFields } = lender;
    const lenderRef = db.collection("lenders").doc(lender.id);
    await lenderRef.set(lenderFields, { merge: true });

    const batch = db.batch();
    for (const product of products) {
      const productRef = lenderRef.collection("products").doc(product.id);
      batch.set(productRef, product, { merge: true });
      totalProducts++;
    }
    await batch.commit();
  }

  return { totalLenders: LENDER_SEED_DATA.length, totalProducts };
}
