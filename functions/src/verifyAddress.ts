import * as functions from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const LOB_API_KEY = defineSecret("LOB_API_KEY");

export const verifyAddress = functions.onCall(
  {
    secrets: [LOB_API_KEY],
    invoker: "public",
    cors: [
      "http://localhost:3000",
      "https://raccoon-robust-likely.ngrok-free.app",
      "https://staging.cegunited.com",
      "https://app.cegunited.com",
    ],
  },
  async (req) => {
    if (!req.auth)
      throw new functions.HttpsError("unauthenticated", "Sign in required");

    const { address, primary_line, secondary_line, city, state, zip_code } =
      req.data;

    if (!address && !primary_line) {
      throw new functions.HttpsError(
        "invalid-argument",
        "Either 'address' or 'primary_line' is required",
      );
    }

    const authStr = Buffer.from(`${LOB_API_KEY.value()}:`).toString("base64");

    try {
      const payload: any = {};
      if (address) {
        payload.address = address;
      } else {
        payload.primary_line = primary_line;
        if (secondary_line) payload.secondary_line = secondary_line;
        if (city) payload.city = city;
        if (state) payload.state = state;
        if (zip_code) payload.zip_code = zip_code;
      }

      const lobRes = await fetch("https://api.lob.com/v1/us_verifications", {
        method: "POST",
        headers: {
          Authorization: `Basic ${authStr}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!lobRes.ok) {
        const errText = await lobRes.text();
        console.error("Lob Verification API error:", errText);
        throw new functions.HttpsError(
          "internal",
          `Lob API error: ${lobRes.status}`,
        );
      }

      const data = (await lobRes.json()) as any;
      return {
        deliverability: data.deliverability,
        components: data.components,
        id: data.id,
      };
    } catch (error) {
      console.error("Error verifying address:", error);
      throw new functions.HttpsError("internal", "Failed to verify address");
    }
  },
);
