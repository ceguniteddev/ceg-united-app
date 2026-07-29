/**
 * functions/src/investor-token.ts
 * ----------------------------------------------------------------------------
 * HTTP function exposing two routes:
 *
 *   POST /investor-token   (admin only, shared-secret protected)
 *     Creates a signed, short-lived JWT scoped to read-only investor access.
 *     Body: { issuedTo?: string, expiresInDays?: number }
 *     Response: { token: string, url: string, expiresAt: string }
 *
 *   GET /investor-view/:token
 *     Public route (no admin secret) — validates the JWT signature + expiry,
 *     then returns ONLY the curated InvestorView subset of KPIs:
 *       mrr, capitalFacilitatedYTD, growthMoM, growthYoY, activeClients, ltv
 *
 * ------------------------------------------------------------------------
 * SECURITY / DATA GOVERNANCE — READ THIS BEFORE MODIFYING
 * ------------------------------------------------------------------------
 * This endpoint MUST NEVER return:
 *   - employee names, ids, emails, or performance data (closers, SLA, etc.)
 *   - client names, ids, emails, or any personally identifying information
 *   - raw Firestore documents from `clients`, `deals`, `communications`,
 *     `approvals`, or any collection containing individual-level records
 *
 * The `buildInvestorView()` function below is a strict ALLOW-LIST — it reads
 * ONLY the six named fields out of the latest snapshot's `metrics` map and
 * constructs a brand-new object. It never forwards the snapshot object
 * itself or any other collection's documents. Do not "simplify" this by
 * returning `snapshot.metrics` directly — that would leak the full KPI set
 * to anyone holding a token.
 *
 * See docs/START-HERE-DEVELOPER.md Section 7 for the matching Firestore
 * security rules that also lock down direct client-side reads.
 * ----------------------------------------------------------------------------
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import * as express from "express";
import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { requireAdminAuth } from "./lib/admin-auth";
import { InvestorTokenClaims, InvestorView, KPISnapshot } from "../shared/types";

const app = express();
app.use(express.json());

/** Fields allowed into the investor view. Kept as a literal allow-list, not derived from the KPI registry, so a future registry change can never accidentally widen investor exposure. */
const INVESTOR_SAFE_FIELDS: (keyof InvestorView)[] = [
  "mrr",
  "capitalFacilitatedYTD",
  "growthMoM",
  "growthYoY",
  "activeClients",
  "ltv",
];

function getJwtSecret(): string {
  const secret = process.env.INVESTOR_JWT_SECRET;
  if (!secret) {
    throw new Error("Missing INVESTOR_JWT_SECRET env var — required to sign/verify investor tokens.");
  }
  return secret;
}

// --- POST /investor-token (admin only) --------------------------------------
app.post("/investor-token", requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { issuedTo, expiresInDays } = req.body ?? {};
    const secret = getJwtSecret();

    const expiresIn = `${Math.max(1, Number(expiresInDays) || 90)}d`;

    const claims: Omit<InvestorTokenClaims, "iat" | "exp"> = {
      scope: "investor-readonly",
      issuedTo: typeof issuedTo === "string" ? issuedTo : undefined,
    };

    const token = jwt.sign(claims, secret, { expiresIn: expiresIn as any });
    const decoded = jwt.decode(token) as InvestorTokenClaims;

    const baseUrl = process.env.INVESTOR_PORTAL_BASE_URL ?? "https://your-app.web.app";

    res.status(200).json({
      token,
      url: `${baseUrl}/investor-view/${token}`,
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
    });
  } catch (err) {
    logger.error("investor-token issuance error", err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// --- GET /investor-view/:token (public, token-gated) ------------------------
app.get("/investor-view/:token", async (req: Request, res: Response) => {
  try {
    const secret = getJwtSecret();
    const { token } = req.params;

    let claims: InvestorTokenClaims;
    try {
      claims = jwt.verify(token, secret) as InvestorTokenClaims;
    } catch (err) {
      res.status(401).json({ error: "Invalid or expired investor token." });
      return;
    }

    if (claims.scope !== "investor-readonly") {
      res.status(403).json({ error: "Token does not have investor-readonly scope." });
      return;
    }

    const db = admin.firestore();
    const latestSnap = await db
      .collection("kpi_snapshots")
      .orderBy("date", "desc")
      .limit(1)
      .get();

    if (latestSnap.empty) {
      res.status(503).json({ error: "No KPI data available yet." });
      return;
    }

    const snapshot = latestSnap.docs[0].data() as KPISnapshot;
    const view = buildInvestorView(snapshot);

    res.status(200).json(view);
  } catch (err) {
    logger.error("investor-view error", err);
    res.status(500).json({ error: "Internal error." });
  }
});

/**
 * STRICT ALLOW-LIST projection from a full KPISnapshot down to the six
 * investor-safe fields. This is the only function permitted to read
 * `snapshot.metrics` for the purposes of the investor portal — do not
 * bypass it elsewhere in this file.
 */
export function buildInvestorView(snapshot: KPISnapshot): InvestorView {
  const get = (id: string): number => snapshot.metrics[id]?.value ?? 0;

  const view: InvestorView = {
    asOf: snapshot.date,
    mrr: get("mrr"),
    capitalFacilitatedYTD: get("capitalFacilitatedYTD"),
    growthMoM: get("growthMoM"),
    growthYoY: get("growthYoY"),
    activeClients: get("activeClients"),
    ltv: get("ltv"),
  };

  // Defensive runtime check: ensure the returned object has EXACTLY the
  // allow-listed keys (+ asOf), so a future edit that adds a field above
  // can't silently leak new data without updating INVESTOR_SAFE_FIELDS too.
  const returnedKeys = Object.keys(view).filter((k) => k !== "asOf");
  const unexpected = returnedKeys.filter((k) => !INVESTOR_SAFE_FIELDS.includes(k as keyof InvestorView));
  if (unexpected.length > 0) {
    throw new Error(
      `Investor view guard triggered: unexpected fields ${unexpected.join(", ")} — investor-token.ts was modified unsafely.`
    );
  }

  return view;
}

export const investorToken = onRequest({ timeoutSeconds: 120, memory: "512MiB" }, app as any);
