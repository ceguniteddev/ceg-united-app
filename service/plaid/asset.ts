"use server";
import {
  PLAID_ASSET_REPORT_DATA,
  PLAID_ASSET_WEBHOOK_COLLECTION,
  PLAID_CREATE_ASSET_REPORT,
} from "@/constant/collection-name";
import { firestoreAdmin, storageAdmin } from "@/lib/fireabase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { getAccessToken, getPlaidClient } from ".";
import { getUserById } from "../user";
import AppError from "@/error/AppError";
import { getBaseUrl } from "..";
import { AssetReportAddOns } from "plaid";
import { normalizeAllDates } from "@/lib/date-parser";

/***
 * workflow to create asset report
 * 
 * 1. create asset report (createAssetReport) - need to provide access tokens of all linked accounts
 *    - this will record in PLAID_CREATE_ASSET_REPORT (recordAssetReportRequest)
 *        userId,
          response.data.asset_report_token,
          response.data.asset_report_id ,
          itemId

 * 2. Plaid will call webhook when the report is ready (recordWebhookData)
 *    2.1. invoke getAssetReportRequestByAssetReportId function to get asset_report_token
 *    2.2. invoke getAssetReport to get the full report, it will then record in PLAID_ASSET_REPORT_DATA
 *    2.3. invoke getAssetReportPDF to get the PDF version and save to storage
 * 
 * 3. use getAssetReportData to get all report data for the user
 * 
 * // TODO - asset report refresh for new set of data, 
 * 
 */

export const recordWebhookData = async (webhookData: PlaidAssetWebhookData) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(PLAID_ASSET_WEBHOOK_COLLECTION);
  console.log(webhookData);

  const querySnapshot = await collectionRef
    .where("asset_report_id", "==", webhookData.asset_report_id)
    .limit(1)
    .get();

  if (!querySnapshot.empty) {
    return;
  }

  await collectionRef.add({
    ...webhookData,
    createdAt: Timestamp.now(),
  });

  const assetReportRequest = await getAssetReportRequestByAssetReportId(
    webhookData.asset_report_id
  );

  if (assetReportRequest) {
    const response = await getAssetReport(
      assetReportRequest.assetReportToken,
      assetReportRequest.userId
    );

    if (response) {
      await getAssetReportPDF(
        assetReportRequest.assetReportToken,
        assetReportRequest.userId,
        assetReportRequest.itemId
      );
    }

    /** 
     //TODO - call n8n webhook for AI analysis

     **/
  }
};

export const getAssetReportRequestByAssetReportId = async (assetReportId: string) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(PLAID_CREATE_ASSET_REPORT);
  const querySnapshot = await collectionRef
    .where("assetReportId", "==", assetReportId)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...normalizeAllDates(doc.data()) } as PlaidAssetReportRequest & {
    id: string;
  };
};

export const getAssetReportRequestByUserId = async (userId: string) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(PLAID_CREATE_ASSET_REPORT);
  const querySnapshot = await collectionRef.where("userId", "==", userId).limit(1).get();

  if (querySnapshot.empty) {
    console.log("No matching documents.");
    return null;
  }

  const doc = querySnapshot.docs[0];

  return { id: doc.id, ...normalizeAllDates(doc.data()) } as PlaidAssetReportRequest & {
    id: string;
  };
};

export const getAssetReportPDF = async (
  assetReportToken: string,
  userId: string,
  itemId: string
) => {
  const client = await getPlaidClient();

  try {
    const response = await client.assetReportPdfGet(
      {
        asset_report_token: assetReportToken,
      },
      { responseType: "arraybuffer" }
    );
    const pdfBuffer =
      response.data instanceof Buffer ? response.data : Buffer.from(response.data as ArrayBuffer);

    const storage = storageAdmin();

    const bucketFile = storage.file(`plaid/${userId}/${itemId}.pdf`);

    await bucketFile.save(pdfBuffer, { contentType: "application/pdf" });
  } catch (e: any) {
    console.error("Plaid Error:", e.response?.data);
    throw e;
  }
};

export const getAssetReportPDFUrl = async (assetReportToken: string) => {
  const client = await getPlaidClient();
  let response = null;
  try {
    response = await client.assetReportPdfGet({
      asset_report_token: assetReportToken,
    });
  } catch (e: any) {
    console.error("Plaid Error:", e.response?.data);
    throw e;
  }

  return response.data.url;
};

export const getAssetReport = async (assetReportToken: string, userId: string) => {
  const client = await getPlaidClient();
  let response = null;
  try {
    response = await client.assetReportGet({
      asset_report_token: assetReportToken,
      include_insights: true,
    });
  } catch (e: any) {
    console.error("Plaid Error:", e.response?.data);
    throw e;
  }

  const db = firestoreAdmin();
  const collectionRef = db.collection(PLAID_ASSET_REPORT_DATA);
  await collectionRef.add({
    ...response.data,
    userId,
    createdAt: Timestamp.now(),
  });

  return response.data;
};

export const getAssetReportData = async (userId: string) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(PLAID_ASSET_REPORT_DATA).where("userId", "==", userId);

  const snapshot = await collectionRef.orderBy("createdAt", "asc").get();

  if (snapshot.empty) return null;

  return snapshot.docs.map((doc) => ({ id: doc.id, ...normalizeAllDates(doc.data()) }));
};

export const createAssetReport = async (userId: string, itemId: string) => {
  const client = await getPlaidClient();

  const userData = await getUserById(userId);
  if (!userData) {
    throw new AppError("User not found");
  }

  const accessTokens = await getAccessToken(userId, "ITEM", itemId);
  if (!accessTokens?.length) {
    throw new AppError("No linked bank account found");
  }

  const tokens = accessTokens.map((item) => item.accessToken);

  const webhookUrl = `${await getBaseUrl()}/api/plaid/webhook`;

  const config = {
    access_tokens: tokens,
    days_requested: 365,
    options: {
      user: {
        client_user_id: userId,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        phone_number: userData.phoneNumber,
        // ssn: userData.ssn,
      },
      add_ons: [AssetReportAddOns.Investments],
      webhook: webhookUrl,
    },
  };

  // console.log("config", config);

  let response = null;
  try {
    response = await client.assetReportCreate(config);
  } catch (error: any) {
    console.error("Plaid Error:", error.response?.data);
    throw error;
  }

  await recordAssetReportRequest(
    userId,
    response.data.asset_report_token,
    response.data.asset_report_id,
    itemId
  );
  return response.data;
};

export const recordAssetReportRequest = async (
  userId: string,
  assetReportToken: string,
  assetReportId: string,
  itemId: string
) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(PLAID_CREATE_ASSET_REPORT);

  const docRef = await collectionRef.add({
    userId,
    assetReportToken,
    assetReportId,
    itemId,
    createdAt: Timestamp.now(),
  });

  const doc = await docRef.get();
  return { id: doc.id, ...normalizeAllDates(doc.data()) } as PlaidAssetReportRequest & {
    id: string;
  };
};
