/**
 * functions/src/ai-weekly-briefing.ts
 * ----------------------------------------------------------------------------
 * Scheduled Cloud Function: runs every Monday at 6:00 AM America/New_York.
 *
 * Reads the past 7 days of `kpi_snapshots`, builds a week-over-week KPI
 * comparison table, sends it to the configured AI provider (see
 * lib/ai-router.ts + ai-briefing-prompt.md), and writes the result to
 * Firestore `briefings/{YYYY-Www}`.
 * ----------------------------------------------------------------------------
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { readFileSync } from "fs";
import { join } from "path";
import { completeWithAI } from "./lib/ai-router";
import { CEOBriefing, DateRange, KPISnapshot } from "../shared/types";
import { KPI_REGISTRY } from "../shared/kpi-registry";

const PROMPT_FILE_PATH = join(__dirname, "ai-briefing-prompt.md");

/** Extracts just the "System Prompt" and "User Prompt Template" fenced code blocks from the markdown doc. */
function loadPromptSections(): { systemPrompt: string; userPromptTemplate: string } {
  const raw = readFileSync(PROMPT_FILE_PATH, "utf-8");

  const systemMatch = raw.match(/## System Prompt[\s\S]*?```\n([\s\S]*?)\n```/);
  const userMatch = raw.match(/## User Prompt Template[\s\S]*?```\n([\s\S]*?)\n```/);

  if (!systemMatch || !userMatch) {
    throw new Error(
      "Could not parse ai-briefing-prompt.md — expected '## System Prompt' and '## User Prompt Template' fenced code blocks."
    );
  }

  return { systemPrompt: systemMatch[1], userPromptTemplate: userMatch[1] };
}

/** Returns the [start, end] ISO dates for "the past 7 days" ending yesterday (UTC), plus the ISO week id. */
export function getPastWeekRange(referenceDate: Date = new Date()): { range: DateRange; weekId: string } {
  const end = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate() - 1));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);

  const weekId = isoWeekId(referenceDate);

  return {
    range: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) },
    weekId,
  };
}

function isoWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

async function fetchSnapshotsInRange(
  db: FirebaseFirestore.Firestore,
  range: DateRange
): Promise<KPISnapshot[]> {
  const snap = await db
    .collection("kpi_snapshots")
    .where("date", ">=", range.start)
    .where("date", "<=", range.end)
    .orderBy("date")
    .get();
  return snap.docs.map((d) => d.data() as KPISnapshot);
}

/** Builds the week-over-week comparison markdown table fed into the AI prompt. */
function buildKPITableMarkdown(thisWeek: KPISnapshot[], lastWeek: KPISnapshot[]): string {
  const avgOf = (snapshots: KPISnapshot[], kpiId: string): number | null => {
    const values = snapshots.map((s) => s.metrics[kpiId]?.value).filter((v): v is number => typeof v === "number");
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const rows: string[] = ["| KPI | This Week | Last Week | Δ |", "|---|---|---|---|"];

  for (const kpi of KPI_REGISTRY) {
    const current = avgOf(thisWeek, kpi.id);
    const previous = avgOf(lastWeek, kpi.id);
    if (current === null && previous === null) continue;

    const deltaStr =
      current !== null && previous !== null && previous !== 0
        ? `${(((current - previous) / previous) * 100).toFixed(1)}%`
        : "n/a";

    rows.push(
      `| ${kpi.id} | ${formatValue(current, kpi.format)} | ${formatValue(previous, kpi.format)} | ${deltaStr} |`
    );
  }

  return rows.join("\n");
}

function formatValue(value: number | null, format: string): string {
  if (value === null) return "n/a";
  switch (format) {
    case "percent":
      return `${(value * 100).toFixed(1)}%`;
    case "currency":
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    default:
      return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
}

function buildAdapterHealthSummary(snapshots: KPISnapshot[]): string {
  if (snapshots.length === 0) return "No snapshots found for this period.";
  const adapterIds = Object.keys(snapshots[0].adapterStatus ?? {});
  const lines = adapterIds.map((id) => {
    const healthyDays = snapshots.filter((s) => s.adapterStatus[id]?.ok).length;
    return `- ${id}: ${healthyDays}/${snapshots.length} days healthy`;
  });
  return lines.join("\n");
}

function buildTargetBenchmarksMarkdown(): string {
  return KPI_REGISTRY.filter((k) => k.target !== undefined || k.targetRange !== undefined)
    .map((k) => {
      const target = k.targetRange
        ? `${k.targetRange[0]}-${k.targetRange[1]}${k.format === "percent" ? "%" : ""}`
        : `${k.target}${k.format === "percent" ? "%" : ""}`;
      return `- ${k.label} (${k.id}): ${target}`;
    })
    .join("\n");
}

/** Parses the AI's markdown output into the structured CEOBriefing.structured shape. */
function parseStructuredSections(markdown: string): CEOBriefing["structured"] {
  const section = (name: string): string => {
    const match = markdown.match(new RegExp(`## ${name}\\n([\\s\\S]*?)(?=\\n## |$)`));
    return match ? match[1].trim() : "";
  };

  const bulletLines = (text: string): string[] =>
    text
      .split("\n")
      .map((l) => l.replace(/^[-*\d.]+\s*/, "").trim())
      .filter(Boolean);

  const anomalyLines = bulletLines(section("Anomalies")).map((line) => {
    const causeMatch = line.match(/\(suspected cause:(.*?)\)/i);
    return {
      kpiId: "",
      description: line.replace(/\(suspected cause:.*?\)/i, "").trim(),
      suspectedCause: causeMatch ? causeMatch[1].trim() : "",
    };
  });

  return {
    tldr: bulletLines(section("TL;DR")),
    wins: bulletLines(section("Wins")),
    losses: bulletLines(section("Losses")),
    anomalies: anomalyLines,
    actions: bulletLines(section("Recommended Actions")),
    deepDives: bulletLines(section("Deep Dives")),
  };
}

export async function runWeeklyBriefing(referenceDate: Date = new Date()): Promise<CEOBriefing> {
  const db = admin.firestore();
  const { range, weekId } = getPastWeekRange(referenceDate);

  const thisWeekStart = range.start;
  const lastWeekRange: DateRange = {
    start: shiftDate(range.start, -7),
    end: shiftDate(range.end, -7),
  };

  const [thisWeek, lastWeek] = await Promise.all([
    fetchSnapshotsInRange(db, range),
    fetchSnapshotsInRange(db, lastWeekRange),
  ]);

  if (thisWeek.length === 0) {
    throw new Error(
      `No kpi_snapshots found for ${range.start} to ${range.end} — cannot generate briefing. Check that aggregate-daily.ts has been running.`
    );
  }

  const { systemPrompt, userPromptTemplate } = loadPromptSections();

  const userPrompt = userPromptTemplate
    .replace("{{weekId}}", weekId)
    .replace("{{rangeStart}}", range.start)
    .replace("{{rangeEnd}}", range.end)
    .replace("{{kpiTableMarkdown}}", buildKPITableMarkdown(thisWeek, lastWeek))
    .replace("{{adapterHealthSummary}}", buildAdapterHealthSummary(thisWeek))
    .replace("{{targetBenchmarksMarkdown}}", buildTargetBenchmarksMarkdown());

  const aiResult = await completeWithAI({ systemPrompt, userPrompt, maxTokens: 1800, temperature: 0.4 });

  const briefing: CEOBriefing = {
    weekId,
    generatedAt: new Date().toISOString(),
    provider: aiResult.provider,
    model: aiResult.model,
    markdown: aiResult.text,
    structured: parseStructuredSections(aiResult.text),
    range,
  };

  await db.collection("briefings").doc(weekId).set(briefing);

  logger.info(`Weekly CEO briefing generated for ${weekId}`, {
    provider: aiResult.provider,
    model: aiResult.model,
    snapshotsUsed: thisWeek.length,
  });

  void thisWeekStart; // retained for readability of range semantics above; not otherwise used

  return briefing;
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Scheduled trigger: every Monday at 6:00 AM America/New_York. */
export const aiWeeklyBriefing = onSchedule(
  { schedule: "0 6 * * 1", timeZone: "America/New_York", timeoutSeconds: 300, memory: "512MiB" },
  async () => {
    await runWeeklyBriefing();
  }
);
