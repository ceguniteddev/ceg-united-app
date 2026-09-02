// middleware.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { getUserById } from "@/service/user";
import { hasActiveAddon } from "@/service/addons";
import { getUserMembership } from "@/service/membership";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";
import { getSystemConfig } from "@/service/system-config";
import { hasPaidMembershipAccess } from "@/lib/membership-entitlement";
import { getClientEntitlements } from "@/service/course-capabilities";

const PUBLIC_ROUTES = new Set<string>([
  "/",
  "/register",
  "/admin-registration",
  "/broker-registration",
  "/verify-email",
  "/api/auth/login",
  "/api/register",
  "/api/leads",
  "/api/leads/upload",
  "/api/auth/verify-session",
  "/api/auth/verify-email",
  "/api/auth/validate-invitation",
  "/api/admin/validate-token",
  "/api/admin/register",
  "/api/broker/validate-token",
  "/api/broker/register",
  "/api/payments/dodo",
  "/api/webhooks/lumino",
  "/api/ocr",
]);
const CLIENT_HOME = "/client/home";
const ADMIN_HOME = "/admin/home";
const BROKER_HOME = "/broker/home";

const CLIENT_ALLOWED_API_PREFIXES = [
  "/api/pdf/generate",
  "/api/dodo/checkout",
  "/api/special-deals",
  "/api/pricing",
  "/api/contact/schedule",
  "/api/funding-application",
  "/api/funding-playbook",
  "/api/auth/refresh-session",
  "/api/ocr",
  "/api/courses",
];

function isAllowedClientApiRoute(pathname: string, uid: string) {
  if (isPublic(pathname)) return true;

  // A client can access their own /api/user/[uid]/... routes
  if (pathname.startsWith(`/api/user/${uid}`)) return true;
  if (pathname.startsWith(`/api/crs/${uid}`)) return true;

  // Check against other allowed prefixes
  return CLIENT_ALLOWED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}

function isPublic(pathname: string) {
  // allow exact public pages and their subpaths (if you add any)
  if (PUBLIC_ROUTES.has(pathname)) return true;
  // Allow all verify-email paths
  if (pathname.startsWith("/verify-email")) return true;

  if (pathname.startsWith("/admin-registration")) return true;

  if (pathname.startsWith("/broker-registration")) return true;

  if (pathname.startsWith("/api/admin/validate-token")) return true;

  if (pathname.startsWith("/api/admin/register")) return true;

  if (pathname.startsWith("/api/broker/validate-token")) return true;

  if (pathname.startsWith("/api/broker/register")) return true;

  if (pathname.startsWith("/api/auth/verify-email")) return true;

  if (pathname.startsWith("/api/auth/validate-invitation")) return true;

  if (pathname.startsWith("/payment")) return true;

  if (pathname.startsWith("/client/courses")) return true;

  // example: add /register subpaths if you have any
  return false;
}

function isAdminRoute(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function isClientRoute(pathname: string) {
  if (pathname.startsWith("/client/courses")) return false;
  return pathname.startsWith("/client") || pathname.startsWith("/api/client");
}

function isBrokerRoute(pathname: string) {
  return pathname.startsWith("/broker") || pathname.startsWith("/api/broker");
}

export async function proxy(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  const token = req.cookies.get(FIREBASE_TOKEN_NAME)?.value;

  // 1) API first: Handle non-session token authentication (system-to-system, external APIs)
  if (pathname.startsWith("/api/")) {
    const xIdToken = req.headers.get("x-id-token");
    const adminAccessKey = req.headers.get("ADMIN_ACCESS_KEY");
    const authHeader = req.headers.get("Authorization");
    console.log("API ", pathname);

    // If using a public route, bypass
    if (isPublic(pathname)) {
      return NextResponse.next();
    }

    // Validate ADMIN_ACCESS_KEY if supplied
    if (adminAccessKey) {
      const expectedKey = process.env.ADMIN_ACCESS_KEY;
      if (
        !expectedKey ||
        expectedKey === "undefined" ||
        expectedKey === "" ||
        adminAccessKey !== expectedKey
      ) {
        return NextResponse.json("Unauthorized: Invalid ADMIN_ACCESS_KEY", {
          status: 401,
        });
      }
      return NextResponse.next();
    }

    // If using other external tokens, allow withAuth to handle validation
    if (xIdToken || authHeader) {
      return NextResponse.next();
    }

    if (!token && !pathname.includes("webhook"))
      return NextResponse.json("Unauthorized", { status: 401 });

    // If using a session cookie (token), fetch role and validate
    if (token) {
      try {
        const sessionCookie = await verifySession(token);
        if (!sessionCookie || !sessionCookie.email)
          throw new Error("Invalid session");

        const user = await getUserById(sessionCookie.uid);
        const role = (user?.role as any) ?? "Client";

        // Guard API routes based on roles
        if (isAdminRoute(pathname)) {
          if (role !== "Admin") {
            return NextResponse.json("Unauthorized: Access denied", {
              status: 403,
            });
          }
        }

        if (isBrokerRoute(pathname)) {
          if (role !== "Broker" && role !== "Admin") {
            return NextResponse.json("Unauthorized: Access denied", {
              status: 403,
            });
          }
        }

        if (role === "Client") {
          if (!isAllowedClientApiRoute(pathname, sessionCookie.uid)) {
            return NextResponse.json("Unauthorized: Access denied", {
              status: 403,
            });
          }

          if (
            pathname.includes("/dispute") ||
            pathname.includes("/dispute-letter")
          ) {
            const [entitlements, hasLegacyAddon] = await Promise.all([
              getClientEntitlements(sessionCookie.uid),
              hasActiveAddon(sessionCookie.uid, "credit_module_pro"),
            ]);
            if (!entitlements.hasDisputeAccess && !hasLegacyAddon) {
              return NextResponse.json(
                "Credit to Capital and active Platform Access are required.",
                { status: 403 },
              );
            }
          }

          if (pathname.startsWith("/api/funding-playbook")) {
            const entitlements = await getClientEntitlements(sessionCookie.uid);
            if (!entitlements.hasNonIncomeFundingAccess) {
              return NextResponse.json(
                "An eligible funding course and active Platform Access are required.",
                { status: 403 },
              );
            }
          }

          if (
            pathname.startsWith(`/api/crs/${sessionCookie.uid}`) ||
            (pathname.includes("/business/") && pathname.endsWith("/audit")) ||
            (pathname.includes("/funding-application/") &&
              pathname.includes("/analysis"))
          ) {
            const entitlements = await getClientEntitlements(sessionCookie.uid);
            const allowed = pathname.includes("/audit")
              ? entitlements.hasAuditAccess
              : pathname.includes("/analysis")
                ? entitlements.hasAnalysisAccess
                : entitlements.hasCreditReportAccess;
            if (!allowed) {
              return NextResponse.json(
                "Active CEG Brain Platform Access is required.",
                { status: 403 },
              );
            }
          }
        }

        return NextResponse.next();
      } catch (error) {
        return NextResponse.json("Unauthorized: Invalid session", {
          status: 401,
        });
      }
    }

    return NextResponse.next();
  }

  // 3) No token → allow public, redirect others to "/"
  if (!token) {
    if (isPublic(pathname)) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  const sessionCookie = await verifySession(token);
  if (!sessionCookie) {
    // Session is expired or invalid
    if (isPublic(pathname)) return NextResponse.next();

    // Clear the invalid cookie and redirect to landing page
    const res = NextResponse.redirect(new URL("/", origin));
    res.cookies.set(FIREBASE_TOKEN_NAME, "", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      expires: new Date(0),
    });
    return res;
  }

  // 4) Token present → verify + find role
  let role: "Admin" | "Client" | "Broker" | null = null;
  let hasPaidContract = false;
  let hasNonIncomeFundingAccess = false;
  let hasDisputeAccess = false;
  let isOnboarded = true;
  let isLegacyPaidMember = false;

  try {
    // Use the already verified session instead of verifying again
    if (!sessionCookie?.email) throw new Error("Invalid session");
    const user = await getUserById(sessionCookie.uid);
    role = (user?.role as any) ?? "Client";
    isOnboarded = user?.isOnboarded !== false;

    console.log(
      "proxy.ts - Calling getUserMembership for userId:",
      sessionCookie.uid,
    );
    const membership = await getUserMembership(sessionCookie.uid);
    hasPaidContract = hasPaidMembershipAccess(membership);
    isLegacyPaidMember = Boolean(
      hasPaidContract && membership && membership.tier !== "platform_access",
    );
    const entitlements = await getClientEntitlements(sessionCookie.uid);
    hasNonIncomeFundingAccess = entitlements.hasNonIncomeFundingAccess;
    hasDisputeAccess = entitlements.hasDisputeAccess;

    // We get isOnboarded so we can conditionally route clients
    // var isOnboarded = true;
  } catch {
    // Bad token/session: clear cookie and kick to "/"
    const res = NextResponse.redirect(new URL("/", origin));
    res.cookies.set(FIREBASE_TOKEN_NAME, "", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      expires: new Date(0),
    });
    return res;
  }

  // 5) Role-based routing
  // Hit root → send to proper home
  if (pathname === "/") {
    let dest = CLIENT_HOME;
    if (role === "Broker") dest = BROKER_HOME;
    else if (role !== "Client") dest = ADMIN_HOME;
    // else if (!isOnboarded) dest = "/onboarding"; // Route to onboarding if client is not onboarded
    return NextResponse.redirect(new URL(dest, origin));
  }

  // CLIENT ROLE: Can only access client routes
  if (role === "Client") {
    if (isAdminRoute(pathname)) {
      return NextResponse.redirect(new URL(CLIENT_HOME, origin));
    }
    if (isBrokerRoute(pathname)) {
      return NextResponse.redirect(new URL(CLIENT_HOME, origin));
    }

    if (
      !hasPaidContract &&
      (pathname.startsWith("/client/my-analysis") ||
        pathname.startsWith("/client/my-credit"))
    ) {
      return NextResponse.redirect(
        new URL("/client/platform-access?required=platform", origin),
      );
    }

    if (
      !hasNonIncomeFundingAccess &&
      (pathname.startsWith("/client/my-funding") ||
        pathname.startsWith("/client/funding-playbook") ||
        pathname.startsWith("/client/_funding-playbook"))
    ) {
      return NextResponse.redirect(
        new URL("/client/platform-access?required=funding-course", origin),
      );
    }

    if (pathname.startsWith("/client/credit-repair")) {
      const systemConfig = await getSystemConfig();
      if (!systemConfig.creditRepairEnabled) {
        return NextResponse.redirect(new URL(CLIENT_HOME, origin));
      }
      const hasCreditRepairAddon = await hasActiveAddon(
        sessionCookie.uid,
        "credit_module_pro",
      );
      if (!hasCreditRepairAddon && !hasDisputeAccess) {
        return NextResponse.redirect(
          new URL("/client/platform-access?required=credit-to-capital", origin),
        );
      }
    }

    if (
      !isOnboarded &&
      !isLegacyPaidMember &&
      isClientRoute(pathname) &&
      pathname !== "/client/platform-access"
    ) {
      return NextResponse.redirect(new URL("/onboarding", origin));
    }

    if ((isOnboarded || isLegacyPaidMember) && pathname === "/onboarding") {
      return NextResponse.redirect(new URL(CLIENT_HOME, origin));
    }
  }

  // BROKER ROLE: Can only access broker routes
  if (role === "Broker") {
    if (isAdminRoute(pathname)) {
      return NextResponse.redirect(new URL(BROKER_HOME, origin));
    }
    if (isClientRoute(pathname)) {
      return NextResponse.redirect(new URL(BROKER_HOME, origin));
    }
  }

  // ADMIN/STAFF/IT ROLES: Can only access admin routes
  if (role === "Admin") {
    if (isClientRoute(pathname)) {
      return NextResponse.redirect(new URL(ADMIN_HOME, origin));
    }
    if (isBrokerRoute(pathname)) {
      return NextResponse.redirect(new URL(ADMIN_HOME, origin));
    }
  }

  // Otherwise, allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/", // root (we fan out to role home)
    "/register", // public page
    "/admin-registration",
    "/broker-registration",
    "/verify-email/:path*", // email verification page
    "/onboarding", // onboarding flow
    // "/my-funding/:path*",
    // "/my-accounts/:path*",
    // "/my-business/:path*",
    // "/my-credit/:path*",
    // "/my-documents/:path*",
    "/support-service/:path*",
    "/client/:path*", // client area
    "/admin/:path*", // admin area
    "/broker/:path*", // broker area
    "/payment/:path*", // payment area
    "/api/:path*", // api guarding
  ],
};
