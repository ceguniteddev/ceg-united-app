// middleware.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { getUser, getUserById } from "@/service/user";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";
import { isPlaidProductionReady } from "./lib/plaid";

const PUBLIC_ROUTES = new Set<string>([
  "/",
  "/register",
  "/api/auth/login",
  "/api/register",
  "/api/auth/verify-session",
  "/api/broker/validate-token",
  "/api/broker/register",
]);
const CLIENT_HOME = "/overview";
const ADMIN_HOME = "/admin/home";
const BROKER_HOME = "/broker/home";

function isPublic(pathname: string) {
  // allow exact public pages and their subpaths (if you add any)
  if (PUBLIC_ROUTES.has(pathname)) return true;
  // example: add /register subpaths if you have any
  return false;
}

function isAdminRoute(pathname: string) {
  return pathname.startsWith("/admin");
}

function isClientRoute(pathname: string) {
  return pathname.startsWith("/overview");
}

function isBrokerRoute(pathname: string) {
  return pathname.startsWith("/broker");
}

export async function proxy(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  const token = req.cookies.get(FIREBASE_TOKEN_NAME)?.value;

  // 1) API first: short-circuit and only 401 if truly unauthenticated
  if (pathname.startsWith("/api/")) {
    const xIdToken = req.headers.get("x-id-token");
    const adminAccessKey = req.headers.get("ADMIN_ACCESS_KEY");
    const authHeader = req.headers.get("Authorization");
    if (xIdToken || adminAccessKey || token || authHeader || isPublic(pathname))
      return NextResponse.next();

    if (!token && !pathname.includes("webhook"))
      return NextResponse.json("Unauthorized", { status: 401 });
    // Optionally verify here if your API routes need auth in middleware
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
  let role: "Admin" | "IT" | "Staff" | "Client" | "Broker" | null = null;

  try {
    // Use the already verified session instead of verifying again
    if (!sessionCookie?.email) throw new Error("Invalid session");
    const user = await getUserById(sessionCookie.uid);
    role = (user?.role as any) ?? "Client";
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
    return NextResponse.redirect(new URL(dest, origin));
  }

  if (pathname === "/my-accounts" && role === "Client") {
    const isPlaidProdReady = isPlaidProductionReady();
    if (!isPlaidProdReady) {
      return NextResponse.redirect(new URL(CLIENT_HOME, origin));
    }
  }

  // Clients cannot access /admin/*
  if (isAdminRoute(pathname) && role === "Client") {
    return NextResponse.redirect(new URL(CLIENT_HOME, origin));
  }

  // Brokers cannot access /admin/*
  if (isAdminRoute(pathname) && role === "Broker") {
    return NextResponse.redirect(new URL(BROKER_HOME, origin));
  }

  // Admins/Staff/IT shouldn't live on client-only pages
  if (isClientRoute(pathname) && role !== "Client") {
    const dest = role === "Broker" ? BROKER_HOME : ADMIN_HOME;
    return NextResponse.redirect(new URL(dest, origin));
  }

  // Admins/Staff/IT/Clients shouldn't access broker pages
  if (isBrokerRoute(pathname) && role !== "Broker") {
    const dest = role === "Client" ? CLIENT_HOME : ADMIN_HOME;
    return NextResponse.redirect(new URL(dest, origin));
  }

  // Otherwise, allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/", // root (we fan out to role home)
    "/register", // public page
    "/my-funding/:path*",
    "/my-accounts/:path*",
    "/my-business/:path*",
    "/my-credit/:path*",
    "/my-documents/:path*",
    "/support-service/:path*",
    "/overview/:path*", // client area
    "/admin/:path*", // admin area
    "/broker/:path*", // broker area
    "/api/:path*", // api guarding
  ],
};
