import { Logging } from "@google-cloud/logging";
import { LogEntry } from "@google-cloud/logging/build/src/entry";
const logging = new Logging({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY,
  },
});
const log = logging.log("ceg-united-app-logs");

export const logInfo = async (message: string, data?: Record<string, any>) => {
  const metadata: LogEntry = {
    resource: { type: "global" },
  };
  const entry = log.entry(metadata, {
    message,
    ...data,
  });
  await log.info(entry);
};

export const logError = async (err: Error, data?: Record<string, any>) => {
  const entry = log.entry(
    { resource: { type: "global" } },
    {
      message: err.message,
      stack: err.stack,
      ...data,
      timestamp: new Date().toISOString(),
    }
  );

  await log.error(entry);
};
