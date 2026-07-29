/**
 * adapters/asana.ts
 * ----------------------------------------------------------------------------
 * Asana adapter — ops tasks, SLA, employee task completion.
 *
 * SDK: asana (npm install asana) — v3.x, OpenAPI-generated client.
 * Auth: Personal Access Token (see docs/START-HERE-DEVELOPER.md Section 3).
 *
 * Env vars:
 *   ASANA_ACCESS_TOKEN     (required) Personal access token
 *   ASANA_WORKSPACE_GID    (required) Workspace GID
 *   ASANA_SLA_FIELD_NAME   (optional) Custom field name used to mark SLA due time, default "SLA Due"
 *   ASANA_CLIENT_TAG_NAME  (optional) Tag name identifying client-facing tasks, default "client"
 * ----------------------------------------------------------------------------
 */

import { ApiClient, TasksApi, WorkspacesApi } from "asana";
import { Adapter, AdapterTestResult, DateRange, MetricValue } from "../shared/types";
import { metric, optionalEnv, requireEnv, safeDiv, withRetry } from "./_util";

interface AsanaTaskLite {
  gid: string;
  completed: boolean;
  completed_at: string | null;
  due_on: string | null;
  due_at: string | null;
  created_at: string;
  modified_at: string;
  assignee: { gid: string; name: string } | null;
  tags: { gid: string; name: string }[];
  custom_fields: { name: string; display_value: string | null }[];
}

/** Configures the shared Asana ApiClient singleton with the personal access token, exactly once per process. */
let configured = false;
function ensureConfigured(): void {
  if (configured) return;
  const accessToken = requireEnv("ASANA_ACCESS_TOKEN");
  const client = ApiClient.instance;
  const bearerAuth = client.authentications["token"];
  bearerAuth.accessToken = accessToken;
  configured = true;
}

const OPT_FIELDS =
  "completed,completed_at,due_on,due_at,created_at,modified_at,assignee.name,tags.name,custom_fields.name,custom_fields.display_value";

async function fetchTasksModifiedInRange(
  workspaceGid: string,
  range: DateRange
): Promise<AsanaTaskLite[]> {
  const tasksApi = new TasksApi();

  const tasks: AsanaTaskLite[] = [];
  let offset: string | undefined;
  const MAX_PAGES = 200;

  for (let i = 0; i < MAX_PAGES; i++) {
    const resp: any = await withRetry(() =>
      tasksApi.searchTasksForWorkspace(workspaceGid, {
        modified_on_after: range.start,
        modified_on_before: range.end,
        opt_fields: OPT_FIELDS,
        limit: 100,
        ...(offset ? { offset } : {}),
      } as any)
    );

    const page = Array.isArray(resp) ? resp : resp?.data ?? [];
    tasks.push(...page);

    const nextOffset = resp?._response?.next_page?.offset ?? resp?.next_page?.offset;
    if (!nextOffset) break;
    offset = nextOffset;
  }

  return tasks;
}

async function fetchOverdueTasks(workspaceGid: string): Promise<AsanaTaskLite[]> {
  const tasksApi = new TasksApi();
  const today = new Date().toISOString().slice(0, 10);

  const resp: any = await withRetry(() =>
    tasksApi.searchTasksForWorkspace(workspaceGid, {
      completed: false,
      due_on_before: today,
      opt_fields: "completed,due_on,assignee.name",
      limit: 100,
    } as any)
  );

  return Array.isArray(resp) ? resp : resp?.data ?? [];
}

export const asanaAdapter: Adapter = {
  id: "asana",
  displayName: "Asana Ops",

  async test(): Promise<AdapterTestResult> {
    try {
      ensureConfigured();
      const workspaceGid = requireEnv("ASANA_WORKSPACE_GID");
      const workspacesApi = new WorkspacesApi();
      await withRetry(() => workspacesApi.getWorkspace(workspaceGid, {}));
      return { ok: true, message: "Asana connection OK" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  },

  async fetch(range: DateRange): Promise<Record<string, MetricValue>> {
    ensureConfigured();
    const workspaceGid = requireEnv("ASANA_WORKSPACE_GID");
    const slaFieldName = optionalEnv("ASANA_SLA_FIELD_NAME", "SLA Due");
    const clientTagName = optionalEnv("ASANA_CLIENT_TAG_NAME", "client");

    const [tasksInRange, overdueTasks] = await Promise.all([
      fetchTasksModifiedInRange(workspaceGid, range),
      fetchOverdueTasks(workspaceGid),
    ]);

    const completedInRange = tasksInRange.filter((t) => {
      if (!t.completed || !t.completed_at) return false;
      const completedDate = t.completed_at.slice(0, 10);
      return completedDate >= range.start && completedDate <= range.end;
    });

    const completedOnTime = completedInRange.filter((t) => {
      if (!t.due_on) return true; // no due date set -> treat as on-time (can't be late)
      return t.completed_at !== null && t.completed_at.slice(0, 10) <= t.due_on;
    });

    const tasksCompletedOnTime = safeDiv(completedOnTime.length, completedInRange.length || 1);

    const tasksOverdue = overdueTasks.length;

    // "Stuck" client tasks: tagged client-facing, not completed, unmodified for 48+ hours.
    const now = Date.now();
    const clientsStuckOver48h = tasksInRange.filter((t) => {
      const isClientTask = t.tags?.some((tag) => tag.name.toLowerCase() === clientTagName.toLowerCase());
      if (!isClientTask || t.completed) return false;
      const modifiedMs = new Date(t.modified_at).getTime();
      return now - modifiedMs > 48 * 60 * 60 * 1000;
    }).length;

    const tasksWithSLA = tasksInRange.filter((t) =>
      t.custom_fields?.some((f) => f.name === slaFieldName && f.display_value)
    );
    const tasksMeetingSLA = tasksWithSLA.filter((t) => {
      const slaField = t.custom_fields.find((f) => f.name === slaFieldName);
      if (!slaField?.display_value || !t.completed_at) return false;
      const slaDeadline = new Date(slaField.display_value).getTime();
      const completedMs = new Date(t.completed_at).getTime();
      return completedMs <= slaDeadline;
    });
    const employeeSLA = safeDiv(tasksMeetingSLA.length, tasksWithSLA.length || 1);

    // Application-processing throughput: tasks in a project/section conventionally named
    // "Applications" moved to a "Processed" section. Approximated here via tag matching;
    // adjust to match your actual Asana project structure.
    const applicationsProcessed = completedInRange.filter((t) =>
      t.tags?.some((tag) => tag.name.toLowerCase() === "application")
    ).length;

    return {
      tasksCompletedOnTime: metric(tasksCompletedOnTime, {
        format: "percent",
        sampleSize: completedInRange.length,
      }),
      tasksOverdue: metric(tasksOverdue),
      clientsStuckOver48h: metric(clientsStuckOver48h),
      employeeSLA: metric(employeeSLA, { format: "percent", sampleSize: tasksWithSLA.length }),
      applicationsProcessed: metric(applicationsProcessed),
    };
  },
};

export default asanaAdapter;
