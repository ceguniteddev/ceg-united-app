"use client";
// ============================================================
// Demo state context — the dark toolbar at the top writes here.
// Pages read it to widen/narrow alert volume and thresholds so
// reviewers can see the dashboard under different conditions.
// ============================================================
import { createContext, useContext, type ReactNode } from 'react'
import type { DemoState } from '@/components/kpi/DemoToolbar'

const Ctx = createContext<DemoState>('normal')

export function DemoStateProvider({ value, children }: { value: DemoState; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useDemoState(): DemoState {
  return useContext(Ctx)
}

/** How many alerts to surface for the current demo state. */
export function alertCountFor(state: DemoState): number {
  return state === 'healthy' ? 2 : state === 'normal' ? 5 : state === 'strained' ? 6 : 6
}

/** Health-score adjustment applied by the demo toolbar. */
export function healthOffsetFor(state: DemoState): number {
  return state === 'healthy' ? 11 : state === 'normal' ? 0 : state === 'strained' ? -9 : -21
}
