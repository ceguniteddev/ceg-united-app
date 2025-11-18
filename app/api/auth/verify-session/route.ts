import { NextRequest, NextResponse } from "next/server";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";
import { verifySession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(FIREBASE_TOKEN_NAME)?.value;

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const sessionCookie = await verifySession(token);

    if (!sessionCookie) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({ valid: true, uid: sessionCookie.uid });
  } catch (error) {
    console.error("Error verifying session:", error);
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
