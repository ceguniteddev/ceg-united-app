/**
 * functions/src/index.ts
 * ----------------------------------------------------------------------------
 * Entry point for Firebase Cloud Functions deploy. Exports every function —
 * `firebase deploy --only functions` discovers deployable functions from
 * this file's exports.
 * ----------------------------------------------------------------------------
 */

import * as admin from "firebase-admin";

// Initialize the default firebase-admin app exactly once for all functions
// in this deployment (aggregate-daily, alert-monitor, investor-token, etc.
// all call admin.firestore() using this shared app instance).
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export { aggregateDaily } from "./aggregate-daily";
export { aiWeeklyBriefing } from "./ai-weekly-briefing";
export { forecastEngine } from "./forecast-engine";
export { investorToken } from "./investor-token";
export { refreshKpi } from "./refresh-kpi";
export { alertMonitor } from "./alert-monitor";
