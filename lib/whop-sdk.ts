import Whop from "@whop/sdk";

const WHOP_API_KEY = process.env.WHOP_API_KEY;
const WHOP_BASE_URL =
  process.env.WHOP_BASE_URL || "https://api.whop.com/api/v1";

export const whopSdk = new Whop({
  apiKey: WHOP_API_KEY,
  baseURL: WHOP_BASE_URL,
  webhookKey: btoa(process.env.WHOP_WEBHOOK_SECRET || ""),
});
