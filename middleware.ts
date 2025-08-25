import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log("pathname ", pathname);

  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_TOKEN_NAME)?.value;

  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/overview", req.nextUrl));
  }

  const publicRoutes = ["/", "/register"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
