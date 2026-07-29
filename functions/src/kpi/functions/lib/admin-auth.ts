/**
 * functions/src/lib/admin-auth.ts
 * ----------------------------------------------------------------------------
 * Minimal shared-secret auth guard for internal/admin-only HTTP functions
 * (forecast-engine, investor-token issuance, refresh-kpi). NOT used by the
 * public investor-view endpoint, which uses the signed JWT instead
 * (see investor-token.ts).
 *
 * This intentionally uses a simple bearer shared secret rather than full
 * Firebase Auth so it can be called from the dashboard's server-side code
 * or from n8n/Cloud Scheduler without wiring a full user session. Swap for
 * Firebase Auth ID token verification if/when the dashboard has real admin
 * user accounts.
 *
 * Env vars:
 *   ADMIN_API_SECRET   (required) Shared secret; dashboard sends it as
 *                      `Authorization: Bearer <ADMIN_API_SECRET>`
 * ----------------------------------------------------------------------------
 */

import { Request, Response, NextFunction } from "express";

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.ADMIN_API_SECRET;
  if (!expected) {
    res.status(500).json({ error: "Server misconfigured: ADMIN_API_SECRET is not set." });
    return;
  }

  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token || token !== expected) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  next();
}
