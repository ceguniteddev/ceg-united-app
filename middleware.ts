import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log("pathname ", pathname);

  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_TOKEN_NAME)?.value;
  // console.log("token ", token);
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/overview", req.nextUrl));
  }

  const publicRoutes = ["/", "/register"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublicRoute) {
    // console.log("middleware next ", pathname);
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const xIdToken = req.headers.get("x-id-token");
    const ADMIN_ACCESS_KEY = req.headers.get("ADMIN_ACCESS_KEY");

    if (xIdToken || ADMIN_ACCESS_KEY) return NextResponse.next();

    // console.log("middleware Unauthorized ", pathname);
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  if (!token) {
    // console.log("middleware redirect to / ", pathname);
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
