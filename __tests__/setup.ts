// Global test setup for Vitest

// Mock environment variables needed across tests
process.env.ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 64-char hex = 32 bytes
process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
process.env.ADMIN_ACCESS_KEY = "test-admin-key";
process.env.FIREBASE_PROJECT_ID = "test-project";
process.env.FIREBASE_CLIENT_EMAIL = "test@test.com";
process.env.FIREBASE_PRIVATE_KEY =
  "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n";
process.env.MUX_TOKEN_ID = "test-mux-token-id";
process.env.MUX_TOKEN_SECRET = "test-mux-token-secret";
