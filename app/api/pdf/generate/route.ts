import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { experian, transunion, equifax, letterContent, title } =
      await req.json();

    const targetUrl = process.env.PDF_GENERATION_URL!;

    // Construct credentials from environment variables to support local development
    // without needing GOOGLE_APPLICATION_CREDENTIALS set
    let credentials;
    if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
      const decoded = Buffer.from(
        process.env.FIREBASE_PRIVATE_KEY_BASE64,
        "base64"
      ).toString("utf-8");
      const json = JSON.parse(decoded);
      credentials = {
        client_email: json.client_email,
        private_key: json.private_key,
      };
    } else if (
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      credentials = {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      };
    }

    const auth = new GoogleAuth({
      credentials,
    });

    const client = await auth.getIdTokenClient(targetUrl);

    const response = await client.request({
      url: targetUrl,
      method: "POST",
      data: {
        experian,
        transunion,
        equifax,
        letterContent,
        title,
      },
      headers: {
        "Content-Type": "application/json",
        "x-ceg-api-key": process.env.PDF_API_KEY || "",
      },
      responseType: "arraybuffer",
    });

    const pdfBuffer = response.data as ArrayBuffer;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(
          title || "letter"
        ).replace(/\s+/g, "_")}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error.message },
      { status: 500 }
    );
  }
});
