import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "@/lib/encryption";

// ENCRYPTION_KEY is set in __tests__/setup.ts (64-char hex = 32 bytes for AES-256)

describe("encrypt()", () => {
  it("should return an object with iv and content", () => {
    const result = encrypt("hello");
    expect(result).toHaveProperty("iv");
    expect(result).toHaveProperty("content");
  });

  it("should return hex strings for iv and content", () => {
    const result = encrypt("hello");
    expect(result.iv).toMatch(/^[0-9a-f]+$/);
    expect(result.content).toMatch(/^[0-9a-f]+$/);
  });

  it("should produce a 32-char (16-byte) iv", () => {
    const result = encrypt("hello");
    expect(result.iv).toHaveLength(32); // 16 bytes * 2 hex chars
  });

  it("should produce different ciphertexts for each call (random IV)", () => {
    const r1 = encrypt("same text");
    const r2 = encrypt("same text");
    // Different IVs → different ciphertexts
    expect(r1.iv).not.toBe(r2.iv);
    expect(r1.content).not.toBe(r2.content);
  });

  it("should encrypt an empty string without throwing", () => {
    expect(() => encrypt("")).not.toThrow();
  });

  it("should encrypt a long string", () => {
    const longText = "a".repeat(1000);
    const result = encrypt(longText);
    expect(result.content.length).toBeGreaterThan(0);
  });
});

describe("decrypt()", () => {
  it("should decrypt back to the original plaintext", () => {
    const plaintext = "Hello, World!";
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("should handle special characters", () => {
    const plaintext = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("should handle unicode / emoji", () => {
    const plaintext = "Hello 🌍 こんにちは";
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("should handle numbers as strings", () => {
    const plaintext = "1234567890";
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("should handle an empty string round-trip", () => {
    const encrypted = encrypt("");
    expect(decrypt(encrypted)).toBe("");
  });

  it("should handle JSON payload round-trip", () => {
    const obj = { userId: "abc123", role: "Admin" };
    const plaintext = JSON.stringify(obj);
    const encrypted = encrypt(plaintext);
    expect(JSON.parse(decrypt(encrypted))).toEqual(obj);
  });

  it("should throw when given an invalid iv or content", () => {
    expect(() =>
      decrypt({
        iv: "000000000000000000000000000000xx",
        content: "badcontent",
      }),
    ).toThrow();
  });
});
