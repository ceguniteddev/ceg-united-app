import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { experian, transunion, equifax, letterContent, title } =
      await req.json();

    const response = await fetch(process.env.PDF_GENERATION_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ceg-api-key": process.env.PDF_API_KEY || "",
      },
      body: JSON.stringify({
        experian,
        transunion,
        equifax,
        letterContent,
        title,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `PDF Function failed: ${response.status} ${response.statusText}`
      );
    }

    const pdfBuffer = await response.arrayBuffer();
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
