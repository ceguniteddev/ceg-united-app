/** Preserve input order (newest first) and never merge different report content. */
export function getUniqueAnalysisReports<T extends { analysis?: string }>(
  reports: readonly T[],
  normalize: (html: string) => string = (html) => html.trim(),
): T[] {
  const seen = new Set<string>();
  return reports.filter((report) => {
    const html = normalize(report.analysis ?? "");
    if (!html || seen.has(html)) return false;
    seen.add(html);
    return true;
  });
}

/** Keep the embedded report's height independent of its iframe viewport. */
export function buildAnalysisPreviewHtml(html: string): string {
  const reporter = `<script>
    (function () {
      var body = document.body;
      var root = document.documentElement;
      // A standalone report's min-h-screen becomes a feedback loop in an
      // auto-sized iframe. Only reset the document shell, not report sections.
      root.style.setProperty('height', 'auto', 'important');
      root.style.setProperty('min-height', '0', 'important');
      body.style.setProperty('height', 'auto', 'important');
      body.style.setProperty('min-height', '0', 'important');
      // Contain first/last child margins so they are included in measurement.
      if (getComputedStyle(body).display === 'block') {
        body.style.setProperty('display', 'flow-root', 'important');
      }

      var lastHeight = -1;
      var scheduled = false;
      function reportHeight() {
        scheduled = false;
        var styles = getComputedStyle(body);
        var height = Math.ceil(body.getBoundingClientRect().height
          + (parseFloat(styles.marginTop) || 0)
          + (parseFloat(styles.marginBottom) || 0));
        if (height > 0 && height !== lastHeight) {
          lastHeight = height;
          window.parent.postMessage({ type: 'iframe-height', height: height }, '*');
        }
      }
      function scheduleHeight() {
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(reportHeight);
        }
      }

      new ResizeObserver(scheduleHeight).observe(body);
      new MutationObserver(scheduleHeight).observe(root, {
        childList: true, subtree: true, attributes: true, characterData: true
      });
      window.addEventListener('load', scheduleHeight);
      window.addEventListener('resize', scheduleHeight);
      document.addEventListener('load', scheduleHeight, true);
      if (document.fonts) document.fonts.ready.then(scheduleHeight);
      scheduleHeight();
    })();
  </script>`;

  // Keep the reporter inside complete documents; fragments also remain valid.
  return /<\/body\s*>/i.test(html)
    ? html.replace(/<\/body\s*>/i, () => `${reporter}</body>`)
    : html + reporter;
}

export function isAnalysisHeightMessage(
  event: MessageEvent,
  source: Window | null | undefined,
): boolean {
  return (
    !!source &&
    event.source === source &&
    event.data?.type === "iframe-height" &&
    typeof event.data.height === "number" &&
    Number.isFinite(event.data.height) &&
    event.data.height > 0
  );
}
