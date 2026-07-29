// ============================================================
// ADAPTER SWAP POINT
// ============================================================
// This file is the ONLY place the dashboard binds to a data
// source.
// Every KPI in the app is read through `useKPI(metric_id)`,
// which reads `activeAdapter`.
// ============================================================
import type { KPIAdapter } from "@/lib/kpi/types";
import { liveAdapter } from "./liveAdapter";

export const activeAdapter: KPIAdapter = liveAdapter;

export const ADAPTER_MODE: "mock" | "live" =
  activeAdapter.name === "mock" ? "mock" : "live";
