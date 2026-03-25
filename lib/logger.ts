import { Logging, LogSync } from "@google-cloud/logging";
import { LogEntry } from "@google-cloud/logging/build/src/entry";

/**
 * Logging configuration and types
 */
type LogLevel = "debug" | "info" | "warn" | "error";
type LoggingMode = "api" | "stdout" | "both";

interface LogMetadata {
  userId?: string;
  requestId?: string;
  action?: string;
  resource?: string;
  [key: string]: any;
}

// Environment configuration
const LOGGING_MODE = (process.env.LOGGING_MODE || "both") as LoggingMode;
const LOG_LEVEL = (process.env.LOG_LEVEL || "info") as LogLevel;
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || "development";
const LOG_NAME = `ceg-united-app-${ENVIRONMENT}-logs`;

// Log level hierarchy for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LOG_LEVEL = LOG_LEVELS[LOG_LEVEL];

/**
 * Initialize Google Cloud Logging clients
 */
let logging: Logging | null = null;
let logSync: LogSync | null = null;

try {
  const loggingConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY,
    },
  };

  if (LOGGING_MODE === "api" || LOGGING_MODE === "both") {
    logging = new Logging(loggingConfig);
  }

  if (LOGGING_MODE === "stdout" || LOGGING_MODE === "both") {
    const loggingForSync = new Logging(loggingConfig);
    // LogSync is obtained by calling logSync() on Logging instance
    logSync = loggingForSync.logSync(LOG_NAME);
  }
} catch (error) {
  console.error("[LOGGER] Failed to initialize Google Cloud Logging:", error);
  console.error("[LOGGER] Falling back to console-only logging");
}

/**
 * Check if a log level should be logged based on current configuration
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= CURRENT_LOG_LEVEL;
}

/**
 * Write log to stdout for LogSync (recommended for serverless environments)
 */
function writeToStdout(
  severity: "INFO" | "ERROR" | "WARN" | "DEBUG",
  message: string,
  data?: LogMetadata,
  errorStack?: string,
) {
  if (!logSync) {
    // Fallback to JSON structured logging if LogSync not initialized
    const logEntry = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      environment: ENVIRONMENT,
      ...(errorStack && { stack: errorStack }),
      ...data,
    };

    if (severity === "ERROR") {
      console.error(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
    return;
  }

  try {
    const metadata: LogEntry = {
      resource: { type: "global" },
      severity: severity as any,
    };

    const entry = logSync.entry(metadata, {
      message,
      timestamp: new Date().toISOString(),
      environment: ENVIRONMENT,
      ...(errorStack && { stack: errorStack }),
      ...data,
    });

    // LogSync.write() outputs to stdout in structured format
    logSync.write(entry);
  } catch (error) {
    console.error("[LOGGER] Failed to write with LogSync:", error);
  }
}

/**
 * Write log to Cloud Logging API
 */
async function writeToApi(
  severity: "info" | "error" | "warning" | "debug",
  message: string,
  data?: LogMetadata,
  errorStack?: string,
) {
  if (!logging) return;

  try {
    const log = logging.log(LOG_NAME);
    const metadata: LogEntry = {
      resource: { type: "global" },
      severity: severity.toUpperCase() as any,
    };

    const entry = log.entry(metadata, {
      message,
      timestamp: new Date().toISOString(),
      environment: ENVIRONMENT,
      ...(errorStack && { stack: errorStack }),
      ...data,
    });

    await log.write(entry);
  } catch (error) {
    console.error("[LOGGER] Failed to write log to Cloud Logging API:", error);
  }
}

/**
 * Log info message
 */
export const logInfo = async (
  message: string,
  data?: Record<string, any>,
): Promise<void> => {
  if (!shouldLog("info")) return;

  // Console output for local development
  console.log(`[INFO] ${message}`, data || "");

  try {
    if (LOGGING_MODE === "stdout" || LOGGING_MODE === "both") {
      writeToStdout("INFO", message, data);
    }

    if (LOGGING_MODE === "api" || LOGGING_MODE === "both") {
      await writeToApi("info", message, data);
    }
  } catch (error) {
    console.error("[LOGGER] Error in logInfo:", error);
  }
};

/**
 * Log error message
 */
export const logError = async (
  err: Error,
  data?: Record<string, any>,
): Promise<void> => {
  if (!shouldLog("error")) return;

  // Console output for local development
  console.error(`[ERROR] ${err.message}`, {
    stack: err.stack,
    ...data,
  });

  try {
    if (LOGGING_MODE === "stdout" || LOGGING_MODE === "both") {
      writeToStdout("ERROR", err.message, data, err.stack);
    }

    if (LOGGING_MODE === "api" || LOGGING_MODE === "both") {
      await writeToApi("error", err.message, data, err.stack);
    }
  } catch (error) {
    console.error("[LOGGER] Error in logError:", error);
  }
};

/**
 * Log warning message
 */
export const logWarn = async (
  message: string,
  data?: Record<string, any>,
): Promise<void> => {
  if (!shouldLog("warn")) return;

  console.warn(`[WARN] ${message}`, data || "");

  try {
    if (LOGGING_MODE === "stdout" || LOGGING_MODE === "both") {
      writeToStdout("WARN", message, data);
    }

    if (LOGGING_MODE === "api" || LOGGING_MODE === "both") {
      await writeToApi("warning", message, data);
    }
  } catch (error) {
    console.error("[LOGGER] Error in logWarn:", error);
  }
};

/**
 * Log debug message
 */
export const logDebug = async (
  message: string,
  data?: Record<string, any>,
): Promise<void> => {
  if (!shouldLog("debug")) return;

  console.debug(`[DEBUG] ${message}`, data || "");

  try {
    if (LOGGING_MODE === "stdout" || LOGGING_MODE === "both") {
      writeToStdout("DEBUG", message, data);
    }

    if (LOGGING_MODE === "api" || LOGGING_MODE === "both") {
      await writeToApi("debug", message, data);
    }
  } catch (error) {
    console.error("[LOGGER] Error in logDebug:", error);
  }
};
