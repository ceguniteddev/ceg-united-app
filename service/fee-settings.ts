"use server";
import { SYSTEM_CONFIG_COLLECTION } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { synchronizeDodoSubscriptionCatalog } from "@/service/dodo/catalog";

const CONFIG_DOC_ID = "fee-settings";

export interface FeeSettings {
  creditReportFee: number;
  businessCreditReportFee: number;
  tierStarterPrice: number;
  tierProPrice: number;
  tierExecutivePrice: number;
  creditModuleProAddonPrice: number;
  earlyRefreshFee: number;
  personalUnlimitedUnlockFee: number;
  businessUnlimitedUnlockFee: number;
  sbaUnlimitedUnlockFee: number;
  firstClassMailFee: number;
  certifiedMailFee: number;
  certifiedMailRRFee: number;
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
    tierStarterPrice: data?.tierStarterPrice ?? 297,
    tierProPrice: data?.tierProPrice ?? 397,
    tierExecutivePrice: data?.tierExecutivePrice ?? 697,
    creditModuleProAddonPrice: data?.creditModuleProAddonPrice ?? 197,
    earlyRefreshFee: data?.earlyRefreshFee ?? 99,
    personalUnlimitedUnlockFee: data?.personalUnlimitedUnlockFee ?? 999,
    businessUnlimitedUnlockFee: data?.businessUnlimitedUnlockFee ?? 999,
    sbaUnlimitedUnlockFee: data?.sbaUnlimitedUnlockFee ?? 999,
    firstClassMailFee: data?.firstClassMailFee ?? 1.95,
    certifiedMailFee: data?.certifiedMailFee ?? 7.0,
    certifiedMailRRFee: data?.certifiedMailRRFee ?? 11.5,
  };
};

export const setFeeSettings = async (settings: FeeSettings): Promise<void> => {
  await synchronizeDodoSubscriptionCatalog(settings);
  const db = firestoreAdmin();
  await db
    .collection(SYSTEM_CONFIG_COLLECTION)
    .doc(CONFIG_DOC_ID)
    .set(settings, { merge: true });
};
