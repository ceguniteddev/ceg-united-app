import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";

const CONSUMER_KEY = process.env.WC_CONSUMER_KEY ?? "";
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET ?? "";
const BASE_URL = "https://tradelinesupply.com/wp-json/wc/v3/pricing";

function urlEncodeRfc3986(value: string): string {
  return rawUrlEncode(value).replace(/\+/g, " ").replace(/%7E/g, "~");
}

function rawUrlEncode(value: string): string {
  return encodeURIComponent(value);
}

function buildQueryString(params: Record<string, string>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    parts.push(urlEncodeRfc3986(`${key}=${value}`));
  }
  return parts.join("%26");
}

export const GET = withAuth(async () => {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const params: Record<string, string> = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: timestamp,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
  };

  const baseRequestUri = encodeURIComponent(BASE_URL);
  const queryString = buildQueryString(params);
  const stringToSign = `GET&${baseRequestUri}&${queryString}`;

  const secret = `${CONSUMER_SECRET}&`;
  const signature = createHmac("sha1", secret)
    .update(stringToSign)
    .digest("base64");

  const queryParts = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const url = `${BASE_URL}?${queryParts}&oauth_signature=${encodeURIComponent(signature)}`;
  console.log("Requesting URL:", url);
  const response = await fetch(url, {
    headers: {
      "cache-control": "no-cache",
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `API error: ${response.status}` },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
});
