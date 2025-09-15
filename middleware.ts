// middleware.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { getUser } from "@/service/user";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";

const PUBLIC_ROUTES = new Set<string>(["/", "/register"]);
const CLIENT_HOME = "/overview";
const ADMIN_HOME = "/admin";

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

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // 1) API first: short-circuit and only 401 if truly unauthenticated
  if (pathname.startsWith("/api/")) {
    const xIdToken = req.headers.get("x-id-token");
    const adminAccessKey = req.headers.get("ADMIN_ACCESS_KEY");
    if (xIdToken || adminAccessKey) return NextResponse.next();

    const token = req.cookies.get(FIREBASE_TOKEN_NAME)?.value;
    if (!token && !pathname.includes("webhook"))
      return NextResponse.json("Unauthorized", { status: 401 });
    // Optionally verify here if your API routes need auth in middleware
    return NextResponse.next();
  }

  // 2) Read cookie in middleware via req.cookies
  const token = req.cookies.get(FIREBASE_TOKEN_NAME)?.value;

  // 3) No token → allow public, redirect others to "/"
  if (!token) {
    if (isPublic(pathname)) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 4) Token present → verify + find role
  let role: "Admin" | "IT" | "Staff" | "Client" | null = null;

  try {
    const session = await verifySession(token); // should give you { email } or similar
    if (!session?.email) throw new Error("Invalid session");
    const user = await getUser(session.email);
    role = (user?.role as any) ?? null;
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
    const dest = role === "Client" ? CLIENT_HOME : ADMIN_HOME;
    return NextResponse.redirect(new URL(dest, origin));
  }

  // Clients cannot access /admin/*
  if (isAdminRoute(pathname) && role === "Client") {
    return NextResponse.redirect(new URL(CLIENT_HOME, origin));
  }

  // Admins/Staff/IT shouldn't live on client-only pages
  if (isClientRoute(pathname) && role !== "Client") {
    return NextResponse.redirect(new URL(ADMIN_HOME, origin));
  }

  // Otherwise, allow
  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/", // root (we fan out to role home)
    "/register", // public page
    "/apply-funding/:path*",
    "/my-accounts/:path*",
    "/transaction-history/:path*",
    "/overview/:path*", // client area
    "/admin/:path*", // admin area
    "/api/:path*", // api guarding
  ],
};
