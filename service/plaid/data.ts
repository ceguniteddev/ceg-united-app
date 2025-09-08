"use server";
import { UserCreateResponse } from "plaid";
import { getAccessToken } from ".";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { USER_TOKEN_COLLECTION } from "@/constant/collection-name";
import { Timestamp } from "firebase-admin/firestore";
import { normalizeAllDates } from "@/lib/date-parser";
import { plaidClient } from "@/lib/plaid";
import { logError, logInfo } from "@/lib/logger";
import AppError from "@/error/AppError";

type PlaidCompleteRow = {
  institutionName: string | null;
  item: any | null;
  balance: any[]; // accounts
  transaction: any[]; // transactions
  identity: any[]; // accounts from identity
  liabilities: any; // liabilities object
  bank_income: any[]; // bank_income array
  payroll_income: any[]; // items array
  investmentHoldings: any[];
  investmentTransactions: any[];
};

type Label =
  | "itemGet"
  | "accountsBalanceGet"
  | "identityGet"
  | "transactionsGet"
  | "liabilitiesGet"
  | "creditBankIncomeGet"
  | "creditPayrollIncomeGet"
  | "investmentsHoldingsGet"
  | "investmentsTransactionsGet";

type LinkTokenRecord = UserCreateResponse & {
  id: string;
  createdAt: Date | null;
  userId: string;
};

export const recordPlaidUserToken = async (userId: string) => {
  logInfo("recordPlaidUserToken", { userId });
  if (!userId) {
    logInfo("User id is required");
    throw new Error("User id is required");
  }
  // check if user already has a token
  const existingToken = await getPlaidUserToken(userId);
  if (existingToken) {
    logInfo("User already has a token");
    return existingToken;
  }

  let userCreateResponse = null;
  try {
    userCreateResponse = await plaidClient.userCreate({
      client_user_id: userId,
    });
  } catch (error: any) {
    logError(error, { ...error.response?.data });
    console.error("Plaid Error:", error.response?.data);
    throw error;
  }

  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_TOKEN_COLLECTION);

  const docRef = await collectionRef.add({
    userId,
    user_id: userCreateResponse.data.user_id,
    request_id: userCreateResponse.data.request_id,
    user_token: userCreateResponse.data.user_token,
    createdAt: Timestamp.now(),
  });

  const doc = await docRef.get();
  const userTokenData = doc.data();

  return { id: doc.id, ...normalizeAllDates(userTokenData!) } as LinkTokenRecord;
};

export const getPlaidUserToken = async (userId: string) => {
  logInfo("getPlaidUserToken", { userId });
  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_TOKEN_COLLECTION).where("userId", "==", userId);

  const snapshot = await collectionRef.orderBy("createdAt", "asc").get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...normalizeAllDates(doc.data()) } as LinkTokenRecord;
};

export const getPlaidCompleteData = async (userId: string) => {
  logInfo("getPlaidCompleteData", { userId });
  const accessTokens = await getAccessToken(userId);
  if (!accessTokens?.length) {
    logInfo("No linked bank account found");
    throw new AppError("No linked bank account found");
  }

  let userTokenRecord = await getPlaidUserToken(userId);
  if (!userTokenRecord) {
    logInfo("User does not have a token");
    userTokenRecord = await recordPlaidUserToken(userId);
  }

  const now = new Date();
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(now.getFullYear() - 2); // subtract 2 years

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const completeData: PlaidCompleteRow[] = [];

  for (const token of accessTokens) {
    const configs = {
      access_token: token.accessToken,
    };

    // run independent calls in parallel; each one is safely wrapped
    const [
      itemData,
      balanceData,
      transactionsData,
      identityData,
      liabilitiesData,
      bankIncomeData,
      payrollIncomeData,
      investmentsHoldingsData,
      investmentsTransactionsData,
    ] = await Promise.all([
      safeData(token.tokenType, "itemGet", () => plaidClient.itemGet(configs)),
      safeData(token.tokenType, "accountsBalanceGet", () =>
        plaidClient.accountsBalanceGet(configs)
      ),
      safeData(token.tokenType, "transactionsGet", () =>
        plaidClient.transactionsGet({
          ...configs,
          start_date: fmt(twoYearsAgo),
          end_date: fmt(now),
        })
      ),
      safeData(token.tokenType, "identityGet", () => plaidClient.identityGet(configs)),
      safeData(token.tokenType, "liabilitiesGet", () => plaidClient.liabilitiesGet(configs)),
      safeData(token.tokenType, "creditBankIncomeGet", () =>
        plaidClient.creditBankIncomeGet({
          user_token: userTokenRecord.user_token,
          options: {
            count: 3,
          },
        })
      ),
      safeData(token.tokenType, "creditPayrollIncomeGet", () =>
        plaidClient.creditPayrollIncomeGet({
          user_token: userTokenRecord.user_token,
        })
      ),

      safeData(token.tokenType, "investmentsHoldingsGet", () =>
        plaidClient.investmentsHoldingsGet(configs)
      ),

      safeData(token.tokenType, "investmentsTransactionsGet", () =>
        plaidClient.investmentsTransactionsGet({
          ...configs,
          start_date: fmt(twoYearsAgo),
          end_date: fmt(now),
        })
      ),
    ]);

    const row: PlaidCompleteRow = {
      institutionName: itemData?.item?.institution_name ?? null,
      item: itemData?.item ?? null,
      balance: balanceData?.accounts ?? [],
      transaction: transactionsData?.transactions ?? [],
      identity: identityData?.accounts ?? [],
      liabilities: liabilitiesData?.liabilities ?? {},
      bank_income: bankIncomeData?.bank_income ?? [],
      payroll_income: payrollIncomeData?.items ?? [],
      investmentHoldings: investmentsHoldingsData?.holdings ?? [],
      investmentTransactions: investmentsTransactionsData?.investment_transactions ?? [],
    };

    completeData.push(row);
  }

  return completeData;
};

async function safeData<T>(
  tokenType: TokenType,
  label: Label,
  call: () => Promise<{ data: T }>
): Promise<T | null> {
  logInfo(`[Plaid] ${label} token-type ${tokenType}`);

  const skipLabels: Label[] = [
    "transactionsGet",
    "liabilitiesGet",
    "accountsBalanceGet",
    "investmentsHoldingsGet",
    "investmentsTransactionsGet",
    "identityGet",
  ];

  if (
    (tokenType === "INCOME_VERIFICATION_BANK" || tokenType === "INCOME_VERIFICATION_PAYROLL") &&
    skipLabels.includes(label)
  ) {
    logInfo(`[Plaid] Skipping ${label} for token-type ${tokenType}`);
    return null;
  }

  try {
    const res = await call();
    return res.data;
  } catch (err: any) {
    logError(err, { ...err.response?.data });
    console.error(`[Plaid] ${label} failed token-type ${tokenType}`, err.response?.data);
    return null;
  }
}
