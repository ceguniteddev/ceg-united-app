import { NextRequest, NextResponse } from "next/server";
import { internalServerError } from "@/app/api/helpers";
import { recordWebhookData as itemData } from "@/service/plaid/item";
import { recordWebhookData as assetData } from "@/service/plaid/asset";
import { recordWebhookData as recordData } from "@/service/webhook";

export const POST = async (request: NextRequest) => {
  try {
    const message = (await request.json()) as PlaidWebhookData;

    await recordData(message);

    if (message.webhook_type === "ITEM") {
      await itemData(message);
    } else if (message.webhook_type === "ASSETS") {
      await assetData(message);
    }

    return NextResponse.json("ok", { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return internalServerError();
  }
};
