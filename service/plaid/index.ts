"use server";
import { LINK_TOKEN_COLLECTION, PLAID_TOKEN_COLLECTION } from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { DataItem } from "@/lib/plaid/data-util";
import { Timestamp } from "firebase-admin/firestore";
import {
  Configuration,
  CountryCode,
  LinkTokenCreateResponse,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from "plaid";

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;

const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || "US").split(",") as CountryCode[];

const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || Products.Transactions).split(
  ","
) as Products[];

const PLAID_ENV = process.env.PLAID_ENV || "sandbox";

const PLAID_REDIRECT_URI = process.env.PLAID_REDIRECT_URI || "";

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

export const getPlaidLinkToken = async (userId: string) => {
  const configs = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: userId,
    },
    client_name: "CEG United LLC",
    products: PLAID_PRODUCTS,
    country_codes: PLAID_COUNTRY_CODES,
    language: "en",
  };

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
  const client = new PlaidApi(configuration);
  const createTokenResponse = await client.linkTokenCreate(configs);
  return createTokenResponse.data;
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
  const client = new PlaidApi(configuration);
  const tokenResponse = await client.itemPublicTokenExchange({
    public_token: publicToken,
  });

  const ACCESS_TOKEN = tokenResponse.data.access_token;
  const ITEM_ID = tokenResponse.data.item_id;

  return { accessToken: ACCESS_TOKEN, itemId: ITEM_ID };
};

export const recordAccessToken = async (userId: string, accessToken: string, itemId: string) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(PLAID_TOKEN_COLLECTION);

  await collectionRef.add({
    userId,
    accessToken,
    itemId,
    createdAt: Timestamp.now(),
  });
};

export const getAccessToken = async (
  userId: string,
  itemId?: string
): Promise<PlaidAccessToken[] | null> => {
  const db = firestoreAdmin();
  let collectionRef = db.collection(PLAID_TOKEN_COLLECTION).where("userId", "==", userId);

  if (itemId) {
    collectionRef = collectionRef.where("itemId", "==", itemId);
  }

  const snapshot = await collectionRef.orderBy("createdAt", "asc").get();

  if (snapshot.empty) return null;

  return snapshot.docs.map((doc) => ({ id: doc.id, ...normalizeAllDates(doc.data()) }));
};

export const deleteAccessToken = async (accessTokenId: string) => {
  const db = firestoreAdmin();
  await db.collection(PLAID_TOKEN_COLLECTION).doc(accessTokenId).delete();
};

export const getPlaidItems = async (userId: string) => {
  const accessToken = await getAccessToken(userId);
  if (!accessToken) return null;

  const client = new PlaidApi(configuration);

  const items = [];

  for (const token of accessToken) {
    const itemsResponse = await client.itemGet({
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
  const client = new PlaidApi(configuration);
  const accountsResponse = await client.accountsGet({
    client_id: PLAID_CLIENT_ID,
    secret: PLAID_SECRET,
    access_token: accessToken,
  });
  return accountsResponse.data;
};
