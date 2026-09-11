// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import puppeteer, { type Browser } from "puppeteer";
import {
  buildAnalysisPreviewHtml,
  isAnalysisHeightMessage,
} from "@/lib/analysis-preview";

describe("analysis height messages", () => {
  const source = {} as Window;
  const message = (height: unknown, sender: unknown = source) =>
    ({
      source: sender,
      data: { type: "iframe-height", height },
    }) as MessageEvent;

  it("accepts only the owning iframe and positive finite heights", () => {
    expect(isAnalysisHeightMessage(message(400), source)).toBe(true);
    for (const height of [0, -1, NaN, Infinity, "400", null]) {
      expect(isAnalysisHeightMessage(message(height), source)).toBe(false);
    }
    expect(isAnalysisHeightMessage(message(400, {}), source)).toBe(false);
    expect(isAnalysisHeightMessage(message(400, null), null)).toBe(false);
  });

  it("inserts the reporter inside a full document and supports fragments", () => {
    const full = buildAnalysisPreviewHtml(
      "<!doctype html><html><body>Report</body></html>",
    );
    expect(full.indexOf("postMessage")).toBeLessThan(full.indexOf("</body>"));
    expect(buildAnalysisPreviewHtml("<p>Report</p>")).toContain("postMessage");
  });
});

describe("analysis iframe sizing in Chromium", () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
  }, 30000);
  afterAll(async () => {
    await browser?.close();
  });

  it.each([1280, 390])(
    "settles and shrinks without trailing blank space at %ipx",
    async (width) => {
      const page = await browser.newPage();
      try {
        await page.setViewport({ width, height: 800 });
        await page.setContent(
          '<!doctype html><iframe title="Report" sandbox="allow-scripts" style="display:block;width:100%;height:600px;border:0"></iframe>',
        );
        const html =
          buildAnalysisPreviewHtml(`<!doctype html><html><head><style>
        body { margin: 0; min-height: 100vh; background: #f3f4f6; }
        section { margin: 48px auto; height: 2400px; max-width: 1024px; background: white; }
      </style></head><body><section>Regression report</section></body></html>`);
        await page.evaluate((srcDoc) => {
          const iframe = document.querySelector("iframe")!;
          window.addEventListener("message", (event) => {
            if (
              event.source === iframe.contentWindow &&
              event.data?.type === "iframe-height"
            ) {
              iframe.style.height = `${event.data.height}px`;
            }
          });
          iframe.srcdoc = srcDoc;
        }, html);
        await page.waitForFunction(
          () => document.querySelector("iframe")?.style.height === "2496px",
        );
        const frame = await (await page.$("iframe"))!.contentFrame();
        // Simulate late CSS/font layout reducing the original document height.
        await frame!.evaluate(() => {
          document.querySelector("section")!.style.height = "400px";
        });
        await page.waitForFunction(
          () => document.querySelector("iframe")?.style.height === "496px",
        );
        // Repeated viewport changes must not feed the previous height back in.
        for (let i = 0; i < 3; i++) {
          await frame!.evaluate(() =>
            window.dispatchEvent(new Event("resize")),
          );
          await page.evaluate(
            () =>
              new Promise<void>((resolve) =>
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => resolve()),
                ),
              ),
          );
        }
        expect(
          await page.$eval("iframe", (el) => el.getBoundingClientRect().height),
        ).toBe(496);
        expect(
          await frame!.evaluate(() => document.documentElement.scrollHeight),
        ).toBe(496);
        // Growing content must still remain fully visible.
        await frame!.evaluate(() => {
          document.querySelector("section")!.style.height = "900px";
        });
        await page.waitForFunction(
          () => document.querySelector("iframe")?.style.height === "996px",
        );
      } finally {
        await page.close();
      }
    },
    15000,
  );
});
