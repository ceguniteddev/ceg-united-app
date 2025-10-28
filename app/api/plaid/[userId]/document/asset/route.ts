import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { storageAdmin } from "@/lib/fireabase-admin";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";

export const GET = withAuth(
  async (
    _req: NextRequest,
    { params }: { params?: Promise<{ userId: string }> }
  ) => {
    const { userId } = (await params) ?? {};
    if (!userId) {
      return badRequest({ errors: "Missing userId" });
    }

    const prefix = `documents/${userId}/`;
    const bucket = storageAdmin();

    try {
      // ✅ delimiter excludes objects in deeper subfolders
      const [files] = await bucket.getFiles({ prefix, delimiter: "/" });

      // filter out any directory-marker objects (names ending with '/')
      const topLevelFiles = files.filter((f) => !f.name.endsWith("/"));

      if (topLevelFiles.length === 0) {
        return NextResponse.json({ items: [] }, { status: 200 });
      }

      // fetch metadata once per file
      const withMeta = await Promise.all(
        topLevelFiles.map(async (file) => {
          const [metadata] = await file.getMetadata();
          return { file, metadata };
        })
      );

      // keep only PDFs by MIME type (or switch to .endsWith('.pdf') if you prefer)
      const pdfs = withMeta.filter((e) =>
        (e.metadata.contentType ?? "").toLowerCase().includes("pdf")
      );

      if (pdfs.length === 0) {
        return NextResponse.json({ items: [] }, { status: 200 });
      }

      const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

      const items = await Promise.all(
        pdfs.map(async ({ file, metadata }) => {
          let filename = file.name.split("/").pop() ?? "download.pdf";
          if (!filename.toLowerCase().endsWith(".pdf")) filename += ".pdf";

          const [url] = await file.getSignedUrl({
            action: "read",
            expires,
            responseDisposition: `attachment; filename="${filename}"`,
            responseType: "application/pdf",
          });

          return {
            name: filename,
            path: file.name,
            size: Number(metadata.size ?? 0),
            updatedAt: metadata.updated ?? null,
            contentType: metadata.contentType ?? null,
            url,
          };
        })
      );

      return NextResponse.json({ items }, { status: 200 });
    } catch (err) {
      console.error("Failed to list documents", err);
      return internalServerError();
    }
  }
);
