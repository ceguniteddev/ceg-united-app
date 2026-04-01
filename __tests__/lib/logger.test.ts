import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@google-cloud/logging", () => {
  const mockEntry = vi.fn().mockReturnValue({});
  const mockWrite = vi.fn().mockResolvedValue(undefined);
  const mockLogSyncWrite = vi.fn();
  return {
    Logging: vi.fn().mockImplementation(() => ({
      log: vi.fn().mockReturnValue({ entry: mockEntry, write: mockWrite }),
      logSync: vi.fn().mockReturnValue({
        entry: mockEntry,
        write: mockLogSyncWrite,
      }),
    })),
    LogSync: vi.fn(),
  };
});

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("logInfo", () => {
    it("does not throw and logs to console", async () => {
      const { logInfo } = await import("@/lib/logger");
      await expect(logInfo("test message")).resolves.toBeUndefined();
      expect(logSpy).toHaveBeenCalledWith("[INFO] test message", "");
    });

    it("does not throw with data provided", async () => {
      const { logInfo } = await import("@/lib/logger");
      await expect(
        logInfo("test message", { userId: "user-123" }),
      ).resolves.toBeUndefined();
      expect(logSpy).toHaveBeenCalledWith("[INFO] test message", {
        userId: "user-123",
      });
    });

    it("handles undefined data gracefully", async () => {
      const { logInfo } = await import("@/lib/logger");
      await expect(logInfo("message without data")).resolves.toBeUndefined();
    });
  });

  describe("logError", () => {
    it("does not throw and logs to console.error", async () => {
      const { logError } = await import("@/lib/logger");
      const err = new Error("test error");
      await expect(logError(err)).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith(
        "[ERROR] test error",
        expect.objectContaining({ stack: err.stack }),
      );
    });

    it("does not throw with additional data", async () => {
      const { logError } = await import("@/lib/logger");
      const err = new Error("test error with data");
      await expect(
        logError(err, { requestId: "req-456" }),
      ).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith(
        "[ERROR] test error with data",
        expect.objectContaining({ requestId: "req-456" }),
      );
    });

    it("handles undefined data gracefully", async () => {
      const { logError } = await import("@/lib/logger");
      const err = new Error("error no data");
      await expect(logError(err)).resolves.toBeUndefined();
    });
  });

  describe("logWarn", () => {
    it("does not throw", async () => {
      const { logWarn } = await import("@/lib/logger");
      await expect(logWarn("warn message")).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith("[WARN] warn message", "");
    });

    it("does not throw with data provided", async () => {
      const { logWarn } = await import("@/lib/logger");
      await expect(
        logWarn("warn message", { action: "test" }),
      ).resolves.toBeUndefined();
    });

    it("handles undefined data gracefully", async () => {
      const { logWarn } = await import("@/lib/logger");
      await expect(logWarn("warn no data")).resolves.toBeUndefined();
    });
  });

  describe("logDebug", () => {
    it("does not throw when debug level is enabled", async () => {
      process.env.LOG_LEVEL = "debug";
      vi.resetModules();
      const { logDebug } = await import("@/lib/logger");
      await expect(logDebug("debug message")).resolves.toBeUndefined();
      delete process.env.LOG_LEVEL;
      vi.resetModules();
    });

    it("does not produce output at default info log level", async () => {
      // Default LOG_LEVEL is "info", so debug should be skipped
      vi.resetModules();
      delete process.env.LOG_LEVEL;
      const { logDebug } = await import("@/lib/logger");
      await logDebug("this should not appear");
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it("handles undefined data gracefully", async () => {
      process.env.LOG_LEVEL = "debug";
      vi.resetModules();
      const { logDebug } = await import("@/lib/logger");
      await expect(logDebug("debug no data")).resolves.toBeUndefined();
      delete process.env.LOG_LEVEL;
      vi.resetModules();
    });
  });

  describe("log level filtering", () => {
    it("logInfo should not produce console output when LOG_LEVEL=error", async () => {
      process.env.LOG_LEVEL = "error";
      vi.resetModules();
      const { logInfo } = await import("@/lib/logger");
      await logInfo("should be filtered");
      expect(logSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("should be filtered"),
        expect.anything(),
      );
      delete process.env.LOG_LEVEL;
      vi.resetModules();
    });

    it("logWarn should not produce console output when LOG_LEVEL=error", async () => {
      process.env.LOG_LEVEL = "error";
      vi.resetModules();
      const { logWarn } = await import("@/lib/logger");
      await logWarn("warn should be filtered");
      // Vitest itself may call console.warn; verify our specific message was not logged
      const calledWithOurMessage = warnSpy.mock.calls.some((args) =>
        String(args[0]).includes("warn should be filtered"),
      );
      expect(calledWithOurMessage).toBe(false);
      delete process.env.LOG_LEVEL;
      vi.resetModules();
    });
  });
});
