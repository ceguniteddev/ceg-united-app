import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { storageAdmin } from "@/lib/fireabase-admin";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    const bucket = storageAdmin();
    const file = bucket.file(path);

    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: expiresAt,
    });

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Error previewing document:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});
