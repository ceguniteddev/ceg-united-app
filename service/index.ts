import { headers } from "next/headers";

export const getBaseUrl = async () => {
  if (process.env.ENVIRONMENT === "development") {
    return "https://hare-smashing-basically.ngrok-free.app";
  }
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
};
