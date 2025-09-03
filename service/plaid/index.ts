"use server";
import { LINK_TOKEN_COLLECTION, PLAID_TOKEN_COLLECTION } from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin, storageAdmin } from "@/lib/fireabase-admin";
import { Timestamp } from "firebase-admin/firestore";
import {
  AccountBase,
  AccountsGetRequest,
  AccountsGetResponse,
  Configuration,
  CountryCode,
  Institution,
  LinkTokenCreateResponse,
  PlaidApi,
  PlaidEnvironments,
  PlaidError,
  Products,
} from "plaid";
import { getBaseUrl } from "..";
import { plaidClient } from "@/lib/plaid";
import { parseStringify } from "@/lib/utils";
import { deleteAssetReportRequest, getAssetReportRequestByUserId } from "./asset";

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;

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

// const PLAID_ENV = process.env.PLAID_ENV || "sandbox";

const PLAID_REDIRECT_URI = process.env.PLAID_REDIRECT_URI || "";

// const configuration = new Configuration({
//   basePath: PlaidEnvironments[PLAID_ENV],
//   baseOptions: {
//     headers: {
//       "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
//       "PLAID-SECRET": process.env.PLAID_SECRET,
//     },
//   },
// });

// export const getPlaidClient = async () => {
//   return new PlaidApi(configuration);
// };

export const getPlaidLinkToken = async (userId: string, userToken?: string) => {
  const webhookBaseUrl = await getBaseUrl();
  let configs = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: userId,
    },
    user_token: "",
    client_name: "CEG United LLC",
    products: PLAID_PRODUCTS,
    required_if_supported_products: REQUIRED_IF_SUPPORTED,
    optional_products: OPTIONAL_PLAID_PRODUCTS,
    country_codes: PLAID_COUNTRY_CODES,
    language: "en",
    webhook: webhookBaseUrl + "/api/plaid/webhook",
  };

  if (userToken) {
    configs = {
      ...configs,
      user_token: userToken,
      required_if_supported_products: [],
      optional_products: [],
      products: [Products.IncomeVerification],
    };
  }

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
    return linkTokenResponse.data;
  } catch (e: any) {
    console.error("Plaid Error:", e.response?.data);
    return null;
  }
};

export const unlinkPlaidItem = async (userId: string, bankItemIds: string[]) => {
  for (const bankItemId of bankItemIds) {
    const bankRecord = await getAccessToken(userId, "ITEM", bankItemId);

    if (!bankRecord) return;

    const assetData = await getAssetReportRequestByUserId(userId, bankItemId);

    if (assetData) {
      for (const data of assetData) {
        await plaidClient.assetReportRemove({ asset_report_token: data.assetReportToken });
        await deleteAssetReportRequest(data.id ?? "");
      }
    }

    await plaidClient.itemRemove({ access_token: bankRecord[0].accessToken });

    await deleteAccessToken(bankRecord[0].id ?? "");

    // remove the storage file for the asset report pdfs
    const storage = storageAdmin();
    const bucketFile = storage.file(`documents/${userId}/asset-report-${bankItemId}.pdf`);
    await bucketFile.delete();
  }
};

export const recordLinkToken = async (linkToken: LinkTokenCreateResponse, userId: string) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(LINK_TOKEN_COLLECTION);

  const expiresAt = Timestamp.fromDate(new Date(linkToken.expiration));

  await collectionRef.add({
    userId,
    linkToken: linkToken.link_token,
    requestId: linkToken.request_id,
    expiresAt,
    createdAt: Timestamp.now(),
  });
};

export const getValidLinkToken = async (userId: string) => {
  const db = firestoreAdmin();
  const now = Timestamp.now();

  const snapshot = await db
    .collection(LINK_TOKEN_COLLECTION)
    .where("userId", "==", userId)
    .where("expiresAt", ">", now)
    .orderBy("expiresAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...normalizeAllDates(doc.data()) };
};

export const exchangeAccessToken = async (publicToken: string) => {
  const tokenResponse = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });

  const ACCESS_TOKEN = tokenResponse.data.access_token;
  const ITEM_ID = tokenResponse.data.item_id;

  return { accessToken: ACCESS_TOKEN, itemId: ITEM_ID };
};

export const recordAccessToken = async (
  userId: string,
  accessToken: string,
  itemId: string,
  tokenType: TokenType
) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(PLAID_TOKEN_COLLECTION);

  await collectionRef.add({
    userId,
    accessToken,
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

  return snapshot.docs.map((doc) => ({ id: doc.id, ...normalizeAllDates(doc.data()) }));
};

export async function hasAccessToken(
  userId: string,
  tokenType?: TokenType,
  itemId?: string
): Promise<boolean> {
  const db = firestoreAdmin();

  let q = db.collection(PLAID_TOKEN_COLLECTION).where("userId", "==", userId);
  if (tokenType) q = q.where("tokenType", "==", tokenType);
  if (itemId) q = q.where("itemId", "==", itemId);

  const countSnap = await q.count().get();
  return countSnap.data().count > 0;
}

export const deleteAccessToken = async (accessTokenId: string) => {
  const db = firestoreAdmin();
  await db.collection(PLAID_TOKEN_COLLECTION).doc(accessTokenId).delete();
};

export const getPlaidItems = async (userId: string) => {
  const accessToken = await getAccessToken(userId, "ITEM");
  if (!accessToken) return null;

  const items = [];

  for (const token of accessToken) {
    const itemsResponse = await plaidClient.itemGet({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      access_token: token.accessToken,
    });

    const data = { ...itemsResponse.data, accessToken: token.accessToken };

    items.push(data);
  }

  return items;
};

export const getPlaidItemAccounts = async (accessToken: string) => {
  if (!accessToken) return null;

  const accountsResponse = await plaidClient.accountsGet({
    client_id: PLAID_CLIENT_ID,
    secret: PLAID_SECRET,
    access_token: accessToken,
  });
  return accountsResponse.data;
};

// export const getPlaidAccounts = async (userId: string) => {
//   const accessToken = await getAccessToken(userId, "ITEM");
//   if (!accessToken) return null;

//   const accounts = (
//     await Promise.all(
//       (accessToken ?? []).map(async (bank: PlaidAccessToken) => {
//         // Get all accounts for this item
//         const { accounts: accountData, item } = (
//           await plaidClient.accountsGet({ access_token: bank.accessToken })
//         ).data;

//         // Institution is per item, reuse for all accounts in this item
//         const institution = item.institution_id
//           ? await getInstitution({ institutionId: item.institution_id })
//           : null;

//         // Map each Plaid account -> your shape
//         return accountData.map((a) => ({
//           id: a.account_id,
//           availableBalance: a.balances.available ?? null,
//           currentBalance: a.balances.current ?? null,
//           institutionId: institution?.institution_id ?? null,
//           institutionName: institution?.name ?? null,
//           name: a.name,
//           officialName: a.official_name ?? null,
//           mask: a.mask ?? "",
//           type: String(a.type),
//           subtype: String(a.subtype),
//           bankItemId: bank.itemId,
//         }));
//       })
//     )
//   ).flat();

//   const totalBanks = accounts.length;
//   const totalCurrentBalance = accounts.reduce((sum, { currentBalance }) => {
//     const n = Number(currentBalance ?? 0);
//     return sum + (Number.isFinite(n) ? n : 0);
//   }, 0);
//   return parseStringify({ data: accounts, totalBanks, totalCurrentBalance });
// };

export const getPlaidAccounts = async (userId: string) => {
  const accessToken = await getAccessToken(userId, "ITEM");
  if (!accessToken) return null;

  const accounts: Account[] = (
    await Promise.all(
      (accessToken ?? []).map(async (bank: PlaidAccessToken) => {
        const { accounts: accountData, item } = (
          await plaidClient.accountsGet({ access_token: bank.accessToken })
        ).data;

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
  const institutionResponse = await plaidClient.institutionsGetById({
    institution_id: institutionId,
    country_codes: ["US"] as CountryCode[],
  });

  const intitution = institutionResponse.data.institution;

  return parseStringify(intitution) as Institution;
};

export const getPlaidAccountByUserIdAndItemId = async ({
  userId,
  itemId,
  accountId,
}: getAccountProps) => {
  if (!userId) throw new Error("User id is required");
  if (!itemId) throw new Error("Item id is required");
  if (!accountId) throw new Error("Account id is required");

  // get bank (Plaid item) from db
  const bank = await getAccessToken(userId, "ITEM", itemId);
  if (!bank?.length) return null;

  let response = null;
  try {
    response = await plaidClient.accountsGet({
      access_token: bank[0].accessToken,
      options: { account_ids: [accountId] },
    });
  } catch (err: any) {
    console.error("Plaid Error:", err.response?.data);
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

// export const getTransactionsByBankId = async ({ bankId }: getTransactionsByBankIdProps) => {
//   try {
//     const { database } = await createAdminClient();

//     const senderTransactions = await database.listDocuments(
//       DATABASE_ID!,
//       TRANSACTION_COLLECTION_ID!,
//       [Query.equal("senderBankId", bankId)]
//     );

//     const receiverTransactions = await database.listDocuments(
//       DATABASE_ID!,
//       TRANSACTION_COLLECTION_ID!,
//       [Query.equal("receiverBankId", bankId)]
//     );

//     const transactions = {
//       total: senderTransactions.total + receiverTransactions.total,
//       documents: [...senderTransactions.documents, ...receiverTransactions.documents],
//     };

//     return parseStringify(transactions);
//   } catch (error) {
//     console.log(error);
//   }
// };

export const getTransactions = async ({ accessToken }: getTransactionsProps) => {
  let hasMore = true;
  let transactions: any = [];

  // Iterate through each page of new transaction updates for item
  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
    });

    const data = response.data;

    transactions = response.data.added.map((transaction) => ({
      id: transaction.transaction_id,
      name: transaction.name,
      paymentChannel: transaction.payment_channel,
      type: transaction.payment_channel,
      accountId: transaction.account_id,
      amount: transaction.amount,
      pending: transaction.pending,
      category: transaction.category ? transaction.category[0] : "",
      date: transaction.date,
      image: transaction.logo_url,
    }));

    hasMore = data.has_more;
  }

  return parseStringify(transactions);
};
