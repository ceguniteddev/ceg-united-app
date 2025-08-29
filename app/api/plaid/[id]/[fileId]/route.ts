import "server-only";
import { NextResponse } from "next/server";
import { storageAdmin } from "@/lib/fireabase-admin";

export async function GET(
  _req: Request,
  { params }: { params?: Promise<{ id: string; fileId: string }> }
) {
  const { fileId, id } = (await params) ?? {};
  const filePath = `plaid/${id}/${fileId}.pdf`;

  const bucket = storageAdmin();

  const file = bucket.file(filePath);

  const [exists] = await file.exists();
  if (!exists) return new Response("Not found", { status: 404 });

  const filename = filePath.split("/").pop() ?? "download";
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    responseDisposition: `attachment; filename="${filename}"`,
  });

  return NextResponse.redirect(url);
}
