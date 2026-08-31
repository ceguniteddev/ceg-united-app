"use server";

import type { FeeSettings } from "@/service/fee-settings";
import { dodoClient } from "@/lib/dodo-sdk";

export const synchronizeDodoRecurringProductPrice = async (
  productId: string,
  amountInCents: number,
) => {
  const product = await dodoClient.products.retrieve(productId);
  if (product.price.type !== "recurring_price") {
    throw new Error(`Dodo product ${productId} must use recurring pricing.`);
  }
  if (product.price.price === amountInCents) return false;
  await dodoClient.products.update(productId, {
    price: { ...product.price, price: amountInCents },
  });
  return true;
};

export const synchronizeDodoSubscriptionCatalog = async (
  settings: FeeSettings,
) => {
  const configured = [
    [process.env.DODO_PRODUCT_MEMBERSHIP_STARTER_ID, settings.tierStarterPrice],
    [process.env.DODO_PRODUCT_MEMBERSHIP_PRO_ID, settings.tierProPrice],
    [
      process.env.DODO_PRODUCT_MEMBERSHIP_EXECUTIVE_ID,
      settings.tierExecutivePrice,
    ],
    [
      process.env.DODO_PRODUCT_CREDIT_MODULE_PRO_ID,
      settings.creditModuleProAddonPrice,
    ],
  ] as const;
  const results = await Promise.all(
    configured.map(async ([productId, amount]) => {
      if (!productId) return { productId: null, skipped: true, updated: false };
      const updated = await synchronizeDodoRecurringProductPrice(
        productId,
        Math.round(amount * 100),
      );
      return { productId, skipped: false, updated };
    }),
  );
  return results;
};
