// Global test setup for Vitest
// Mock environment variables needed across tests
process.env.ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"; // 64-char hex = 32 bytes
process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
process.env.ADMIN_ACCESS_KEY = "test-admin-key";
