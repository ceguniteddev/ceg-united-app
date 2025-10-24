#!/usr/bin/env tsx
import crypto from "crypto";

// AES-256-CBC settings
const ALGORITHM = "aes-256-cbc";
const KEY = process.env.ENCRYPTION_KEY;

if (!KEY) {
  console.error("❌ ENCRYPTION_KEY is missing. Set it in your environment.");
  process.exit(1);
}

// Parse CLI args
const args = process.argv.slice(2);
let encryptedData = "";
let ivHex = "";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--data") encryptedData = args[i + 1];
  if (args[i] === "--iv") ivHex = args[i + 1];
}

if (!encryptedData || !ivHex) {
  console.error("❌ Usage: npx tsx decrypt.ts --data <ENCRYPTED_HEX> --iv <IV_HEX>");
  process.exit(1);
}

try {
  const iv = Buffer.from(ivHex, "hex");
  const key = Buffer.from(KEY, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  console.log("✅ Decrypted value:");
  console.log(decrypted);
} catch (err: any) {
  console.error("❌ Failed to decrypt:", err.message);
  process.exit(1);
}
