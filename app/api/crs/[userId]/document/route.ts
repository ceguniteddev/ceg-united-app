import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { storageAdmin } from "@/lib/fireabase-admin";
import { withAuth } from "@/lib/api-validation";
import { randomUUID } from "crypto";
import { getUserById } from "@/service/user";
export const POST = withAuth(
  async (req: NextRequest, { params }: { params?: Promise<{ userId: string }> }) => {
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

      const userData = await getUserById(userId);
      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 400 });
      }

      // GCS bucket
      const bucket = storageAdmin();
      const uniqueId = randomUUID();
      const filename = `${uniqueId}_${userData.firstName} ${userData.lastName}_${file.name}`;
      const path = `documents/${userId}/CRS/${filename}`;

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
);
