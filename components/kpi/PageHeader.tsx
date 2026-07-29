"use client";
import type { ReactNode } from 'react'
import { useDateRange } from '@/hooks/kpi/useDateRange'

// ============================================
// Department page header — identical template everywhere
// ============================================

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
  owner,
}: {
  eyebrow: string
  title: string
  description: string
  icon?: any
  action?: ReactNode
  owner?: string
}) {
  const { label, refreshedAt } = useDateRange()
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-1">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          {Icon && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-brand-50">
              <Icon className="w-3.5 h-3.5 text-brand-600" />
            </span>
          )}
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            {eyebrow}
          </span>
        </div>
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900 leading-tight">{title}</h1>
        <p className="mt-1.5 text-[13px] text-gray-500 max-w-2xl leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {action}
        <div className="text-right">
          <p className="text-[11px] font-semibold text-gray-600">{label}</p>
          <p className="text-[10.5px] text-gray-400">
            {owner ? `${owner} · ` : ''}Updated{' '}
            {refreshedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  )
}

/** Consistent page shell: 1440px grid, generous whitespace. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar bg-surface-secondary">
      <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">{children}</div>
    </main>
  )
}
