import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Set max duration to 60 seconds for PDF generation

export async function POST(req: NextRequest) {
  try {
    const { experian, transunion, equifax, letterContent, title } =
      await req.json();

    let browser;
    let page;

    // Determine environment and launch appropriate browser
    if (
      process.env.ENVIRONMENT === "production" ||
      process.env.ENVIRONMENT === "staging"
    ) {
      const chromium = require("@sparticuz/chromium");
      const puppeteer = require("puppeteer-core");

      // Optional: Load fonts if needed
      // await chromium.font("https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf");

      // browser = await puppeteer.launch({
      //   args: [
      //     ...chromium.args,
      //     "--no-sandbox",
      //     "--disable-setuid-sandbox",
      //     "--disable-dev-shm-usage", // Handle Docker memory limits
      //     "--disable-gpu",
      //   ],
      //   defaultViewport: chromium.defaultViewport,
      //   executablePath: await chromium.executablePath(),
      //   headless: chromium.headless,
      //   ignoreHTTPSErrors: true,
      // });
      browser = await chromium.puppeteer.launch({
        executablePath: await chromium.executablePath,
        args: [...chromium.args, "--no-sandbox"],
        headless: true,
      });
    } else {
      // Local development
      const puppeteer = require("puppeteer");
      browser = await puppeteer.launch({
        headless: true,
      });
    }

    page = await browser.newPage();

    // Construct HTML content
    // We'll use a simple template with page breaks
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; padding: 40px; }
        .page-break { page-break-before: always; }
        .bureau-header { font-size: 14pt; font-weight: bold; margin-bottom: 20px; color: #1e40af; }
        p { margin-bottom: 10px; text-align: justify; }
        ul, ol { margin-bottom: 10px; margin-left: 20px; }
      </style>
    `;

    let fullHtml = `<html><head>${styles}</head><body>`;

    const hasBureauSpecific = experian || transunion || equifax;

    if (hasBureauSpecific) {
      let isFirst = true;

      if (experian) {
        fullHtml += `<div class="bureau-section">
          ${experian}
        </div>`;
        isFirst = false;
      }

      if (transunion) {
        fullHtml += `${!isFirst ? '<div class="page-break"></div>' : ""}
        <div class="bureau-section">
          ${transunion}
        </div>`;
        isFirst = false;
      }

      if (equifax) {
        fullHtml += `${!isFirst ? '<div class="page-break"></div>' : ""}
        <div class="bureau-section">
          ${equifax}
        </div>`;
      }
    } else {
      // Fallback to generic content
      fullHtml += `<div>${letterContent || ""}</div>`;
    }

    fullHtml += "</body></html>";

    await page.setContent(fullHtml, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "40px",
        bottom: "40px",
        left: "40px",
        right: "40px",
      },
    });

    await browser.close();

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
}
