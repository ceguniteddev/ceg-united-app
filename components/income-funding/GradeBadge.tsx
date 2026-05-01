import type { RiskGrade } from '@/lib/income-funding-types'

interface GradeBadgeProps {
  grade: RiskGrade
  size?: 'sm' | 'md' | 'lg'
}

const gradeStyles: Record<RiskGrade, string> = {
  A: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  B: 'bg-blue-50 text-blue-700 border-blue-200',
  C: 'bg-amber-50 text-amber-700 border-amber-200',
  D: 'bg-red-50 text-red-700 border-red-200',
}

const sizeStyles = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-9 w-9 text-base',
  lg: 'h-14 w-14 text-2xl',
}

export function GradeBadge({ grade, size = 'md' }: GradeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center font-bold rounded-xl border ${gradeStyles[grade]} ${sizeStyles[size]}`}
      aria-label={`Risk grade ${grade}`}
    >
      {grade}
    </span>
  )
}
