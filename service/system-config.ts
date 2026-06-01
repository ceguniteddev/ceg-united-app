"use server";

import { SYSTEM_CONFIG_COLLECTION } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";

const CONFIG_DOC_ID = "settings";

export type SystemConfig = {
  markupPercentage: number;
  creditRepairEnabled: boolean;
};

const defaultSystemConfig: SystemConfig = {
  markupPercentage: 0,
  creditRepairEnabled: false,
};

export const getSystemConfig = async (): Promise<SystemConfig> => {
  const db = firestoreAdmin();
  const doc = await db
    .collection(SYSTEM_CONFIG_COLLECTION)
    .doc(CONFIG_DOC_ID)
    .get();

  if (doc.exists) {
    const data = doc.data();
    return {
      markupPercentage:
        data?.markupPercentage ?? defaultSystemConfig.markupPercentage,
      creditRepairEnabled:
        data?.creditRepairEnabled ?? defaultSystemConfig.creditRepairEnabled,
    };
  }

  return defaultSystemConfig;
};

export const updateSystemConfig = async (
  config: Partial<SystemConfig>,
): Promise<void> => {
  const db = firestoreAdmin();
  await db
    .collection(SYSTEM_CONFIG_COLLECTION)
    .doc(CONFIG_DOC_ID)
    .set(config, { merge: true });
};
