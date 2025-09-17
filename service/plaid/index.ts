"use server";
import { PLAID_TOKEN_COLLECTION } from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin, storageAdmin } from "@/lib/fireabase-admin";
import { Timestamp } from "firebase-admin/firestore";
import {
  AccountBase,
  CountryCode,
  IncomeVerificationPayrollFlowType,
  IncomeVerificationSourceType,
  Institution,
  Item,
  LinkTokenCreateRequest,
  Products,
} from "plaid";
import { getAppPlaidWebhookURL } from "..";
import { plaidClient } from "@/lib/plaid";
import { parseStringify } from "@/lib/utils";
import {
  createAssetReport,
  deleteAssetReportRequest,
  getAssetReportRequestByUserId,
} from "./asset";
import { logError, logInfo } from "@/lib/logger";
import { decrypt, encrypt } from "@/lib/encryption";
import { removeItemLinkUpdateModeNewAccount } from "./item";
import { getPlaidUserToken, recordPlaidUserToken } from "./data";
import { generateCRSReport } from "../crs";

const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || "US").split(",") as CountryCode[];

const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || Products.Transactions).split(
  ","
) as Products[];

const OPTIONAL_PLAID_PRODUCTS = (process.env.OPTIONAL_PLAID_PRODUCTS || "")
  .split(",")
  .filter((p) => p.trim() !== "") as Products[];

const REQUIRED_IF_SUPPORTED = (process.env.REQUIRED_IF_SUPPORTED || "")
  .split(",")
  .filter((p) => p.trim() !== "") as Products[];

const ADDITIONAL_CONSENTED_PRODUCTS = (process.env.ADDITIONAL_CONSENTED_PRODUCTS || "")
  .split(",")
  .filter((p) => p.trim() !== "") as Products[];

const PLAID_REDIRECT_URI = process.env.PLAID_REDIRECT_URI || "";

export const getPlaidLinkToken = async ({
  userId,
  incomeSourceType,
  itemId,
  isNewAccount,
}: PlaidLinkTokenCreateRequest) => {
  if (!userId) throw new Error("User id is required");

  let userToken = null;
  if (
    incomeSourceType === IncomeVerificationSourceType.Bank ||
    incomeSourceType === IncomeVerificationSourceType.Payroll
  ) {
    await recordPlaidUserToken(userId);
    userToken = await getPlaidUserToken(userId);
  }
  const webhookBaseUrl = await getAppPlaidWebhookURL();

  // get accessToken from this itemId because this is update_mode
  let accessToken = null;
  if (itemId) {
    const plaidAccessToken = await getAccessToken(userId, "ITEM", itemId);
    if (plaidAccessToken) {
      accessToken = plaidAccessToken[0].accessToken;
    }
  }

  const clientName = "CEG United LLC";

  logInfo("getPlaidLinkToken::entry data", { userId, userToken, incomeSourceType });
  let configs: LinkTokenCreateRequest = {
    user: {
      client_user_id: userId,
    },

    client_name: clientName,
    products: PLAID_PRODUCTS,
    required_if_supported_products: REQUIRED_IF_SUPPORTED,
    optional_products: OPTIONAL_PLAID_PRODUCTS,
    additional_consented_products: ADDITIONAL_CONSENTED_PRODUCTS,
    country_codes: PLAID_COUNTRY_CODES,
    language: "en",
    webhook: webhookBaseUrl,
    redirect_uri: PLAID_REDIRECT_URI,
  };

  if (accessToken && itemId) {
    logInfo("getPlaidLinkToken::accessToken::update_mode");
    configs = {
      user: {
        client_user_id: userId,
      },
      client_name: clientName,
      country_codes: PLAID_COUNTRY_CODES,
      language: "en",
      access_token: accessToken,
    };

    if (isNewAccount) {
      configs.update = {
        account_selection_enabled: true,
      };
    }
  }
  logInfo("getPlaidLinkToken::webhookBaseUrl", { webhookBaseUrl });
  if (userToken && incomeSourceType) {
    configs = {
      ...configs,
      user_token: userToken.user_token,
      required_if_supported_products: [],
      optional_products: [],
      products: [Products.IncomeVerification],
      additional_consented_products: [],
    };

    if (incomeSourceType === IncomeVerificationSourceType.Bank) {
      configs.income_verification = {
        income_source_types: [IncomeVerificationSourceType.Bank],
        bank_income: { days_requested: 365 },
      };
    } else if (incomeSourceType === IncomeVerificationSourceType.Payroll) {
      configs.income_verification = {
        income_source_types: [IncomeVerificationSourceType.Payroll],
        payroll_income: {
          flow_types: [
            IncomeVerificationPayrollFlowType.DigitalIncome,
            IncomeVerificationPayrollFlowType.DocumentIncome,
          ],
        },
      };
    }
  }
  console.log("configs", configs);

  // if (PLAID_REDIRECT_URI !== "") {
  //   configs.redirect_uri = PLAID_REDIRECT_URI;
  // }

  // if (PLAID_PRODUCTS.includes(Products.Statements)) {
  //   const statementConfig = {
  //     end_date: moment().format("YYYY-MM-DD"),
  //     start_date: moment().subtract(30, "days").format("YYYY-MM-DD"),
  //   };
  //   configs.statements = statementConfig;
  // }

  // if (PLAID_PRODUCTS.some((product) => product.startsWith("cra_"))) {
  //   configs.user_token = USER_TOKEN;
  //   configs.cra_options = {
  //     days_requested: 60,
  //   };
  //   configs.consumer_report_permissible_purpose = "ACCOUNT_REVIEW_CREDIT";
  // }

  try {
    const linkTokenResponse = await plaidClient.linkTokenCreate(configs);
    logInfo("getPlaidLinkToken::linkTokenResponse.data", { data: linkTokenResponse.data });
    return linkTokenResponse.data;
  } catch (e: any) {
    console.error("getPlaidLinkToken::Plaid Error :", e.response?.data);
    return null;
  }
};

export const unlinkPlaidItem = async (userId: string, bankItemIds: string[]) => {
  if (!userId) throw new Error("User id is required");
  if (!bankItemIds || !bankItemIds.length) throw new Error("Bank item ids is required");

  logInfo("unlinkPlaidItem", { userId, bankItemIds });
  for (const bankItemId of bankItemIds) {
    logInfo("unlinkPlaidItem:: start process", { itemId: bankItemId });
    const bankRecord = await getAccessToken(userId, "ITEM", bankItemId);

    if (!bankRecord) return;

    const assetData = await getAssetReportRequestByUserId(userId, bankItemId);

    if (assetData) {
      for (const data of assetData) {
        logInfo("unlinkPlaidItem - assetReportRemove", {
          userId: data.userId,
          assetReportId: data.assetReportId,
          itemId: data.itemId,
        });
        await plaidClient.assetReportRemove({ asset_report_token: data.assetReportToken });
        await deleteAssetReportRequest(data.id ?? "");
      }
    }

    await plaidClient.itemRemove({ access_token: bankRecord[0].accessToken });

    await deleteAccessToken(bankRecord[0].id ?? "");

    // remove the storage file for the asset report pdfs
    try {
      const storage = storageAdmin();
      const bucketFile = storage.file(`documents/${userId}/asset-report-${bankItemId}.pdf`);
      await bucketFile.delete();
    } catch (error: any) {
      console.error("unlinkPlaidItem::error", error);
      logError(error, { userId, bankItemId });
    }
  }
};

export const exchangeAccessToken = async (
  publicToken: string,
  userId: string,
  tokenType: TokenType,
  itemId?: string,
  isNewAccount?: boolean
) => {
  if (!userId) throw new Error("User id is required");
  if (!publicToken) throw new Error("Public token is required");

  logInfo("exchangeAccessToken", { publicToken });
  const tokenResponse = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });

  const ACCESS_TOKEN = tokenResponse.data.access_token;
  const ITEM_ID = tokenResponse.data.item_id;
  logInfo("exchangeAccessToken::ITEM_ID", { ITEM_ID });

  if (!itemId) {
    console.log("exchangeAccessToken::recordAccessToken");
    await recordAccessToken(userId, ACCESS_TOKEN, ITEM_ID, tokenType);
  }
  // create asset report once per item
  if (tokenType === "ITEM" && !itemId) {
    console.log("exchangeAccessToken::createAssetReport");
    await createAssetReport(userId, ITEM_ID);
  }

  if (isNewAccount && itemId) {
    await removeItemLinkUpdateModeNewAccount(itemId);
  }

  if (tokenType === "ITEM") {
    await generateCRSReport(userId);
  }
};

export const recordAccessToken = async (
  userId: string,
  accessToken: string,
  itemId: string,
  tokenType: TokenType
) => {
  logInfo("recordAccessToken", { userId, itemId, tokenType });
  const db = firestoreAdmin();
  const collectionRef = db.collection(PLAID_TOKEN_COLLECTION);

  const encrypted = encrypt(accessToken);

  await collectionRef.add({
    userId,
    iv: encrypted.iv,
    accessToken: encrypted.content,
    itemId,
    tokenType,
    createdAt: Timestamp.now(),
  });
};

export const getAccessToken = async (
  userId: string,
  tokenType?: TokenType,
  itemId?: string
): Promise<PlaidAccessToken[] | null> => {
  logInfo("getAccessToken", { userId, tokenType, itemId });
  const db = firestoreAdmin();

  let collectionRef = db.collection(PLAID_TOKEN_COLLECTION).where("userId", "==", userId);

  if (tokenType) {
    collectionRef = collectionRef.where("tokenType", "==", tokenType);
  }
  if (itemId) {
    collectionRef = collectionRef.where("itemId", "==", itemId);
  }

  const snapshot = await collectionRef.orderBy("createdAt", "asc").get();
  if (snapshot.empty) return null;

  return snapshot.docs.map((doc) => {
    const data = normalizeAllDates(doc.data());

    // 👇 decrypt the accessToken field before returning
    let decryptedToken: string | null = null;
    if (data.accessToken && data.iv) {
      try {
        decryptedToken = decrypt({
          iv: data.iv,
          content: data.accessToken,
        });
      } catch (err: any) {
        console.error("Failed to decrypt Plaid access token:", err);
        logError(err, { userId, tokenType, itemId });
      }
    }

    return {
      id: doc.id,
      ...data,
      accessToken: decryptedToken,
    };
  });
};

export async function hasAccessToken(
  userId: string,
  tokenType?: TokenType,
  itemId?: string
): Promise<boolean> {
  const db = firestoreAdmin();
  logInfo("hasAccessToken", { userId, tokenType, itemId });

  let q = db.collection(PLAID_TOKEN_COLLECTION).where("userId", "==", userId);
  if (tokenType) q = q.where("tokenType", "==", tokenType);
  if (itemId) q = q.where("itemId", "==", itemId);

  const countSnap = await q.count().get();
  return countSnap.data().count > 0;
}

export const deleteAccessToken = async (docId: string) => {
  logInfo("deleteAccessToken", { docId });
  const db = firestoreAdmin();
  await db.collection(PLAID_TOKEN_COLLECTION).doc(docId).delete();
};

export const getPlaidAccounts = async (userId: string) => {
  logInfo("getPlaidAccounts", { userId });
  const accessToken = await getAccessToken(userId, "ITEM");
  if (!accessToken) return null;

  const accounts: Account[] = (
    await Promise.all(
      (accessToken ?? []).map(async (bank: PlaidAccessToken) => {
        logInfo("accountsGet", { itemId: bank.itemId });
        const { accounts: accountData, item } = (
          await plaidClient.accountsGet({ access_token: bank.accessToken })
        ).data;
        logInfo("accountsGet", { accountData: accountData.length });

        const institution = item.institution_id
          ? await getInstitution({ institutionId: item.institution_id })
          : null;

        return accountData.map((a) => ({
          id: a.account_id,
          availableBalance: a.balances.available,
          currentBalance: a.balances.current,
          institutionId: institution?.institution_id,
          institutionName: institution?.name,
          name: a.name,
          officialName: a.official_name,
          mask: a.mask ?? "",
          type: String(a.type),
          subtype: String(a.subtype),
          bankItemId: bank.itemId,
        }));
      })
    )
  ).flat();

  // ---- group per institution ----
  const groupsMap = new Map<string, InstitutionGroup>();

  for (const acct of accounts) {
    // Use institutionId if present; otherwise fall back to the item (still one institution)
    const key = acct.institutionId ?? `item:${acct.bankItemId}`;
    let g = groupsMap.get(key);
    if (!g) {
      g = {
        institutionId: acct.institutionId,
        institutionName: acct.institutionName,
        bankItemIds: [acct.bankItemId],
        accounts: [],
        totalCurrentBalance: 0,
        totalAvailableBalance: 0,
      };
      groupsMap.set(key, g);
    } else if (!g.bankItemIds.includes(acct.bankItemId)) {
      g.bankItemIds.push(acct.bankItemId);
    }

    g.accounts.push(acct);
    g.totalCurrentBalance += Number.isFinite(Number(acct.currentBalance))
      ? Number(acct.currentBalance)
      : 0;
    g.totalAvailableBalance += Number.isFinite(Number(acct.availableBalance))
      ? Number(acct.availableBalance)
      : 0;
  }

  const groups = Array.from(groupsMap.values());

  // overall totals
  const totalAccounts = accounts.length;
  const totalInstitutions = groups.length;
  const totalCurrentBalance = groups.reduce((s, g) => s + g.totalCurrentBalance, 0);
  const totalAvailableBalance = groups.reduce((s, g) => s + g.totalAvailableBalance, 0);

  return parseStringify({
    data: accounts, // flat list (unchanged)
    groups, // NEW: grouped per institution with totals
    totalAccounts,
    totalInstitutions,
    totalCurrentBalance,
    totalAvailableBalance,
  });
};

export const getInstitution = async ({ institutionId }: getInstitutionProps) => {
  logInfo("getInstitution", { institutionId });
  const institutionResponse = await plaidClient.institutionsGetById({
    institution_id: institutionId,
    country_codes: ["US"] as CountryCode[],
  });

  const intitution = institutionResponse.data.institution;
  logInfo("getInstitution", { intitution });
  return parseStringify(intitution) as Institution;
};

export const getItem = async ({ accessToken }: { accessToken: string }) => {
  logInfo("getItem");
  const itemResponse = await plaidClient.itemGet({ access_token: accessToken });
  const item = itemResponse.data.item;

  logInfo("getItem", { item: itemResponse.data.item.item_id });
  return parseStringify(item) as Item;
};

export const getPlaidAccountByUserIdAndItemId = async ({
  userId,
  itemId,
  accountId,
}: getAccountProps) => {
  if (!userId) throw new Error("User id is required");
  if (!itemId) throw new Error("Item id is required");
  if (!accountId) throw new Error("Account id is required");

  logInfo("getPlaidAccountByUserIdAndItemId", { userId, itemId, accountId });

  // get bank (Plaid item) from db
  const bank = await getAccessToken(userId, "ITEM", itemId);
  if (!bank?.length) return null;

  let response = null;
  try {
    response = await plaidClient.accountsGet({
      access_token: bank[0].accessToken,
      options: { account_ids: [accountId] },
    });
    logInfo("getPlaidAccountByUserIdAndItemId", { requestId: response.data.request_id });
  } catch (err: any) {
    console.error("Plaid Error:", err.response?.data);
    logError(err, { userId, itemId, accountId });
    throw err;
  }

  const { accounts: plaidAccounts, item } = response.data;

  // fetch institution (once per item)
  const institution = item?.institution_id
    ? await getInstitution({ institutionId: item.institution_id })
    : null;

  // map Plaid accounts -> your shape
  const accounts = plaidAccounts.map((a: AccountBase) => ({
    id: a.account_id,
    availableBalance: a.balances.available ?? null,
    currentBalance: a.balances.current ?? null,
    institutionId: institution?.institution_id ?? null,
    name: a.name,
    officialName: a.official_name ?? null,
    mask: a.mask ?? "",
    type: String(a.type),
    subtype: String(a.subtype),
    bankItemId: bank[0].itemId,
  }));

  // fetch transactions for the item (all accounts unless your helper filters)
  const transactions = await getTransactions({
    accessToken: bank[0].accessToken,
    accountId,
  });

  // most recent first
  const allTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return parseStringify({
    data: accounts, // <-- now an array
    transactions: allTransactions,
  });
};

export const getTransactions = async ({ accessToken, accountId }: getTransactionsProps) => {
  let hasMore = true;
  let transactions: CEGTransactionSyncResponse[] = [];

  // Iterate through each page of new transaction updates for item
  let cursor = "";
  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: cursor,
      count: 500,
    });
    logInfo("getTransactions::transactionsSync", {
      requestId: response.data.request_id,
      cursor,
    });

    const data = response.data;

    transactions = response.data.added.map((transaction) => ({
      id: transaction.transaction_id,
      name: transaction.merchant_name ?? removeSpecialCharacters(transaction.name),
      paymentChannel: transaction.payment_channel,
      type: transaction.payment_channel,
      accountId: transaction.account_id,
      amount: transaction.amount,
      pending: transaction.pending,
      date: transaction.date,
      image: transaction.logo_url,
    }));

    hasMore = data.has_more;
    cursor = data.next_cursor;
  }
  if (accountId) transactions = transactions.filter((t) => t.accountId === accountId);

  return parseStringify(transactions) as CEGTransactionSyncResponse[];
};
const removeSpecialCharacters = (value: string) => {
  return value.replace(/[^\w\s]/gi, "");
};
