import { authenticationAdmin } from "@/lib/fireabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { getCookie } from "./session";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";

export const validateXIDToken = async (xIdToken: string) => {
  if (!xIdToken) {
    return null;
  }

  try {
    return await authenticationAdmin().verifyIdToken(xIdToken);
  } catch (error) {
    console.error("ID Token verification failed:", error);
    return null;
  }
};

export async function authenticateRequest(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      console.log("Validating Authorization Bearer token");
      const idToken = authHeader.split("Bearer ")[1];
      return await authenticationAdmin().verifyIdToken(idToken, true);
    }

    let xIdToken = req.headers.get("x-id-token");
    if (xIdToken) {
      console.log("validating x-id-token");
      return await authenticationAdmin().verifyIdToken(xIdToken, true);
    }

    const ADMIN_ACCESS_KEY_HEADER = req.headers.get("ADMIN_ACCESS_KEY");
    if (ADMIN_ACCESS_KEY_HEADER) {
      console.log("validating ADMIN_ACCESS_KEY");
      const ADMIN_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY as string;
      if (
        !ADMIN_ACCESS_KEY ||
        ADMIN_ACCESS_KEY === "undefined" ||
        ADMIN_ACCESS_KEY === "" ||
        ADMIN_ACCESS_KEY !== ADMIN_ACCESS_KEY_HEADER
      ) {
        return NextResponse.json("Unauthorized", { status: 401 });
      }
      return true;
    }

    //get session cookie
    xIdToken = await getCookie(FIREBASE_TOKEN_NAME);
    if (xIdToken) {
      console.log("validating sessionCookie");
      return await authenticationAdmin().verifySessionCookie(xIdToken, true);
    }

    console.log("authenticateRequest Unauthorized");
    return NextResponse.json("Unauthorized", { status: 401 });
  } catch (error) {
    console.error("ID Token verification failed:", error);
    return NextResponse.json("Invalid or expired token", { status: 403 });
  }
}

export const validateToken = async (token: string) => {
  if (!token) return null;

  const auth = authenticationAdmin();

  try {
    return await auth.verifySessionCookie(token);
  } catch (idTokenError) {
    console.warn(
      "Session cookie verification failed, trying to verify ID token instead:",
      idTokenError,
    );

    try {
      return await auth.verifyIdToken(token);
    } catch (sessionError) {
      console.error("ID Token verification failed:", sessionError);
      return null;
    }
  }
};

type Handler = (req: NextRequest, context?: any) => Promise<Response>;

export function withAuth(handler: Handler): Handler {
  return async (req, context) => {
    const user = await authenticateRequest(req);
    if (user instanceof NextResponse) return user;

    return handler(req, context);
  };
}
