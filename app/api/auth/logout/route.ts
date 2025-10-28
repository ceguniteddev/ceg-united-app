// app/api/logout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";
import { DecodedIdToken } from "firebase-admin/auth";
import { authenticateRequest } from "@/lib/api-validation";
import { authenticationAdmin } from "@/lib/fireabase-admin";

export async function POST(request: NextRequest) {
  // 1. Authenticate the user to get their UID
  const decodedTokenOrResponse = await authenticateRequest(request);

  console.log("decodedTokenOrResponse", decodedTokenOrResponse);

  // Check if authentication failed
  if (decodedTokenOrResponse instanceof NextResponse) {
    // Even if the token is invalid, we should still try to clear the cookie
    // to help the client recover from a bad state.
    const response = NextResponse.json(
      { message: "Invalid or expired token, clearing session." },
      { status: 401 }
    );
    response.cookies.set({
      name: FIREBASE_TOKEN_NAME,
      value: "",
      maxAge: -1, // Expire immediately
    });
    return response;
  }

  // Type assertion after successful check
  const decodedToken = decodedTokenOrResponse as DecodedIdToken;

  try {
    // 2. SERVER-SIDE: Revoke the user's refresh tokens
    // This invalidates all sessions for the user and forces re-authentication.
    // It's the key to "invalidating" the idToken's usefulness long-term.
    await authenticationAdmin().revokeRefreshTokens(decodedToken.uid);

    // 3. Create a success response
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    // 4. WEB CLIENT: Clear the HttpOnly session cookie
    response.cookies.set({
      name: FIREBASE_TOKEN_NAME,
      value: "",
      maxAge: -1, // Expire immediately
      httpOnly: true,
      secure: process.env.ENVIRONMENT === "production",
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { message: "An internal server error occurred during logout." },
      { status: 500 }
    );
  }
}
