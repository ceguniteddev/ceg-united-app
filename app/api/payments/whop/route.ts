import { whopSdk } from "@/lib/whop-sdk";

import type { Payment } from "@whop/sdk/resources.js";
import { NextRequest } from "next/server";
import { recordPaymentSucceeded } from "@/service/whop";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const requestBodyText = await request.text();
    const headers = Object.fromEntries(request.headers);
    const webhookData = whopSdk.webhooks.unwrap(requestBodyText, { headers });

    if (webhookData.type === "payment.succeeded") {
      handlePaymentSucceeded(webhookData.data);
    }

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("Error handling Whop webhook:", error);
    return new Response(
      "Error handling Whop webhook: " + (error.message || "Unknown error"),
      { status: 500 },
    );
  }
}

async function handlePaymentSucceeded(payment: Payment) {
  await recordPaymentSucceeded({ payment: payment });
}
