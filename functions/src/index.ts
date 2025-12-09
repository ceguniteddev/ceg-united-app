import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import * as puppeteer from "puppeteer";

const pdfApiKey = defineSecret("PDF_API_KEY");

// Set memory to 4GB and timeout to 540s as recommended
export const generatePdf = onRequest(
  { memory: "4GiB", timeoutSeconds: 540, secrets: [pdfApiKey] },
  async (req, res) => {
    // Verify API Key
    const apiKey = req.headers["x-ceg-api-key"];
    if (!apiKey || apiKey !== pdfApiKey.value()) {
      logger.warn("Unauthorized PDF generation attempt");
      res.status(401).send("Unauthorized");
      return;
    }

    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type, x-ceg-api-key");
      res.status(204).send("");
      return;
    }

    let browser;
    try {
      const { experian, transunion, equifax, letterContent, title } = req.body;

      logger.info("Starting PDF generation", { title });

      browser = await puppeteer.launch({
        headless: true,
        timeout: 0,
        slowMo: 0,
        args: [
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-setuid-sandbox",
          "--no-first-run",
          "--no-sandbox",
          "--no-zygote",
          "--window-size=1280,720",
        ],
      });

      const page = await browser.newPage();

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
      browser = undefined;

      res.set("Content-Type", "application/pdf");
      res.set(
        "Content-Disposition",
        `attachment; filename="${(title || "letter").replace(/\s+/g, "_")}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error: any) {
      logger.error("PDF Generation Error", error);
      if (browser) {
        await browser.close();
      }
      res
        .status(500)
        .json({ error: "Failed to generate PDF", details: error.message });
    }
  }
);
