import { describe, expect, it } from "vitest";
import { getUniqueAnalysisReports } from "@/lib/analysis-preview";

describe("getUniqueAnalysisReports", () => {
  it("keeps the newest copy even when duplicate reports have different IDs", () => {
    const newest = { id: "new", analysis: "<p>Report</p>" };
    const older = { id: "old", analysis: "\n<p>Report</p>\n" };
    expect(getUniqueAnalysisReports([newest, older])).toEqual([newest]);
  });

  it("preserves distinct reports in their original order without mutating input", () => {
    const reports = Object.freeze([
      { id: "a", analysis: "<p>First report</p>" },
      { id: "b", analysis: "<p>Second report</p>" },
    ]);
    expect(getUniqueAnalysisReports(reports)).toEqual(reports);
  });

  it("skips missing and empty HTML instead of rendering empty iframes", () => {
    expect(
      getUniqueAnalysisReports([{ analysis: " " }, {}, { analysis: "" }]),
    ).toEqual([]);
    expect(getUniqueAnalysisReports([])).toEqual([]);
  });

  it("compares the rendered content using the supplied normalizer", () => {
    const first = { analysis: "<p>Report</p>" };
    const fenced = { analysis: "```html\n<p>Report</p>\n```" };
    const normalize = (html: string) => html.replace(/^```html\n|\n```$/g, "");
    expect(getUniqueAnalysisReports([first, fenced], normalize)).toEqual([
      first,
    ]);
  });

  it("does not collapse meaningful whitespace inside HTML", () => {
    const reports = [
      { analysis: "<pre>a  b</pre>" },
      { analysis: "<pre>a b</pre>" },
    ];
    expect(getUniqueAnalysisReports(reports)).toEqual(reports);
  });
});
