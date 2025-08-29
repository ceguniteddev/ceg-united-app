"use server";
import { Configuration, PlaidApi, PlaidEnvironments, UserCreateResponse } from "plaid";
import { getAccessToken, getPlaidClient } from ".";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { LINK_TOKEN_COLLECTION, USER_TOKEN_COLLECTION } from "@/constant/collection-name";
import { Timestamp } from "firebase-admin/firestore";
import { normalizeAllDates } from "@/lib/date-parser";

type PlaidCompleteRow = {
  institutionName: string | null;
  item: any | null;
  balance: any[]; // accounts
  transaction: any[]; // transactions
  identity: any[]; // accounts from identity
  liabilities: any; // liabilities object
  bank_income: any[]; // bank_income array
  payroll_income: any[]; // items array
};

async function safeData<T>(label: string, call: () => Promise<{ data: T }>): Promise<T | null> {
  try {
    const res = await call();
    return res.data;
  } catch (err) {
    console.error(`[Plaid] ${label} failed`, err);
    return null;
  }
}

type LinkTokenRecord = UserCreateResponse & {
  id: string;
  createdAt: Date | null;
  userId: string;
};

export const recordPlaidUserToken = async (userId: string) => {
  const client = await getPlaidClient();

  const userCreateResponse = await client.userCreate({
    client_user_id: userId,
  });

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
  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_TOKEN_COLLECTION).where("userId", "==", userId);

  const snapshot = await collectionRef.orderBy("createdAt", "asc").get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...normalizeAllDates(doc.data()) } as LinkTokenRecord;
};

export const getPlaidCompleteData = async (userId: string) => {
  const accessTokens = await getAccessToken(userId);
  if (!accessTokens?.length) return null;

  const client = await getPlaidClient();

  let userTokenRecord = await getPlaidUserToken(userId);
  if (!userTokenRecord) {
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
    ] = await Promise.all([
      safeData("itemGet", () => client.itemGet(configs)),
      safeData("accountsBalanceGet", () => client.accountsBalanceGet(configs)),
      safeData("transactionsGet", () =>
        client.transactionsGet({
          ...configs,
          start_date: fmt(twoYearsAgo),
          end_date: fmt(now),
        })
      ),
      safeData("identityGet", () => client.identityGet(configs)),
      safeData("liabilitiesGet", () => client.liabilitiesGet(configs)),
      safeData("creditBankIncomeGet", () =>
        client.creditBankIncomeGet({
          user_token: userTokenRecord.user_token,
        })
      ),
      safeData("creditPayrollIncomeGet", () =>
        client.creditPayrollIncomeGet({
          user_token: userTokenRecord.user_token,
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
    };

    completeData.push(row);
  }

  return completeData;
};
