import { Logging } from "@google-cloud/logging";
const logging = new Logging({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY,
  },
});
const log = logging.log("ceg-united-app-logs");

export const logInfo = (message: string, data?: Record<string, any>) => {
  const entry = log.entry(
    { resource: { type: "global" } },
    {
      severity: "INFO",
      message,
      ...data,
      timestamp: new Date().toISOString(),
    }
  );
  log.write(entry);
};

export const logError = (err: Error, data?: Record<string, any>) => {
  const entry = log.entry(
    { resource: { type: "global" } },
    {
      severity: "ERROR",
      message: err.message,
      stack: err.stack,
      ...data,
      timestamp: new Date().toISOString(),
    }
  );
  log.write(entry);
};
