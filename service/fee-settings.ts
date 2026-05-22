"use server";
import { SYSTEM_CONFIG_COLLECTION } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";

const CONFIG_DOC_ID = "fee-settings";

export interface FeeSettings {
  creditReportFee: number;
  businessCreditReportFee: number;
}

export const getFeeSettings = async (): Promise<FeeSettings> => {
  const db = firestoreAdmin();
  const doc = await db
    .collection(SYSTEM_CONFIG_COLLECTION)
    .doc(CONFIG_DOC_ID)
    .get();
  const data = doc.data();
  return {
    creditReportFee: data?.creditReportFee ?? 49,
    businessCreditReportFee: data?.businessCreditReportFee ?? 100,
  };
};

export const setFeeSettings = async (settings: FeeSettings): Promise<void> => {
  const db = firestoreAdmin();
  await db
    .collection(SYSTEM_CONFIG_COLLECTION)
    .doc(CONFIG_DOC_ID)
    .set(settings, { merge: true });
};
