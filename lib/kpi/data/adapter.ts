// ============================================================
// ADAPTER SWAP POINT
// ============================================================
// This file is the ONLY place the dashboard binds to a data
// source. To go live, change the two lines marked below:
//
//   import { firebaseAdapter } from '@ceg/adapters'
//   export const activeAdapter: KPIAdapter = firebaseAdapter
//
// Nothing else in /src changes. Every KPI in the app is read
// through `useKPI(metric_id)`, which reads `activeAdapter`.
// The live adapter lives in /ceg-kpi-os/adapters/ and must
// implement `KPIAdapter` from '@/lib/kpi/types'.
// ============================================================
import type { KPIAdapter } from '@/lib/kpi/types'
import { mockAdapter } from './mockAdapter'

// -------- swap line 1: import the live adapter --------
// -------- swap line 2: assign it here -----------------
export const activeAdapter: KPIAdapter = mockAdapter

export const ADAPTER_MODE: 'mock' | 'live' = activeAdapter.name === 'mock' ? 'mock' : 'live'
