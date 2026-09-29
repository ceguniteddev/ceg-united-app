import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

if (!admin.apps.length) {
  admin.initializeApp();
}

export function getResolvedProjectId(): string {
  if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  if (process.env.PROJECT_ID) return process.env.PROJECT_ID;
  if (process.env.FIREBASE_CONFIG) {
    try {
      const config = JSON.parse(process.env.FIREBASE_CONFIG);
      if (config.projectId) return config.projectId;
    } catch {
      // ignore
    }
  }
  return "cegunitedllc";
}

export function getResolvedDatabaseId(): string {
  if (process.env.DATABASE_NAME) {
    return process.env.DATABASE_NAME;
  }
  const projectId = getResolvedProjectId();
  return projectId === "ceg-united-llc-prod"
    ? "ceg-united-db-production"
    : "ceg-united-db-staging";
}

export function getDb(): admin.firestore.Firestore {
  return getFirestore(getResolvedDatabaseId());
}
