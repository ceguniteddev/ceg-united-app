import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    iv: iv.toString("hex"),
    content: encrypted,
  };
}

export function decrypt(hash: { iv: string; content: string }) {
  const iv = Buffer.from(hash.iv, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);

  let decrypted = decipher.update(hash.content, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
