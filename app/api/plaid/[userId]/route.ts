import "server-only";
import { NextResponse } from "next/server";
import { storageAdmin } from "@/lib/fireabase-admin";
import { internalServerError } from "../../helpers";

export async function GET(_req: Request, { params }: { params?: Promise<{ userId: string }> }) {
  const { userId } = (await params) ?? {};
  const prefix = `plaid/${userId}/`;
  const bucket = storageAdmin();

  try {
    // List all objects with the prefix
    const [files] = await bucket.getFiles({ prefix });

    // Keep only PDFs (optional — remove if you want all)
    const pdfs = files.filter((f) => f.name.toLowerCase().endsWith(".pdf"));

    if (pdfs.length === 0) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

    const items = await Promise.all(
      pdfs.map(async (f) => {
        const filename = f.name.split("/").pop() ?? "download.pdf";
        const [metadata] = await f.getMetadata();
        const [url] = await f.getSignedUrl({
          action: "read",
          expires,
          responseDisposition: `attachment; filename="${filename}"`,
        });

        return {
          name: filename,
          path: f.name, // full GCS path
          size: Number(metadata.size ?? 0),
          updatedAt: metadata.updated ?? null,
          contentType: metadata.contentType ?? null,
          url, // signed download URL (valid 5m)
        };
      })
    );

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    console.error("Failed to list plaid documents", err);
    return internalServerError();
  }
}
