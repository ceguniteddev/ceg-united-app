import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";
import { sendTriggerEmail } from "@/service/trigger-email";
import { EmailJobs, MailAttachment } from "@/schema/trigger-email";
import { getUserDocuments } from "@/service/user";
import { z } from "zod";

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  subject: z.string().min(1),
  content: z.string().min(1),
  userId: z.string(),
  documentPaths: z.array(z.string()).optional(),
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { to, cc, subject, content, userId, documentPaths } =
      sendEmailSchema.parse(body);

    let attachments: MailAttachment[] = [];

    // Fetch and convert documents to base64 if provided
    if (documentPaths && documentPaths.length > 0) {
      // Get all user documents
      const userDocuments = await getUserDocuments({ userId });

      // Filter to only the selected documents
      const selectedDocs = userDocuments.filter((doc) =>
        documentPaths.includes(doc.path),
      );

      // Fetch and convert each document to base64
      attachments = await Promise.all(
        selectedDocs.map(async (doc) => {
          try {
            // Fetch the file from signed URL server-side (no CORS issues)
            const response = await fetch(doc.signedUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${doc.name}`);
            }

            // Convert to base64
            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");

            return {
              filename: doc.name,
              content: base64,
              contentType: doc.contentType || "application/octet-stream",
              encoding: "base64",
            };
          } catch (error) {
            console.error(`Error processing attachment ${doc.name}:`, error);
            throw new Error(`Failed to process attachment: ${doc.name}`);
          }
        }),
      );
    }

    // Send email via Firebase Trigger Email extension
    await sendTriggerEmail({
      to,
      message: {
        subject,
        html: content,
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      cc,
      job: EmailJobs.GENERAL,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 },
    );
  }
});
