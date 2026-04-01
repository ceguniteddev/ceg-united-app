import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted so all mock state is available when vi.mock factory runs (hoisted to top)
const mockAdminModule = vi.hoisted(() => {
  const mockFirestoreSettings = vi.fn();
  const mockFirestore = vi
    .fn()
    .mockReturnValue({ settings: mockFirestoreSettings });
  const mockAuth = vi.fn().mockReturnValue({});
  const mockStorageBucket = vi.fn().mockReturnValue({});
  const mockStorage = vi.fn().mockReturnValue({ bucket: mockStorageBucket });
  const mockApp = {
    firestore: mockFirestore,
    auth: mockAuth,
    storage: mockStorage,
  };
  return {
    // mutable apps array to simulate admin.apps
    apps: [] as any[],
    mockApp,
    mockFirestore,
    mockAuth,
    mockStorage,
    mockStorageBucket,
    mockFirestoreSettings,
  };
});

// firebase-admin uses `import * as admin` — mock as named exports (not under `default`)
vi.mock("firebase-admin", () => ({
  get apps() {
    return mockAdminModule.apps;
  },
  app: vi.fn().mockReturnValue(mockAdminModule.mockApp),
  credential: { cert: vi.fn().mockReturnValue("mock-cert") },
  initializeApp: vi.fn().mockReturnValue(mockAdminModule.mockApp),
}));

describe("firebase-admin", () => {
  beforeEach(() => {
    vi.resetModules();
    // Reset apps array to empty (no existing app)
    mockAdminModule.apps = [];
    mockAdminModule.mockFirestoreSettings.mockClear();
    mockAdminModule.mockFirestore.mockReturnValue({
      settings: mockAdminModule.mockFirestoreSettings,
    });
    mockAdminModule.mockAuth.mockReturnValue({});
    mockAdminModule.mockStorageBucket.mockReturnValue({});
    mockAdminModule.mockStorage.mockReturnValue({
      bucket: mockAdminModule.mockStorageBucket,
    });

    // Default env vars
    process.env.FIREBASE_PROJECT_ID = "test-project";
    process.env.FIREBASE_CLIENT_EMAIL = "test@test.iam.gserviceaccount.com";
    process.env.FIREBASE_PRIVATE_KEY =
      "-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----";
    process.env.FIREBASE_DB_NAME = "test-db";
    process.env.FIREBASE_STORAGE_NAME = "test-bucket";
  });

  afterEach(() => {
    delete process.env.FIREBASE_PRIVATE_KEY_BASE64;
    vi.restoreAllMocks();
  });

  describe("formatPrivateKey", () => {
    it("replaces \\\\n with actual newlines", async () => {
      const { formatPrivateKey } = await import("@/lib/fireabase-admin");
      const input =
        "-----BEGIN RSA PRIVATE KEY-----\\ntest\\n-----END RSA PRIVATE KEY-----";
      const result = formatPrivateKey(input);
      expect(result).toBe(
        "-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----",
      );
    });

    it("returns key unchanged when no escaped newlines", async () => {
      const { formatPrivateKey } = await import("@/lib/fireabase-admin");
      const input = "plain-key-no-newlines";
      expect(formatPrivateKey(input)).toBe("plain-key-no-newlines");
    });
  });

  describe("initFirebase", () => {
    it("initializes firebase app with individual key env vars", async () => {
      const { initFirebase } = await import("@/lib/fireabase-admin");
      const result = initFirebase();
      expect(result).toBe(mockAdminModule.mockApp);
    });

    it("returns existing app when admin.apps.length > 0", async () => {
      mockAdminModule.apps = [mockAdminModule.mockApp];
      const { initFirebase } = await import("@/lib/fireabase-admin");
      const result = initFirebase();
      expect(result).toBe(mockAdminModule.mockApp);
    });

    it("uses base64 credentials when FIREBASE_PRIVATE_KEY_BASE64 is set", async () => {
      const serviceAccount = {
        project_id: "base64-project",
        client_email: "base64@test.iam.gserviceaccount.com",
        private_key:
          "-----BEGIN RSA PRIVATE KEY-----\\nbase64key\\n-----END RSA PRIVATE KEY-----",
      };
      process.env.FIREBASE_PRIVATE_KEY_BASE64 = Buffer.from(
        JSON.stringify(serviceAccount),
      ).toString("base64");

      const { initFirebase } = await import("@/lib/fireabase-admin");
      const result = initFirebase();
      expect(result).toBe(mockAdminModule.mockApp);
    });

    it("throws when no private key env vars are set", async () => {
      delete process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.FIREBASE_PRIVATE_KEY_BASE64;

      const { initFirebase } = await import("@/lib/fireabase-admin");
      expect(() => initFirebase()).toThrow(
        "FIREBASE_PRIVATE_KEY_BASE64 or FIREBASE_PRIVATE_KEY must be set in environment variables",
      );
    });
  });

  describe("firestoreAdmin", () => {
    it("returns a firestore instance", async () => {
      const { firestoreAdmin } = await import("@/lib/fireabase-admin");
      const result = firestoreAdmin();
      expect(result).toBeDefined();
      expect(mockAdminModule.mockFirestore).toHaveBeenCalled();
    });
  });

  describe("authenticationAdmin", () => {
    it("returns an auth instance", async () => {
      const { authenticationAdmin } = await import("@/lib/fireabase-admin");
      const result = authenticationAdmin();
      expect(result).toBeDefined();
      expect(mockAdminModule.mockAuth).toHaveBeenCalled();
    });
  });

  describe("storageAdmin", () => {
    it("returns a storage bucket instance", async () => {
      const { storageAdmin } = await import("@/lib/fireabase-admin");
      const result = storageAdmin();
      expect(result).toBeDefined();
      expect(mockAdminModule.mockStorage).toHaveBeenCalled();
      expect(mockAdminModule.mockStorageBucket).toHaveBeenCalled();
    });
  });
});
