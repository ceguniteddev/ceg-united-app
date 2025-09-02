import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { storageAdmin } from "@/lib/fireabase-admin";
import { internalServerError } from "@/app/api/helpers";

export async function POST(req: NextRequest, { params }: { params?: Promise<{ userId: string }> }) {
  try {
    const { userId } = (await params) ?? {};
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // GCS bucket
    const bucket = storageAdmin();
    const filename = `${Date.now()}-${file.name}`;
    const path = `documents/${userId}/${filename}`;

    // Upload buffer to GCS
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const blob = bucket.file(path);
    await blob.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Get metadata and signed URL
    const [metadata] = await blob.getMetadata();
    const [url] = await blob.getSignedUrl({
      action: "read",
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      responseDisposition: `attachment; filename="${file.name}"`,
    });

    return NextResponse.json(
      {
        name: file.name,
        path,
        size: Number(metadata.size ?? 0),
        updatedAt: metadata.updated ?? null,
        contentType: metadata.contentType ?? null,
        url,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Upload failed", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params?: Promise<{ userId: string }> }) {
  const { userId } = (await params) ?? {};
  const prefix = `documents/${userId}/`;
  const bucket = storageAdmin();

  try {
    const [files] = await bucket.getFiles({ prefix });
    if (files.length === 0) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    // fetch metadata for each file once
    const withMeta = await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata();
        return { file, metadata };
      })
    );

    // keep only PDFs by MIME type
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
        if (!filename.includes(".pdf")) filename += ".pdf";

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
